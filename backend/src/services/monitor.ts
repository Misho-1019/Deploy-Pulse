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

export async function getUptimeStats(monitorId: string, userId: string) {
  const monitor = await prisma.monitor.findFirst({ where: { id: monitorId, userId } });
  if (!monitor) throw new AppError("Monitor not found", 404);

  const now = new Date();
  const periods: { key: string; since: Date }[] = [
    { key: "day", since: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    { key: "week", since: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { key: "month", since: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
  ];

  const result: Record<string, number> = {};

  for (const { key, since } of periods) {
    const groups = await prisma.check.groupBy({
      by: ["status"],
      where: { monitorId, checkedAt: { gte: since } },
      _count: { status: true },
    });

    const total = groups.reduce((sum, g) => sum + g._count.status, 0);

    if (total === 0) {
      result[key] = 0;
    } else {
      const upCount = groups.find((g) => g.status === "UP")?._count.status ?? 0;
      result[key] = Math.round((upCount / total) * 10000) / 100;
    }
  }

  return result;
}

export async function getResponseTimeData(
  monitorId: string,
  userId: string,
  period: string
) {
  const monitor = await prisma.monitor.findFirst({ where: { id: monitorId, userId } });
  if (!monitor) throw new AppError("Monitor not found", 404);

  const hours = period === "day" ? 24 : period === "week" ? 168 : 720;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const checks = await prisma.check.findMany({
    where: {
      monitorId,
      checkedAt: { gte: since },
      responseTime: { not: null },
    },
    select: { responseTime: true, checkedAt: true },
    orderBy: { checkedAt: "asc" },
  });

  return checks.map((c) => ({
    time: c.checkedAt.toISOString(),
    value: c.responseTime as number,
  }));
}

export async function getIncidents(monitorId: string, userId: string) {
  const monitor = await prisma.monitor.findFirst({ where: { id: monitorId, userId } });
  if (!monitor) throw new AppError("Monitor not found", 404);

  return prisma.incident.findMany({
    where: { monitorId },
    orderBy: { startedAt: "desc" },
  });
}

export async function toggleChannel(
  monitorId: string,
  userId: string,
  channel: string
) {
  const monitor = await prisma.monitor.findFirst({ where: { id: monitorId, userId } });
  if (!monitor) throw new AppError("Monitor not found", 404);

  if (channel !== "EMAIL" && channel !== "SLACK") {
    throw new AppError("Invalid channel. Use EMAIL or SLACK", 400);
  }

  const channels = monitor.channels as string[];
  const updated = channels.includes(channel)
    ? channels.filter((c) => c !== channel)
    : [...channels, channel];

  return prisma.monitor.update({
    where: { id: monitorId },
    data: { channels: updated as any },
  });
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}
