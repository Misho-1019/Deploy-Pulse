import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import * as userApi from '../api/user';
import * as billingApi from '../api/billing';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [slackUrl, setSlackUrl] = useState('');
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackStatus, setSlackStatus] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [billingUpgradeError, setBillingUpgradeError] = useState('');
  const [billingManageError, setBillingManageError] = useState('');
  const [confirmRemoveSlack, setConfirmRemoveSlack] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
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
      toast.info('Redirecting to checkout...');
      billingApi.createCheckout('price_1Tjj5ePW9LwsuQfOH66CdRQG').then(({ url }) => {
        window.location.href = url;
      }).catch(() => toast.error('Failed to start checkout'));
    } else if (planParam === 'pro' && billing?.plan === 'FREE') {
      toast.info('Redirecting to checkout...');
      billingApi.createCheckout('price_1Tjj7SPW9LwsuQfOPDli7znA').then(({ url }) => {
        window.location.href = url;
      }).catch(() => toast.error('Failed to start checkout'));
    }
  }, []);

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
      setSlackStatus('Saved!');
    } catch (err: any) {
      setSlackStatus(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSlackSaving(false);
    }
  }

  async function handleRemoveSlack() {
    setSlackSaving(true);
    setConfirmRemoveSlack(false);
    try {
      await userApi.removeSlackConfig();
      setSlackUrl('');
      setSlackStatus('Removed.');
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

  const limits: Record<string, { max: number; interval: string; history: string }> = {
    FREE: { max: 3, interval: '10 min', history: '7 days' },
    STARTER: { max: 25, interval: '5 min', history: '30 days' },
    PRO: { max: 100, interval: '1 min', history: '90 days' },
  };

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
      <div className="flex items-center gap-3 mb-4">
        <Link to="/app" className="text-muted-foreground hover:text-foreground">&larr;</Link>
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>

      <Tabs defaultValue="account" className="max-w-lg">
        <TabsList className="w-full">
          <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1">Notifications</TabsTrigger>
          <TabsTrigger value="billing" className="flex-1">Billing</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Profile</h3>
              {userError ? (
                <p className="text-sm text-destructive">Failed to load account info.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={plan === 'FREE' ? 'outline' : 'default'} className="text-xs">
                      {plan}
                    </Badge>
                    <span className="text-sm font-medium">{userSettings?.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userSettings?.monitorCount || 0} monitor{userSettings?.monitorCount !== 1 ? 's' : ''} configured
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Plan Limits</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {(['FREE', 'STARTER', 'PRO'] as const).map((p) => (
                  <div key={p} className={`rounded-lg border p-3 ${plan === p ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'}`}>
                    <p className="text-xs font-semibold">{p}</p>
                    <div className="text-2xl font-bold my-1">{limits[p].max}</div>
                    <p className="text-[10px] text-muted-foreground">monitors</p>
                    <p className="text-[10px] text-muted-foreground">{limits[p].interval} min</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">📧 Email</h3>
                <Badge variant="default" className="text-[10px]">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Alerts are sent to <span className="font-medium text-foreground">{userSettings?.email}</span>
              </p>
              <Button onClick={handleTestAlert} disabled={sending} size="sm">
                {sending ? 'Sending...' : 'Send Test Alert'}
              </Button>
              {testStatus && <p className="mt-2 text-xs text-green-600 dark:text-green-400">{testStatus}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">💬 Slack</h3>
                {slackConfigured && <Badge className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400">Connected</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Get alerts in Slack via Incoming Webhooks.{' '}
                <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">How to set up</a>
              </p>
              <form onSubmit={handleSaveSlack} className="space-y-2">
                <Input type="url" value={slackUrl} onChange={(e) => setSlackUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T.../B.../xxxx" />
                <div className="flex gap-2">
                  <Button type="submit" disabled={slackSaving || !slackUrl.trim()} size="sm">
                    {slackSaving ? 'Saving...' : 'Save'}
                  </Button>
                  {slackConfigured && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmRemoveSlack(true)}>Remove</Button>
                  )}
                </div>
                {slackStatus && (
                  <p className={`text-xs ${slackStatus.includes('Failed') ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                    {slackStatus}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground px-1">
            Toggle Email / Slack per monitor on the dashboard cards.
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card className={plan !== 'FREE' ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Current Plan</h3>
                <Badge>{plan}</Badge>
              </div>

              {checkoutMsg === 'success' && (
                <div className="mb-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-3 py-2 rounded text-sm flex justify-between">
                  <span>Payment successful! Your plan has been upgraded.</span>
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

              <p className="text-sm text-muted-foreground mb-4">
                {plan === 'FREE'
                  ? 'Upgrade for more monitors, faster checks, and longer history.'
                  : `You are on the ${plan.charAt(0) + plan.slice(1).toLowerCase()} plan.`}
              </p>

              <div className="flex flex-wrap gap-2">
                {plan === 'FREE' && (
                  <>
                    <Button disabled={upgrading} size="sm"
                      onClick={async () => {
                        setBillingUpgradeError('');
                        setUpgrading(true);
                        try { const { url } = await billingApi.createCheckout('price_1Tjj5ePW9LwsuQfOH66CdRQG'); window.location.href = url; }
                        catch (e: any) { setBillingUpgradeError(e?.response?.data?.error || 'Failed'); setUpgrading(false); }
                      }}>{upgrading ? 'Redirecting...' : 'Upgrade to Starter ($5/mo)'}</Button>
                    <Button variant="outline" size="sm" disabled={upgrading}
                      onClick={async () => {
                        setBillingUpgradeError('');
                        setUpgrading(true);
                        try { const { url } = await billingApi.createCheckout('price_1Tjj7SPW9LwsuQfOPDli7znA'); window.location.href = url; }
                        catch (e: any) { setBillingUpgradeError(e?.response?.data?.error || 'Failed'); setUpgrading(false); }
                      }}>{upgrading ? 'Redirecting...' : 'Upgrade to Pro ($15/mo)'}</Button>
                  </>
                )}
                {plan !== 'FREE' && (
                  <Button variant="outline" size="sm" disabled={upgrading}
                    onClick={async () => {
                      setBillingManageError('');
                      setUpgrading(true);
                      try { const { url } = await billingApi.getPortal(); window.location.href = url; }
                      catch (e: any) { setBillingManageError(e?.response?.data?.error || 'Failed'); setUpgrading(false); }
                    }}
                  >{upgrading ? 'Redirecting...' : 'Manage Subscription'}</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmRemoveSlack}
        title="Remove Slack Integration"
        description="This will disconnect Slack from your account. You can reconnect at any time."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemoveSlack}
        onCancel={() => setConfirmRemoveSlack(false)}
      />
    </div>
  );
}
