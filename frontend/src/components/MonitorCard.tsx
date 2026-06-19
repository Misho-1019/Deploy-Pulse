import { Link } from 'react-router-dom';
import type { Monitor } from '../api/monitors';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface Props {
  monitor: Monitor;
  onEdit: (monitor: Monitor) => void;
  onDelete: (id: string) => void;
  onToggleChannel: (id: string, channel: string) => void;
}

const INTERVAL_LABELS: Record<number, string> = {
  60: '1m',
  120: '2m',
  300: '5m',
  600: '10m',
  900: '15m',
  1800: '30m',
  3600: '1h',
};

export default function MonitorCard({
  monitor,
  onEdit,
  onDelete,
  onToggleChannel,
}: Props) {
  const isKeepAlive = monitor.mode === 'KEEP_ALIVE';
  const hasEmail = monitor.channels.includes('EMAIL');
  const hasSlack = monitor.channels.includes('SLACK');

  return (
    <Card className={isKeepAlive ? 'border-purple-200 bg-purple-50/30' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {!isKeepAlive && (
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    monitor.status === 'UP'
                      ? 'bg-green-500'
                      : monitor.status === 'DOWN'
                        ? 'bg-red-500'
                        : 'bg-muted-foreground'
                  }`}
                />
              )}
              <Link
                to={`/app/monitors/${monitor.id}`}
                className="font-medium truncate hover:text-primary transition-colors"
              >
                {monitor.name}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground truncate">{monitor.url}</p>
            {isKeepAlive && (
              <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Keeping alive &middot; every {INTERVAL_LABELS[monitor.interval] || `${monitor.interval}s`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(monitor)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(monitor.id)}>
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant={isKeepAlive ? 'secondary' : 'default'}>
            {isKeepAlive ? 'Keep Alive' : 'Full Monitoring'}
          </Badge>

          {!isKeepAlive && (
            <Badge variant={
              monitor.status === 'UP' ? 'outline' :
              monitor.status === 'DOWN' ? 'destructive' : 'secondary'
            }>
              {monitor.status}
            </Badge>
          )}

          {!isKeepAlive && (
            <span className="text-xs text-muted-foreground">
              Check every {INTERVAL_LABELS[monitor.interval] || `${monitor.interval}s`}
            </span>
          )}
        </div>

        {!isKeepAlive && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Notify via:</span>
            <button
              onClick={() => onToggleChannel(monitor.id, 'EMAIL')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                hasEmail
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => onToggleChannel(monitor.id, 'SLACK')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                hasSlack
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              💬 Slack
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
