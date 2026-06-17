import { useState, useEffect } from 'react';
import * as monitorsApi from '../api/monitors';

interface Props {
  monitorId: string;
}

export default function UptimeBadges({ monitorId }: Props) {
  const [stats, setStats] = useState<{
    day: number;
    week: number;
    month: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorsApi
      .getUptimeStats(monitorId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [monitorId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-1" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  function badgeColor(value: number) {
    if (value >= 99.9) return 'bg-green-50 text-green-700 border-green-200';
    if (value >= 95) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  }

  const periods: Array<{ key: keyof typeof stats; label: string }> = [
    { key: 'day', label: '24h' },
    { key: 'week', label: '7 days' },
    { key: 'month', label: '30 days' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {periods.map(({ key, label }) => (
        <div
          key={key}
          className={`rounded-lg border p-3 text-center ${badgeColor(stats[key])}`}
        >
          <p className="text-xs font-medium uppercase mb-0.5">{label}</p>
          <p className="text-xl font-bold">{stats[key].toFixed(1)}%</p>
        </div>
      ))}
    </div>
  );
}
