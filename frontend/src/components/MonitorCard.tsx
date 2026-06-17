import { Link } from 'react-router-dom';
import type { Monitor } from '../api/monitors';

interface Props {
  monitor: Monitor;
  onEdit: (monitor: Monitor) => void;
  onDelete: (id: string) => void;
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

export default function MonitorCard({ monitor, onEdit, onDelete }: Props) {
  const isKeepAlive = monitor.mode === 'KEEP_ALIVE';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-5 transition-colors ${
        isKeepAlive ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'
      }`}
    >
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
                      : 'bg-gray-300'
                }`}
              />
            )}
            <Link
              to={`/app/monitors/${monitor.id}`}
              className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors"
            >
              {monitor.name}
            </Link>
          </div>
          <p className="text-sm text-gray-500 truncate">{monitor.url}</p>
          {isKeepAlive && (
            <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Keeping alive &middot; every {INTERVAL_LABELS[monitor.interval] || `${monitor.interval}s`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(monitor)}
            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(monitor.id)}
            className="px-2.5 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isKeepAlive
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {isKeepAlive ? 'Keep Alive' : 'Full Monitoring'}
        </span>

        {!isKeepAlive && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              monitor.status === 'UP'
                ? 'bg-green-100 text-green-800'
                : monitor.status === 'DOWN'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {monitor.status}
          </span>
        )}

        {!isKeepAlive && (
          <span className="text-xs text-gray-400">
            Check every {INTERVAL_LABELS[monitor.interval] || `${monitor.interval}s`}
          </span>
        )}
      </div>
    </div>
  );
}
