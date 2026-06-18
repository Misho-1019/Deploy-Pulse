import client from './client';

interface UserSettings {
  id: string;
  email: string;
  name: string | null;
  slackWebhookUrl: string | null;
  createdAt: string;
  monitorCount: number;
  slackConfigured: boolean;
}

export function getUserSettings(): Promise<UserSettings> {
  return client.get('/user/settings').then((r) => r.data);
}

export function saveSlackConfig(webhookUrl: string): Promise<{ message: string }> {
  return client.put('/user/slack-config', { webhookUrl }).then((r) => r.data);
}

export function removeSlackConfig(): Promise<{ message: string }> {
  return client.delete('/user/slack-config').then((r) => r.data);
}

export function sendTestAlert(): Promise<{ message: string }> {
  return client.post('/user/test-alert').then((r) => r.data);
}
