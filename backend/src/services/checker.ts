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
    const checkStatus: CheckStatus = isUp ? "UP" : "DOWN";

    // Transaction includes check + status update + incident tracking
    await prisma.$transaction(async (tx) => {
      await tx.check.create({
        data: { monitorId, statusCode, responseTime, status: checkStatus },
      });
      await tx.monitor.update({
        where: { id: monitorId },
        data: { status: checkStatus },
      });
      await handleStatusTransitionInTx(tx, monitorId, prevStatus, checkStatus);
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

    await prisma.$transaction(async (tx) => {
      await tx.check.create({
        data: { monitorId, error: errorMessage, status: checkStatus },
      });
      await tx.monitor.update({
        where: { id: monitorId },
        data: { status: checkStatus },
      });
      await handleStatusTransitionInTx(tx, monitorId, prevStatus, checkStatus);
    });

    if (mode === "FULL_MONITORING" && prevStatus !== "DOWN") {
      await dispatchDownAlert(monitorId);
    }

    return {
      status: checkStatus,
      statusCode: null,
      responseTime: null,
      error: errorMessage,
    };
  }
}

async function handleStatusTransitionInTx(
  tx: any,
  monitorId: string,
  prevStatus: CheckStatus | null,
  newStatus: CheckStatus
) {
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
