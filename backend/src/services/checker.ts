import { prisma } from "../lib/prisma.js";
import type { CheckStatus } from "../generated/prisma/client.js";

const CHECK_TIMEOUT_MS = 10_000;

export async function performCheck(monitorId: string, url: string) {
  const start = performance.now();

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

    return { status: checkStatus, statusCode, responseTime };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Unknown error";

    await prisma.$transaction([
      prisma.check.create({
        data: {
          monitorId,
          error: errorMessage,
          status: "DOWN",
        },
      }),
      prisma.monitor.update({
        where: { id: monitorId },
        data: { status: "DOWN" },
      }),
    ]);

    return { status: "DOWN" as const, statusCode: null, responseTime: null, error: errorMessage };
  }
}
