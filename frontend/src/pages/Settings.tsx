import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import * as userApi from '../api/user';
import * as billingApi from '../api/billing';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [slackUrl, setSlackUrl] = useState('');
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackStatus, setSlackStatus] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [billingUpgradeError, setBillingUpgradeError] = useState('');
  const [billingManageError, setBillingManageError] = useState('');
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(
    () => new URL(window.location.href).searchParams.get('checkout')
  );

  const { data: userSettings, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userApi.getUserSettings,
    staleTime: 60_000,
  });

  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: () => billingApi.getBillingStatus(),
    staleTime: 60_000,
  });

  // Sync Slack URL from settings
  useEffect(() => {
    if (userSettings?.slackWebhookUrl) {
      setSlackUrl(userSettings.slackWebhookUrl);
    }
  }, [userSettings?.slackWebhookUrl]);

  // Auto-trigger checkout from ?plan param
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam === 'starter' && billing?.plan === 'FREE') {
      const priceId = 'price_1Tjj5ePW9LwsuQfOH66CdRQG';
      toast.info('Redirecting to checkout...');
      billingApi.createCheckout(priceId).then(({ url }) => {
        window.location.href = url;
      }).catch(() => toast.error('Failed to start checkout'));
    } else if (planParam === 'pro' && billing?.plan === 'FREE') {
      const priceId = 'price_1Tjj7SPW9LwsuQfOPDli7znA';
      toast.info('Redirecting to checkout...');
      billingApi.createCheckout(priceId).then(({ url }) => {
        window.location.href = url;
      }).catch(() => toast.error('Failed to start checkout'));
    }
  }, []); // Only run once on mount

  async function handleTestAlert() {
    setSending(true);
    setTestStatus('');
    try {
      const res = await userApi.sendTestAlert();
      setTestStatus(res.message);
    } catch (err: any) {
      setTestStatus(err?.response?.data?.error || 'Failed to send test');
    } finally {
      setSending(false);
    }
  }

  async function handleSaveSlack(e: React.FormEvent) {
    e.preventDefault();
    if (!slackUrl.trim()) return;
    setSlackSaving(true);
    setSlackStatus('');
    try {
      await userApi.saveSlackConfig(slackUrl.trim());
      setSlackStatus('Saved! Slack alerts are configured.');
    } catch (err: any) {
      setSlackStatus(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSlackSaving(false);
    }
  }

  async function handleRemoveSlack() {
    if (!confirm('Remove Slack integration?')) return;
    setSlackSaving(true);
    try {
      await userApi.removeSlackConfig();
      setSlackUrl('');
      setSlackStatus('Slack integration removed.');
    } catch (err: any) {
      setSlackStatus(err?.response?.data?.error || 'Failed to remove');
    } finally {
      setSlackSaving(false);
    }
  }

  function clearCheckoutMsg() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    window.history.replaceState({}, '', url);
    setCheckoutMsg(null);
  }

  const plan = billing?.plan || 'FREE';
  const slackConfigured = !!userSettings?.slackConfigured;

  if (userLoading || billingLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app" className="text-muted-foreground hover:text-foreground">&larr;</Link>
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-semibold mb-2">Account</h3>
          {userError ? (
            <p className="text-sm text-destructive">Failed to load account info.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Alert emails are sent to <span className="font-medium text-foreground">{userSettings?.email}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {userSettings?.monitorCount || 0} monitor{userSettings?.monitorCount !== 1 ? 's' : ''} configured
          </p>
        </div>

        <div className="bg-card rounded-lg border p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">💬 Slack</h3>
            {slackConfigured && <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Connected</span>}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Get alerts in Slack via Incoming Webhooks.{' '}
            <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">How to set up</a>
          </p>
          <form onSubmit={handleSaveSlack} className="space-y-3">
            <Input type="url" value={slackUrl} onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/T.../B.../xxxx" />
            <div className="flex gap-2">
              <Button type="submit" disabled={slackSaving || !slackUrl.trim()}>
                {slackSaving ? 'Saving...' : 'Save'}
              </Button>
              {slackConfigured && (
                <Button type="button" variant="destructive" onClick={handleRemoveSlack}>Remove</Button>
              )}
            </div>
            {slackStatus && (
              <p className={`text-sm ${slackStatus.includes('Failed') || slackStatus.includes('Invalid') ? 'text-destructive' : 'text-green-600'}`}>
                {slackStatus}
              </p>
            )}
          </form>
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-semibold mb-2">Test Alerts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sends a test alert to all configured channels (email{slackConfigured ? ' + slack' : ''}).
          </p>
          <Button onClick={handleTestAlert} disabled={sending}>
            {sending ? 'Sending...' : 'Send Test Alert'}
          </Button>
          {testStatus && <p className="mt-3 text-sm text-green-600">{testStatus}</p>}
        </div>

        <div className="bg-card rounded-lg border p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">Plan</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              plan === 'FREE' ? 'border border-border text-muted-foreground' :
              plan === 'STARTER' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              {plan}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {plan === 'FREE'
              ? 'You are on the Free plan. Upgrade for more monitors, faster checks, and longer history.'
              : `You are on the ${plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()} plan.`}
          </p>

          {checkoutMsg === 'success' && (
            <div className="mb-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-3 py-2 rounded text-sm flex justify-between">
              <span>Payment successful!</span>
              <button onClick={clearCheckoutMsg} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
          )}
          {checkoutMsg === 'cancelled' && (
            <div className="mb-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded text-sm flex justify-between">
              <span>Checkout cancelled.</span>
              <button onClick={clearCheckoutMsg} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
          )}
          {billingUpgradeError && (
            <div className="mb-3 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">{billingUpgradeError}</div>
          )}
          {billingManageError && (
            <div className="mb-3 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">{billingManageError}</div>
          )}

          <div className="flex flex-wrap gap-2">
            {plan === 'FREE' && (
              <>
                <Button onClick={async () => {
                  setBillingUpgradeError('');
                  try { const { url } = await billingApi.createCheckout('price_1Tjj5ePW9LwsuQfOH66CdRQG'); window.location.href = url; }
                  catch (e: any) { setBillingUpgradeError(e?.response?.data?.error || 'Failed'); }
                }}>Upgrade to Starter ($5/mo)</Button>
                <Button variant="outline" onClick={async () => {
                  setBillingUpgradeError('');
                  try { const { url } = await billingApi.createCheckout('price_1Tjj7SPW9LwsuQfOPDli7znA'); window.location.href = url; }
                  catch (e: any) { setBillingUpgradeError(e?.response?.data?.error || 'Failed'); }
                }}>Upgrade to Pro ($15/mo)</Button>
              </>
            )}
            {plan !== 'FREE' && (
              <Button variant="outline" onClick={async () => {
                setBillingManageError('');
                try { const { url } = await billingApi.getPortal(); window.location.href = url; }
                catch (e: any) { setBillingManageError(e?.response?.data?.error || 'Failed'); }
              }}>Manage Subscription</Button>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-semibold mb-2">Per-Monitor Channels</h3>
          <p className="text-sm text-muted-foreground">
            Toggle Email / Slack individually on each FULL_MONITORING monitor card on the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
