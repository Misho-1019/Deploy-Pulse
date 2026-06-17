import { Worker } from "bullmq";
import { checkQueue } from "../queues/checkQueue.js";
import { performCheck } from "../services/checker.js";

const worker = new Worker(
  checkQueue.name,
  async (job) => {
    const { monitorId, url, name, mode } = job.data;

    const result = await performCheck(monitorId, url, mode);
    console.log(
      `[Worker] ${name} → ${result.status}` +
        (result.statusCode ? ` (${result.statusCode}, ${result.responseTime}ms)` : "") +
        (result.error ? ` [${result.error}]` : "")
    );
  },
  {
    connection: checkQueue.opts.connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  }
);

worker.on("ready", () => {
  console.log("[Worker] Check worker ready");
});

worker.on("error", (err) => {
  console.error("[Worker] Error:", err);
});

export { worker };
