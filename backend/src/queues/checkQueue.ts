import { Queue } from "bullmq";
import { env } from "../config/env.js";

export interface CheckJobData {
  monitorId: string;
  url: string;
  name: string;
  mode: string;
}

export const checkQueue = new Queue<CheckJobData>("check-queue", {
  connection: { url: env.REDIS_URL },
});
