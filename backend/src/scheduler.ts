import { prisma } from "./lib/prisma.js";
import { checkQueue } from "./queues/checkQueue.js";

const TICK_INTERVAL_MS = 15_000;

export function startScheduler() {
  console.log("[Scheduler] Starting check scheduler (tick every 15s)");

  async function tick() {
    try {
      const monitors = await prisma.monitor.findMany();

      for (const monitor of monitors) {
        const latestCheck = await prisma.check.findFirst({
          where: { monitorId: monitor.id },
          orderBy: { checkedAt: "desc" },
          select: { checkedAt: true },
        });

        const isDue =
          !latestCheck ||
          Date.now() - latestCheck.checkedAt.getTime() >=
            monitor.interval * 1000;

        if (isDue) {
          await checkQueue.add(
            "check",
            {
              monitorId: monitor.id,
              url: monitor.url,
              name: monitor.name,
              mode: monitor.mode,
            },
            {
              jobId: `check-${monitor.id}-${Date.now()}`,
              removeOnComplete: true,
              removeOnFail: 100,
            }
          );
        }
      }
    } catch (err) {
      console.error("[Scheduler] Error:", err);
    }
  }

  tick();
  setInterval(tick, TICK_INTERVAL_MS);
}
