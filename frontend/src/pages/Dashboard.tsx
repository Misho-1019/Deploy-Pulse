import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as monitorsApi from '../api/monitors';
import type { Monitor, MonitorMode } from '../api/monitors';
import MonitorCard from '../components/MonitorCard';
import MonitorForm from '../components/MonitorForm';

export default function Dashboard() {
  const { user } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Monitor | null>(null);

  const fetchMonitors = useCallback(async () => {
    try {
      const data = await monitorsApi.getMonitors();
      setMonitors(data);
      setError('');
    } catch {
      setError('Failed to load monitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  async function handleCreate(data: {
    name: string;
    url: string;
    mode: MonitorMode;
    interval: number;
  }) {
    await monitorsApi.createMonitor(data);
    await fetchMonitors();
  }

  async function handleUpdate(data: {
    name: string;
    url: string;
    mode: MonitorMode;
    interval: number;
  }) {
    if (!editing) return;
    await monitorsApi.updateMonitor(editing.id, data);
    setEditing(null);
    await fetchMonitors();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this monitor?')) return;
    await monitorsApi.deleteMonitor(id);
    await fetchMonitors();
  }

  function openEdit(monitor: Monitor) {
    setEditing(monitor);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleToggleChannel(id: string, channel: string) {
    const updated = await monitorsApi.toggleChannel(id, channel);
    setMonitors((prev) =>
      prev.map((m) => (m.id === id ? updated : m))
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h2>
          <p className="text-gray-500 mt-1">
            {monitors.length === 0
              ? "You don't have any monitors yet."
              : `${monitors.length} monitor${monitors.length > 1 ? 's' : ''} running`}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Monitor
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : monitors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
          <div className="text-4xl mb-3">📡</div>
          <p className="text-gray-500 mb-2">No monitors yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Create your first monitor to start keeping your apps alive.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create your first monitor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => (
            <MonitorCard
              key={m.id}
              monitor={m}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleChannel={handleToggleChannel}
            />
          ))}
        </div>
      )}

      <MonitorForm
        open={formOpen}
        editing={editing}
        onClose={closeForm}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </div>
  );
}
