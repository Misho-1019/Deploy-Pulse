import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Monitor } from '../api/monitors';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface Props {
  monitor: Monitor;
  onEdit: (monitor: Monitor) => void;
  onDelete: (id: string) => void;
  onToggleChannel: (id: string, channel: string) => void;
  isDeleting?: boolean;
}

export default function MonitorCard({
  monitor,
  onEdit,
  onDelete,
  onToggleChannel,
  isDeleting,
}: Props) {
  const isKeepAlive = monitor.mode === 'KEEP_ALIVE';
  const hasEmail = monitor.channels.includes('EMAIL');
  const hasSlack = monitor.channels.includes('SLACK');
  const latestCheck = monitor.checks?.[0] ?? monitor.latestCheck ?? null;
  const lastChecked = latestCheck
    ? formatSince(new Date(latestCheck.checkedAt).getTime())
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      layout
    >
    <Card className={isKeepAlive
      ? 'border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
      : 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
    }>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {!isKeepAlive && (
                <span className={`shrink-0 w-2 h-2 rounded-full animate-pulse ${
                  monitor.status === 'UP' ? 'bg-green-500' :
                  monitor.status === 'DOWN' ? 'bg-red-500' :
                  'bg-muted-foreground'
                }`} />
              )}
              <Link to={`/app/monitors/${monitor.id}`} className="font-medium text-sm truncate hover:text-primary transition-colors">
                {monitor.name}
              </Link>
              <Badge variant={isKeepAlive ? 'secondary' : 'default'} className="shrink-0 text-[10px]">
                {isKeepAlive ? 'Keep Alive' : 'Monitor'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{monitor.url}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              {lastChecked && <span>Checked {lastChecked}</span>}
              {!isKeepAlive && latestCheck?.responseTime != null && (
                <span>{latestCheck.responseTime}ms</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isKeepAlive && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={() => onToggleChannel(monitor.id, 'EMAIL')}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    hasEmail ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-muted text-muted-foreground'
                  }`}
                >📧</button>
                <button
                  onClick={() => onToggleChannel(monitor.id, 'SLACK')}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    hasSlack ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
                  }`}
                >💬</button>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px]" onClick={() => onEdit(monitor)}>Edit</Button>
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] text-destructive hover:text-destructive" disabled={isDeleting} onClick={() => onDelete(monitor.id)}>
              {isDeleting ? '...' : 'Del'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

function formatSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
