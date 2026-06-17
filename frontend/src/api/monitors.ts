import client from './client';

export type MonitorMode = 'KEEP_ALIVE' | 'FULL_MONITORING';
export type MonitorStatus = 'UP' | 'DOWN' | 'PENDING';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  mode: MonitorMode;
  interval: number;
  status: MonitorStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  checks?: Check[];
}

export interface Check {
  id: string;
  statusCode: number | null;
  responseTime: number | null;
  error: string | null;
  status: 'UP' | 'DOWN';
  checkedAt: string;
}

export interface CreateMonitorInput {
  name: string;
  url: string;
  mode: MonitorMode;
  interval?: number;
}

export interface UpdateMonitorInput {
  name?: string;
  url?: string;
  mode?: MonitorMode;
  interval?: number;
}

export function getMonitors(): Promise<Monitor[]> {
  return client.get('/monitors').then((r) => r.data);
}

export function getMonitor(id: string): Promise<Monitor> {
  return client.get(`/monitors/${id}`).then((r) => r.data);
}

export function createMonitor(input: CreateMonitorInput): Promise<Monitor> {
  return client.post('/monitors', input).then((r) => r.data);
}

export function updateMonitor(
  id: string,
  input: UpdateMonitorInput
): Promise<Monitor> {
  return client.put(`/monitors/${id}`, input).then((r) => r.data);
}

export function deleteMonitor(id: string): Promise<void> {
  return client.delete(`/monitors/${id}`);
}
