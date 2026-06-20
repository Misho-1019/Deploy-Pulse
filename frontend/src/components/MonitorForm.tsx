import { useState, useEffect } from 'react';
import type { Monitor, MonitorMode } from '../api/monitors';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

interface Props {
  open: boolean;
  editing: Monitor | null;
  minInterval?: number;
  onClose: () => void;
  onSubmit: (data: { name: string; url: string; mode: MonitorMode; interval: number }) => Promise<void>;
}

const ALL_INTERVALS = [
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
];

export default function MonitorForm({ open, editing, minInterval = 300, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<MonitorMode>('KEEP_ALIVE');
  const [interval, setInterval] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setUrl(editing.url);
      setMode(editing.mode);
      setInterval(editing.interval);
    } else {
      setName('');
      setUrl('');
      setMode('KEEP_ALIVE');
      setInterval(300);
    }
    setError('');
  }, [editing, open]);

  const intervals = ALL_INTERVALS.filter((i) => i.value >= minInterval);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({ name, url, mode, interval });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Monitor' : 'New Monitor'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update your monitor settings.' : 'Add a URL to start monitoring.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production API"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <Input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.myapp.com/health"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mode</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'KEEP_ALIVE' ? 'default' : 'outline'}
                onClick={() => setMode('KEEP_ALIVE')}
                className="flex-1"
                size="sm"
              >
                Keep Alive
              </Button>
              <Button
                type="button"
                variant={mode === 'FULL_MONITORING' ? 'default' : 'outline'}
                onClick={() => setMode('FULL_MONITORING')}
                className="flex-1"
                size="sm"
              >
                Full Monitoring
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'KEEP_ALIVE'
                ? 'Pings your app to prevent sleep. No alerts. No status tracking.'
                : 'Pings + uptime, response time, and alerts.'}
            </p>
            {mode === 'KEEP_ALIVE' && (
              <div className="mt-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-2 rounded text-xs">
                Checks wait up to <strong>50 seconds</strong> for your app to respond.
                Free-tier Render, Railway, and Heroku apps may take 15-30 seconds to cold-start.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Check Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {intervals.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Monitor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
