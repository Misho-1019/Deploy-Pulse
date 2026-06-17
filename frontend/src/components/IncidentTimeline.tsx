import { useState, useEffect } from 'react';
import * as monitorsApi from '../api/monitors';
import type { Incident } from '../api/monitors';

interface Props {
  monitorId: string;
}

export default function IncidentTimeline({ monitorId }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitorsApi
      .getIncidents(monitorId)
      .then(setIncidents)
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  }, [monitorId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-16 bg-gray-200 rounded" />
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed border-gray-300 p-5 text-center">
        <p className="text-gray-400 text-sm">No incidents recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Incident History</h3>
      <div className="space-y-3">
        {incidents.map((incident) => {
          const start = new Date(incident.startedAt);
          const end = incident.resolvedAt
            ? new Date(incident.resolvedAt)
            : null;
          const duration = end
            ? end.getTime() - start.getTime()
            : Date.now() - start.getTime();

          return (
            <div
              key={incident.id}
              className="flex items-start gap-3 text-sm"
            >
              <div className="flex flex-col items-center pt-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    incident.resolvedAt ? 'bg-gray-300' : 'bg-red-500'
                  }`}
                />
                {incident.resolvedAt && (
                  <div className="w-px h-full bg-gray-200 mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700">
                  <span className="font-medium text-red-600">Down</span>
                  {' — '}
                  {start.toLocaleString()}
                </p>
                {incident.resolvedAt ? (
                  <p className="text-gray-500">
                    <span className="font-medium text-green-600">Recovered</span>
                    {' — '}
                    {end!.toLocaleString()}
                    <span className="text-gray-400 ml-2">
                      ({formatDuration(duration)})
                    </span>
                  </p>
                ) : (
                  <p className="text-red-500 font-medium">Ongoing</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMinutes}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}
