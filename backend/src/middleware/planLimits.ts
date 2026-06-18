const PLAN_LIMITS: Record<
  string,
  { maxMonitors: number; minInterval: number; historyDays: number }
> = {
  FREE: { maxMonitors: 3, minInterval: 600, historyDays: 7 },
  STARTER: { maxMonitors: 25, minInterval: 300, historyDays: 30 },
  PRO: { maxMonitors: 100, minInterval: 60, historyDays: 90 },
};

export function getPlanLimits(plan: string) {
  return (
    PLAN_LIMITS[plan] || PLAN_LIMITS.FREE
  );
}

export function canCreateMonitor(
  plan: string,
  currentCount: number
): { allowed: boolean; message?: string } {
  const limits = getPlanLimits(plan);

  if (currentCount >= limits.maxMonitors) {
    return {
      allowed: false,
      message: `Your ${plan.toLowerCase()} plan allows ${limits.maxMonitors} monitors. Upgrade to add more.`,
    };
  }

  return { allowed: true };
}

export function validateIntervalForPlan(
  plan: string,
  interval: number
): { allowed: boolean; message?: string } {
  const limits = getPlanLimits(plan);

  if (interval < limits.minInterval) {
    const label =
      limits.minInterval >= 60
        ? `${limits.minInterval / 60} minutes`
        : `${limits.minInterval} seconds`;

    return {
      allowed: false,
      message: `Your ${plan.toLowerCase()} plan requires a minimum check interval of ${label}.`,
    };
  }

  return { allowed: true };
}

export function getHistoryClamp(plan: string): Date {
  const limits = getPlanLimits(plan);
  return new Date(Date.now() - limits.historyDays * 24 * 60 * 60 * 1000);
}
