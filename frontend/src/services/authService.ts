import { getAPIURL } from '@/utils/APIutils';

export const AUTH_EVENTS = {
  FORCE_LOGOUT: 'ohhlio:auth:force-logout',
} as const;

const emitAuthEvent = (eventName: (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS], detail?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

export const handleTokenExpiration = () => {
  emitAuthEvent(AUTH_EVENTS.FORCE_LOGOUT, { reason: 'token-expired' });
};

const AUTH_URL = getAPIURL('auth');

type LoginResponse = {
  token: string;
  email: string;
  username: string;
  message?: string;
};

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Login failed');
  }
  return data as LoginResponse;
}

export async function registerRequest(username: string, email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Registration failed');
  }
  return data as LoginResponse;
}


