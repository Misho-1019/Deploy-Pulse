import { useState, useEffect } from 'react';
import type { Monitor, MonitorMode } from '../api/monitors';

interface Props {
  open: boolean;
  editing: Monitor | null;
  onClose: () => void;
  onSubmit: (data: { name: string; url: string; mode: MonitorMode; interval: number }) => Promise<void>;
}

const INTERVALS = [
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
];

export default function MonitorForm({ open, editing, onClose, onSubmit }: Props) {
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

  if (!open) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editing ? 'Edit Monitor' : 'New Monitor'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Production API"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://api.myapp.com/health"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('KEEP_ALIVE')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  mode === 'KEEP_ALIVE'
                    ? 'bg-purple-50 border-purple-300 text-purple-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Keep Alive
              </button>
              <button
                type="button"
                onClick={() => setMode('FULL_MONITORING')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  mode === 'FULL_MONITORING'
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Full Monitoring
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {mode === 'KEEP_ALIVE'
                ? 'Just pings the URL to prevent sleep. No alerts.'
                : 'Pings + tracks uptime, response time, and sends alerts.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check Interval
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
