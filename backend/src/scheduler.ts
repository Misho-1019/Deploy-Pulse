import { prisma } from "./lib/prisma.js";
import { checkQueue } from "./queues/checkQueue.js";

const TICK_INTERVAL_MS = 15_000;
let running = false;

export function startScheduler() {
  console.log("[Scheduler] Starting check scheduler (tick every 15s)");

  async function tick() {
    if (running) return; // prevent overlapping ticks
    running = true;

    try {
      const monitors = await prisma.monitor.findMany();

      if (monitors.length === 0) {
        running = false;
        return;
      }

      // Batch: get latest check for all monitors in a single query
      const latestChecks = await prisma.check.groupBy({
        by: ["monitorId"],
        where: {
          monitorId: { in: monitors.map((m) => m.id) },
        },
        _max: { checkedAt: true },
      });

      const latestCheckMap = new Map(
        latestChecks.map((c) => [c.monitorId, c._max.checkedAt])
      );

      const now = Date.now();

      for (const monitor of monitors) {
        const lastChecked = latestCheckMap.get(monitor.id);
        const isDue =
          !lastChecked ||
          now - lastChecked.getTime() >= monitor.interval * 1000;

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
    } finally {
      running = false;
    }
  }

  // Run immediately, then schedule next after current completes
  function scheduleNext() {
    tick().finally(() => {
      setTimeout(scheduleNext, TICK_INTERVAL_MS);
    });
  }

  scheduleNext();
}
