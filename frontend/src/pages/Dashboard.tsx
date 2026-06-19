import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import * as monitorsApi from '../api/monitors';
import * as billingApi from '../api/billing';
import type { Monitor, MonitorMode } from '../api/monitors';
import MonitorCard from '../components/MonitorCard';
import MonitorForm from '../components/MonitorForm';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Monitor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const {
    data: monitors = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['monitors'],
    queryFn: monitorsApi.getMonitors,
    refetchInterval: 15_000,
  });

  const { data: billingStatus, isError: billingError } = useQuery({
    queryKey: ['billing'],
    queryFn: () => billingApi.getBillingStatus(),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: monitorsApi.createMonitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      toast.success('Monitor created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: monitorsApi.UpdateMonitorInput }) =>
      monitorsApi.updateMonitor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      setEditing(null);
      toast.success('Monitor updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: monitorsApi.deleteMonitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      toast.success('Monitor deleted');
    },
    onError: () => toast.error('Failed to delete monitor'),
  });

  const toggleChannelMutation = useMutation({
    mutationFn: ({ id, channel }: { id: string; channel: string }) =>
      monitorsApi.toggleChannel(id, channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      toast.success('Channel updated');
    },
    onError: () => toast.error('Failed to toggle channel'),
  });

  function handleCreate(data: { name: string; url: string; mode: MonitorMode; interval: number }): Promise<void> {
    return createMutation.mutateAsync(data).then(() => {});
  }

  function handleUpdate(data: { name: string; url: string; mode: MonitorMode; interval: number }): Promise<void> {
    if (!editing) return Promise.reject();
    return updateMutation.mutateAsync({ id: editing.id, data }).then(() => {});
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function handleToggleChannel(id: string, channel: string) {
    toggleChannelMutation.mutate({ id, channel });
  }

  const exceededPlan =
    billingStatus && billingStatus.monitorCount > billingStatus.maxMonitors;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h2>
          <p className="text-muted-foreground mt-1">
            {monitors.length === 0
              ? "You don't have any monitors yet."
              : `${monitors.length} monitor${monitors.length > 1 ? 's' : ''} running`}
            {billingError && (
              <span className="ml-2 text-xs text-muted-foreground italic">(plan info unavailable)</span>
            )}
            {!billingError && billingStatus && (
              <span className="ml-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  billingStatus.plan === 'FREE'
                    ? 'border border-border text-muted-foreground'
                    : billingStatus.plan === 'STARTER'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  {billingStatus.plan}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({billingStatus.monitorCount}/{billingStatus.maxMonitors} monitors)
                </span>
                {billingStatus.plan === 'FREE' && monitors.length > 0 && (
                  <Link to="/app/settings" className="ml-2 text-primary hover:underline text-xs font-medium">
                    Upgrade
                  </Link>
                )}
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} disabled={createMutation.isPending}>
          + New Monitor
        </Button>
      </div>

      {isError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm mb-4">
          Failed to load monitors
        </div>
      )}

      {exceededPlan && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded text-sm mb-4 flex items-center justify-between">
          <span>
            Your plan was downgraded to {billingStatus!.plan}. You have {billingStatus!.monitorCount} monitors but the {billingStatus!.plan.toLowerCase()} plan allows {billingStatus!.maxMonitors}. Existing monitors are safe, but you cannot add more.
          </span>
          <Button variant="outline" size="sm" className="ml-4 shrink-0 border-yellow-500/30 hover:bg-yellow-500/10" asChild>
            <Link to="/app/settings">Upgrade</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg border p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : monitors.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-dashed">
          <div className="text-4xl mb-3">📡</div>
          <p className="text-muted-foreground mb-2">No monitors yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first monitor to start keeping your apps alive.
          </p>
          <Button onClick={() => setFormOpen(true)}>
            Create your first monitor
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => (
            <MonitorCard
              key={m.id}
              monitor={m}
              onEdit={(monitor) => { setEditing(monitor); setFormOpen(true); }}
              onDelete={handleDelete}
              onToggleChannel={handleToggleChannel}
              isDeleting={deletingId === m.id}
            />
          ))}
        </div>
      )}

      <MonitorForm
        open={formOpen}
        editing={editing}
        minInterval={billingStatus?.minInterval}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete Monitor"
        description="This will permanently delete this monitor and all its check history. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          const id = confirmDeleteId!;
          setConfirmDeleteId(null);
          setDeletingId(id);
          deleteMutation.mutate(id, {
            onSettled: () => setDeletingId(null),
          });
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
