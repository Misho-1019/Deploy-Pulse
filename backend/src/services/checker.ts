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

  // Get previous check to detect status change
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

    await prisma.$transaction([
      prisma.check.create({
        data: {
          monitorId,
          statusCode,
          responseTime,
          status: checkStatus,
        },
      }),
      prisma.monitor.update({
        where: { id: monitorId },
        data: { status: checkStatus },
      }),
    ]);

    await handleStatusTransition(
      monitorId,
      prevStatus,
      checkStatus,
      mode
    );

    return { status: checkStatus, statusCode, responseTime };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Unknown error";

    const checkStatus: CheckStatus = "DOWN";

    await prisma.$transaction([
      prisma.check.create({
        data: {
          monitorId,
          error: errorMessage,
          status: checkStatus,
        },
      }),
      prisma.monitor.update({
        where: { id: monitorId },
        data: { status: checkStatus },
      }),
    ]);

    await handleStatusTransition(
      monitorId,
      prevStatus,
      checkStatus,
      mode
    );

    return {
      status: checkStatus,
      statusCode: null,
      responseTime: null,
      error: errorMessage,
    };
  }
}

async function handleStatusTransition(
  monitorId: string,
  prevStatus: CheckStatus | null,
  newStatus: CheckStatus,
  mode: string
) {
  // Status went from UP (or no previous check) to DOWN → create incident
  if (prevStatus !== "DOWN" && newStatus === "DOWN") {
    const incident = await prisma.incident.create({
      data: {
        monitorId,
        startedAt: new Date(),
      },
    });

    console.log(`[Incident] Created: monitor ${monitorId} is DOWN`);

    if (mode === "FULL_MONITORING") {
      await dispatchDownAlert(monitorId);
    }
  }

  // Status went from DOWN to UP → resolve incident
  if (prevStatus === "DOWN" && newStatus === "UP") {
    await prisma.incident.updateMany({
      where: { monitorId, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });

    console.log(`[Incident] Resolved: monitor ${monitorId} is UP`);

    if (mode === "FULL_MONITORING") {
      await dispatchRecoveryAlert(monitorId);
    }
  }
}
