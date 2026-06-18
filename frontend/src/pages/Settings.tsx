import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as userApi from '../api/user';
import * as billingApi from '../api/billing';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [slackConfigured, setSlackConfigured] = useState(false);
  const [monitorCount, setMonitorCount] = useState(0);
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackStatus, setSlackStatus] = useState('');
  const [fetchError, setFetchError] = useState(false);
  const [billingUpgradeStatus, setBillingUpgradeStatus] = useState('');
  const [billingUpgradeError, setBillingUpgradeError] = useState('');
  const [billingManageError, setBillingManageError] = useState('');

  useEffect(() => {
    userApi
      .getUserSettings()
      .then((s) => {
        setEmail(s.email);
        setSlackUrl(s.slackWebhookUrl || '');
        setSlackConfigured(s.slackConfigured);
        setMonitorCount(s.monitorCount);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));

    billingApi
      .getBillingStatus()
      .then((s) => setPlan(s.plan))
      .catch(() => {});
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
      setSlackConfigured(true);
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
      setSlackConfigured(false);
      setSlackUrl('');
      setSlackStatus('Slack integration removed.');
    } catch (err: any) {
      setSlackStatus(err?.response?.data?.error || 'Failed to remove');
    } finally {
      setSlackSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/app"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr;
        </Link>
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Account */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Account</h3>
          {fetchError ? (
            <p className="text-sm text-red-600">Failed to load account info.</p>
          ) : (
            <p className="text-sm text-gray-500">
              Alert emails are sent to{' '}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {monitorCount} monitor{monitorCount !== 1 ? 's' : ''} configured
          </p>
        </div>

        {/* Slack */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">💬 Slack</h3>
            {slackConfigured && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Get alerts in a Slack channel via Incoming Webhooks.{' '}
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500"
            >
              How to set up
            </a>
          </p>

          <form onSubmit={handleSaveSlack} className="space-y-3">
            <input
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/T.../B.../xxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={slackSaving || !slackUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {slackSaving ? 'Saving...' : 'Save'}
              </button>
              {slackConfigured && (
                <button
                  type="button"
                  onClick={handleRemoveSlack}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            {slackStatus && (
              <p
                className={`text-sm ${
                  slackStatus.includes('Failed') || slackStatus.includes('Invalid')
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {slackStatus}
              </p>
            )}
          </form>
        </div>

        {/* Test Alerts */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Test Alerts</h3>
          <p className="text-sm text-gray-500 mb-4">
            Sends a test alert to all configured channels (email{slackConfigured ? ' + slack' : ''}).
            You must have at least one monitor with alerts enabled.
          </p>

          <button
            onClick={handleTestAlert}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending...' : 'Send Test Alert'}
          </button>

          {testStatus && (
            <p className="mt-3 text-sm text-green-600">{testStatus}</p>
          )}
        </div>

        {/* Billing */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">Plan</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              plan === 'FREE'
                ? 'bg-gray-100 text-gray-600'
                : plan === 'STARTER'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {plan || 'FREE'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {plan === 'FREE'
              ? 'You are on the Free plan. Upgrade for more monitors, faster checks, and longer history.'
              : `You are on the ${plan?.charAt(0).toUpperCase() + plan?.slice(1).toLowerCase()} plan.`}
          </p>

          {searchParams.get('checkout') === 'success' && (
            <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm flex items-center justify-between">
              <span>Payment successful! Your plan has been upgraded.</span>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('checkout');
                  window.history.replaceState({}, '', url);
                  window.location.reload();
                }}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                &times;
              </button>
            </div>
          )}
          {searchParams.get('checkout') === 'cancelled' && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm flex items-center justify-between">
              <span>Checkout cancelled. No changes were made.</span>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('checkout');
                  window.history.replaceState({}, '', url);
                  window.location.reload();
                }}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {billingUpgradeError && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {billingUpgradeError}
            </div>
          )}
          {billingUpgradeStatus && (
            <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
              {billingUpgradeStatus}
            </div>
          )}
          {billingManageError && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {billingManageError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {plan === 'FREE' && (
              <>
                <button
                  onClick={async () => {
                    setBillingUpgradeError('');
                    setBillingUpgradeStatus('');
                    try {
                      const { url } = await billingApi.createCheckout(
                        'price_1Tjj5ePW9LwsuQfOH66CdRQG'
                      );
                      window.location.href = url;
                    } catch (err: any) {
                      setBillingUpgradeError(err?.response?.data?.error || 'Failed to start checkout');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Starter ($5/mo)
                </button>
                <button
                  onClick={async () => {
                    setBillingUpgradeError('');
                    setBillingUpgradeStatus('');
                    try {
                      const { url } = await billingApi.createCheckout(
                        'price_1Tjj7SPW9LwsuQfOPDli7znA'
                      );
                      window.location.href = url;
                    } catch (err: any) {
                      setBillingUpgradeError(err?.response?.data?.error || 'Failed to start checkout');
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Upgrade to Pro ($15/mo)
                </button>
              </>
            )}
            {plan !== 'FREE' && (
              <button
                onClick={async () => {
                  setBillingManageError('');
                  try {
                    const { url } = await billingApi.getPortal();
                    window.location.href = url;
                  } catch (err: any) {
                    setBillingManageError(err?.response?.data?.error || 'Failed to open portal');
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Manage Subscription
              </button>
            )}
          </div>
        </div>

        {/* Per-Monitor Control */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Per-Monitor Channels</h3>
          <p className="text-sm text-gray-500">
            Toggle Email / Slack individually on each FULL_MONITORING monitor card
            on the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
