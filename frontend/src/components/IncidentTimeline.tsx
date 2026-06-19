import { useQuery } from '@tanstack/react-query';
import * as monitorsApi from '../api/monitors';

interface Props {
  monitorId: string;
}

export default function IncidentTimeline({ monitorId }: Props) {
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents', monitorId],
    queryFn: () => monitorsApi.getIncidents(monitorId),
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/4 mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-dashed p-5 text-center">
        <p className="text-muted-foreground text-sm">No incidents recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-5">
      <h3 className="font-semibold mb-4">Incident History</h3>
      <div className="space-y-3">
        {incidents.map((incident) => {
          const start = new Date(incident.startedAt);
          const end = incident.resolvedAt ? new Date(incident.resolvedAt) : null;
          const duration = end ? end.getTime() - start.getTime() : Date.now() - start.getTime();

          return (
            <div key={incident.id} className="flex items-start gap-3 text-sm">
              <div className="flex flex-col items-center pt-1">
                <span className={`inline-block w-2 h-2 rounded-full ${incident.resolvedAt ? 'bg-muted-foreground' : 'bg-destructive'}`} />
                {incident.resolvedAt && <div className="w-px h-full bg-border mt-1" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground">
                  <span className="font-medium text-destructive">Down</span>
                  {' — '}{start.toLocaleString()}
                </p>
                {incident.resolvedAt ? (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-green-600 dark:text-green-400">Recovered</span>
                    {' — '}{end!.toLocaleString()}
                    <span className="text-muted-foreground ml-2">({formatDuration(duration)})</span>
                  </p>
                ) : (
                  <p className="text-destructive font-medium">Ongoing</p>
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
