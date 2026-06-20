import { prisma } from "../lib/prisma.js";
import type { CheckStatus } from "../generated/prisma/client.js";
import { dispatchDownAlert, dispatchRecoveryAlert } from "./alert.js";

const CHECK_TIMEOUT_MS = 10_000;

export async function performCheck(
  monitorId: string,
  url: string,
  mode: string
) {
  const start = performance.now();

  const previousCheck = await prisma.check.findFirst({
    where: { monitorId },
    orderBy: { checkedAt: "desc" },
    select: { status: true },
  });

  const prevStatus = previousCheck?.status ?? null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    const responseTime = Math.round(performance.now() - start);
    const statusCode = response.status;
    const isUp = statusCode >= 200 && statusCode < 400;
    const isFast = responseTime < 2000;

    // Keep Alive: fast response = app is awake (regardless of HTTP status)
    let checkStatus: CheckStatus;
    if (mode === "KEEP_ALIVE") {
      checkStatus = isFast ? "UP" : "DOWN";
    } else {
      checkStatus = isUp ? "UP" : "DOWN";
    }

    const interpretation = getInterpretation(mode, statusCode, responseTime, isFast, null);

    // Transaction includes check + status update + incident tracking
    await prisma.$transaction(async (tx) => {
      await tx.check.create({
        data: { monitorId, statusCode, responseTime, status: checkStatus, error: interpretation },
      });
      await tx.monitor.update({
        where: { id: monitorId },
        data: { status: checkStatus },
      });
      await handleStatusTransitionInTx(tx, monitorId, prevStatus, checkStatus, mode);
    });

    // Alert dispatch is safe outside transaction (idempotent)
    if (mode === "FULL_MONITORING") {
      if (prevStatus !== "DOWN" && checkStatus === "DOWN") {
        await dispatchDownAlert(monitorId);
      } else if (prevStatus === "DOWN" && checkStatus === "UP") {
        await dispatchRecoveryAlert(monitorId);
      }
    }

    return { status: checkStatus, statusCode, responseTime };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Unknown error";

    const checkStatus: CheckStatus = "DOWN";
    const interpretation = mode === "KEEP_ALIVE" ? "Timed out" : `Timed out`;

    await prisma.$transaction(async (tx) => {
      await tx.check.create({
        data: { monitorId, error: interpretation, status: checkStatus, statusCode: null, responseTime: null },
      });
      await tx.monitor.update({
        where: { id: monitorId },
        data: { status: checkStatus },
      });
      await handleStatusTransitionInTx(tx, monitorId, prevStatus, checkStatus, mode);
    });

    if (mode === "FULL_MONITORING" && prevStatus !== "DOWN") {
      await dispatchDownAlert(monitorId);
    }

    return {
      status: checkStatus,
      statusCode: null,
      responseTime: null,
      error: interpretation,
    };
  }
}

function getInterpretation(mode: string, statusCode: number, responseTime: number, isFast: boolean, errorDetail: string | null): string {
  if (errorDetail) return errorDetail;
  if (mode === "KEEP_ALIVE") {
    if (isFast && statusCode >= 200 && statusCode < 300) return "Healthy";
    if (isFast && statusCode === 404) return "App responded";
    if (isFast && statusCode >= 300 && statusCode < 400) return "Redirected";
    if (isFast && statusCode >= 400 && statusCode < 500) return "Bad request (alive)";
    if (isFast && statusCode >= 500) return "Server error (alive)";
    if (!isFast && statusCode) return "Slow response";
    return "Timed out";
  }
  // Full Monitoring
  if (statusCode >= 200 && statusCode < 300) return `Healthy (${responseTime}ms)`;
  if (statusCode === 404) return "Not found";
  if (statusCode >= 400 && statusCode < 500) return "Client error";
  if (statusCode >= 500) return "Server error";
  return "Timed out";
}

async function handleStatusTransitionInTx(
  tx: any,
  monitorId: string,
  prevStatus: CheckStatus | null,
  newStatus: CheckStatus,
  mode: string
) {
  if (mode !== "FULL_MONITORING") return;
  if (prevStatus !== "DOWN" && newStatus === "DOWN") {
    await tx.incident.create({
      data: { monitorId, startedAt: new Date() },
    });
    console.log(`[Incident] Created: monitor ${monitorId} is DOWN`);
  }
  if (prevStatus === "DOWN" && newStatus === "UP") {
    await tx.incident.updateMany({
      where: { monitorId, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
    console.log(`[Incident] Resolved: monitor ${monitorId} is UP`);
  }
}
