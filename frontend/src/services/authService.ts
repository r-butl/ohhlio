import { getAPIURL } from '@/utils/APIutils';

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


