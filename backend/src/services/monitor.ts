import { prisma } from "../lib/prisma.js";
import type { MonitorMode } from "../generated/prisma/client.js";

const VALID_URL_REGEX = /^https?:\/\/.+/;
const VALID_INTERVALS = [60, 120, 300, 600, 900, 1800, 3600];

export interface CreateMonitorInput {
  name: string;
  url: string;
  mode: MonitorMode;
  interval?: number;
}

export interface UpdateMonitorInput {
  name?: string;
  url?: string;
  mode?: MonitorMode;
  interval?: number;
}

function validateUrl(url: string) {
  if (!url || !VALID_URL_REGEX.test(url)) {
    throw new AppError("URL must start with http:// or https://", 400);
  }
  try {
    new URL(url);
  } catch {
    throw new AppError("Invalid URL format", 400);
  }
}

function validateInterval(interval: number) {
  if (!VALID_INTERVALS.includes(interval)) {
    throw new AppError(
      `Interval must be one of: ${VALID_INTERVALS.join(", ")} seconds`,
      400
    );
  }
}

function validateMode(mode: string) {
  if (mode !== "KEEP_ALIVE" && mode !== "FULL_MONITORING") {
    throw new AppError('Mode must be KEEP_ALIVE or FULL_MONITORING', 400);
  }
}

export async function createMonitor(userId: string, input: CreateMonitorInput) {
  validateUrl(input.url);
  validateMode(input.mode);

  if (input.interval !== undefined) {
    validateInterval(input.interval);
  }

  const interval = input.interval || 300;

  return prisma.monitor.create({
    data: {
      name: input.name.trim(),
      url: input.url.trim(),
      mode: input.mode,
      interval,
      userId,
    },
  });
}

export async function getMonitors(userId: string) {
  return prisma.monitor.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMonitor(id: string, userId: string) {
  const monitor = await prisma.monitor.findFirst({
    where: { id, userId },
    include: {
      checks: { orderBy: { checkedAt: "desc" }, take: 20 },
    },
  });

  if (!monitor) {
    throw new AppError("Monitor not found", 404);
  }

  return monitor;
}

export async function updateMonitor(
  id: string,
  userId: string,
  input: UpdateMonitorInput
) {
  const existing = await prisma.monitor.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new AppError("Monitor not found", 404);
  }

  if (input.url !== undefined) validateUrl(input.url);
  if (input.mode !== undefined) validateMode(input.mode);
  if (input.interval !== undefined) validateInterval(input.interval);

  return prisma.monitor.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.url !== undefined && { url: input.url.trim() }),
      ...(input.mode !== undefined && { mode: input.mode }),
      ...(input.interval !== undefined && { interval: input.interval }),
    },
  });
}

export async function deleteMonitor(id: string, userId: string) {
  const existing = await prisma.monitor.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new AppError("Monitor not found", 404);
  }

  await prisma.monitor.delete({ where: { id } });
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}
