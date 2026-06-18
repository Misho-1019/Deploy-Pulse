import client from './client';

export interface BillingStatus {
  plan: string;
  monitorCount: number;
  maxMonitors: number;
  minInterval: number;
  historyDays: number;
}

export function createCheckout(priceId: string): Promise<{ url: string }> {
  return client.post('/billing/checkout', { priceId }).then((r) => r.data);
}

export function getPortal(): Promise<{ url: string }> {
  return client.get('/billing/portal').then((r) => r.data);
}

export function getBillingStatus(): Promise<BillingStatus> {
  return client.get('/billing/status').then((r) => r.data);
}
