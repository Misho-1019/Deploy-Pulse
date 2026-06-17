import type { Monitor } from '../api/monitors';

interface Props {
  monitor: Monitor;
  onEdit: (monitor: Monitor) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  UP: 'bg-green-100 text-green-800',
  DOWN: 'bg-red-100 text-red-800',
  PENDING: 'bg-gray-100 text-gray-600',
};

const MODE_STYLES: Record<string, string> = {
  KEEP_ALIVE: 'bg-purple-100 text-purple-800',
  FULL_MONITORING: 'bg-blue-100 text-blue-800',
};

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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                monitor.status === 'UP'
                  ? 'bg-green-500'
                  : monitor.status === 'DOWN'
                    ? 'bg-red-500'
                    : 'bg-gray-300'
              }`}
            />
            <h3 className="font-medium text-gray-900 truncate">
              {monitor.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 truncate">{monitor.url}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(monitor)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(monitor.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            MODE_STYLES[monitor.mode] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {monitor.mode === 'KEEP_ALIVE' ? 'Keep Alive' : 'Full Monitoring'}
        </span>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            STATUS_STYLES[monitor.status] || 'bg-gray-100 text-gray-600'
          }`}
        >
          {monitor.status}
        </span>

        <span className="text-xs text-gray-400">
          Check every {INTERVAL_LABELS[monitor.interval] || `${monitor.interval}s`}
        </span>
      </div>
    </div>
  );
}
