import client from './client';

export interface AuthResponse {
  user: { id: string; email: string; name: string | null; createdAt: string };
  token: string;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return client.post('/auth/login', { email, password }).then((r) => r.data);
}

export function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  return client.post('/auth/register', { email, password, name }).then((r) => r.data);
}
