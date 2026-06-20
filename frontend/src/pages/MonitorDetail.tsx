import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as monitorsApi from '../api/monitors';
import type { Check } from '../api/monitors';
import UptimeBadges from '../components/UptimeBadges';
import ResponseChart from '../components/ResponseChart';
import IncidentTimeline from '../components/IncidentTimeline';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const STATUS_VARIANTS: Record<string, 'default' | 'destructive' | 'secondary'> = {
  UP: 'default',
  DOWN: 'destructive',
  PENDING: 'secondary',
};

const MODE_LABELS: Record<string, string> = {
  KEEP_ALIVE: 'Keep Alive',
  FULL_MONITORING: 'Full Monitoring',
};

export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    data: monitor,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['monitor', id],
    queryFn: () => monitorsApi.getMonitor(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  if (isError || !monitor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Monitor not found</p>
        <Button variant="link" asChild>
          <Link to="/app">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const checks: Check[] = monitor.checks || [];
  const [visibleCount, setVisibleCount] = useState(20);
  const displayedChecks = checks.slice(0, visibleCount);
  const hasMore = checks.length > visibleCount;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app" className="text-muted-foreground hover:text-foreground">&larr;</Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold truncate">{monitor.name}</h2>
          <p className="text-sm text-muted-foreground truncate">{monitor.url}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Status</p>
            <Badge variant={STATUS_VARIANTS[monitor.status] || 'secondary'}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                monitor.status === 'UP' ? 'bg-green-500' : monitor.status === 'DOWN' ? 'bg-red-500' : 'bg-gray-300'
              }`}/>
              {monitor.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Mode</p>
            <p className="text-sm font-medium">{MODE_LABELS[monitor.mode]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Interval</p>
            <p className="text-sm font-medium">
              {monitor.interval === 60 ? '1 min' : monitor.interval === 120 ? '2 min' : monitor.interval === 300 ? '5 min' : `${monitor.interval}s`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Last Check</p>
            <p className="text-sm font-medium">
              {checks.length > 0 ? formatTime(checks[0].checkedAt) : 'No checks yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {monitor.mode === 'FULL_MONITORING' && (
        <>
          <UptimeBadges monitorId={monitor.id} />
          <div className="mb-6">
            <ResponseChart monitorId={monitor.id} />
          </div>
          <div className="overflow-x-auto mb-6">
            <IncidentTimeline monitorId={monitor.id} />
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Check History</h3>
      </div>

      {checks.length === 0 ? (
        <div className="bg-card rounded-lg border border-dashed text-center py-10">
          <svg className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-muted-foreground">Waiting for first check...</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Response</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedChecks.map((check) => (
                <tr key={check.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Badge variant={check.status === 'UP' ? 'default' : 'destructive'}>
                      {check.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">{check.statusCode ?? '-'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{check.responseTime != null ? `${check.responseTime}ms` : '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTime(check.checkedAt)}</td>
                  <td className="px-4 py-3 text-destructive text-xs max-w-48 truncate hidden sm:table-cell">{check.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div className="px-4 py-3 border-t text-center">
              <Button
                variant="ghost"
                onClick={() => setVisibleCount((c) => c + 20)}
              >
                Show more ({checks.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}
