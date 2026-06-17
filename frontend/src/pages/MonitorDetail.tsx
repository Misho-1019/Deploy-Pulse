import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as monitorsApi from '../api/monitors';
import type { Monitor, Check } from '../api/monitors';

const STATUS_STYLES: Record<string, string> = {
  UP: 'bg-green-100 text-green-800',
  DOWN: 'bg-red-100 text-red-800',
  PENDING: 'bg-gray-100 text-gray-600',
};

const MODE_LABELS: Record<string, string> = {
  KEEP_ALIVE: 'Keep Alive',
  FULL_MONITORING: 'Full Monitoring',
};

export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    monitorsApi
      .getMonitor(id)
      .then(setMonitor)
      .catch(() => setError('Monitor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || 'Monitor not found'}</p>
        <Link to="/" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const checks: Check[] = monitor.checks || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr;
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold text-gray-900 truncate">
            {monitor.name}
          </h2>
          <p className="text-sm text-gray-500 truncate">{monitor.url}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Status</p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
              STATUS_STYLES[monitor.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                monitor.status === 'UP'
                  ? 'bg-green-500'
                  : monitor.status === 'DOWN'
                    ? 'bg-red-500'
                    : 'bg-gray-300'
              }`}
            />
            {monitor.status}
          </span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Mode</p>
          <p className="text-sm font-medium text-gray-900">
            {MODE_LABELS[monitor.mode] || monitor.mode}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Interval</p>
          <p className="text-sm font-medium text-gray-900">
            {monitor.interval === 60
              ? '1 minute'
              : monitor.interval === 120
                ? '2 minutes'
                : monitor.interval === 300
                  ? '5 minutes'
                  : `${monitor.interval}s`}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Last Check</p>
          <p className="text-sm font-medium text-gray-900">
            {checks.length > 0
              ? formatTime(checks[0].checkedAt)
              : 'No checks yet'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Check History</h3>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          Back to Dashboard
        </button>
      </div>

      {checks.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 text-center py-10">
          <p className="text-gray-400">Waiting for first check...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Response</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {checks.map((check) => (
                <tr key={check.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        check.status === 'UP'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                          check.status === 'UP' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      {check.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {check.statusCode ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {check.responseTime != null ? `${check.responseTime}ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatTime(check.checkedAt)}
                  </td>
                  <td className="px-4 py-3 text-red-600 text-xs max-w-48 truncate">
                    {check.error || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}
