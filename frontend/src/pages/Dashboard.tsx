import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as monitorsApi from '../api/monitors';
import * as billingApi from '../api/billing';
import type { Monitor, MonitorMode } from '../api/monitors';
import MonitorCard from '../components/MonitorCard';
import MonitorForm from '../components/MonitorForm';

export default function Dashboard() {
  const { user } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Monitor | null>(null);
  const [billingStatus, setBillingStatus] = useState<{ plan: string; monitorCount: number; maxMonitors: number; minInterval: number } | null>(null);
  const [billingError, setBillingError] = useState(false);

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
    billingApi
      .getBillingStatus()
      .then(setBillingStatus)
      .catch(() => setBillingError(true));
  }, [fetchMonitors]);

  async function handleCreate(data: {
    name: string;
    url: string;
    mode: MonitorMode;
    interval: number;
  }) {
    setActionError('');
    try {
      await monitorsApi.createMonitor(data);
      await fetchMonitors();
    } catch (err: any) {
      throw err; // let MonitorForm handle display
    }
  }

  async function handleUpdate(data: {
    name: string;
    url: string;
    mode: MonitorMode;
    interval: number;
  }) {
    if (!editing) return;
    setActionError('');
    try {
      await monitorsApi.updateMonitor(editing.id, data);
      setEditing(null);
      await fetchMonitors();
    } catch (err: any) {
      throw err;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this monitor?')) return;
    setActionError('');
    try {
      await monitorsApi.deleteMonitor(id);
      await fetchMonitors();
    } catch {
      setActionError('Failed to delete monitor. Please try again.');
    }
  }

  function openEdit(monitor: Monitor) {
    setEditing(monitor);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setActionError('');
  }

  async function handleToggleChannel(id: string, channel: string) {
    setActionError('');
    try {
      const updated = await monitorsApi.toggleChannel(id, channel);
      setMonitors((prev) =>
        prev.map((m) => (m.id === id ? updated : m))
      );
    } catch {
      setActionError('Failed to toggle channel. Please try again.');
    }
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
            {billingStatus && (
              <span className="ml-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  billingStatus.plan === 'FREE'
                    ? 'bg-gray-100 text-gray-600'
                    : billingStatus.plan === 'STARTER'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {billingStatus.plan}
                </span>
                <span className="text-gray-400 ml-1">
                  ({billingStatus.monitorCount}/{billingStatus.maxMonitors} monitors)
                </span>
                {billingStatus.plan === 'FREE' && monitors.length > 0 && (
                  <Link
                    to="/app/settings"
                    className="ml-2 text-blue-600 hover:text-blue-500 text-xs font-medium"
                  >
                    Upgrade
                  </Link>
                )}
              </span>
            )}
            {billingError && (
              <span className="ml-2 text-xs text-gray-400">
                (plan info unavailable)
              </span>
            )}
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

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {actionError}
        </div>
      )}

      {billingStatus && billingStatus.monitorCount > billingStatus.maxMonitors && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm mb-4 flex items-center justify-between">
          <span>
            Your plan was downgraded to {billingStatus.plan}. You have {billingStatus.monitorCount} monitors but the {billingStatus.plan.toLowerCase()} plan allows {billingStatus.maxMonitors}. Existing monitors are safe, but you cannot add more until you're within the limit.
          </span>
          <Link
            to="/app/settings"
            className="ml-4 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-300 shrink-0"
          >
            Upgrade
          </Link>
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
        minInterval={billingStatus?.minInterval}
        onClose={closeForm}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </div>
  );
}
