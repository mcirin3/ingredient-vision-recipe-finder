import { API_BASE_URL } from './constants';
import { AuthResponse, MfaSetup, User } from '@/types/auth';
import { ApiError } from './api';

export async function register(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const message = (await res.json().catch(() => ({}))).detail ?? 'Failed to register';
    throw new ApiError(res.status, message);
  }

  return res.json();
}

export async function login(
  email: string,
  password: string,
  totpCode?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, totp_code: totpCode }),
  });

  if (!res.ok) {
    const message = (await res.json().catch(() => ({}))).detail ?? 'Login failed';
    throw new ApiError(res.status, message);
  }

  return res.json();
}

export async function getProfile(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new ApiError(res.status, 'Unable to fetch profile');
  }

  return res.json();
}

export async function requestMfaSetup(token: string): Promise<MfaSetup> {
  const res = await fetch(`${API_BASE_URL}/auth/mfa/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))).detail ?? 'Unable to start MFA';
    throw new ApiError(res.status, msg);
  }

  return res.json();
}

export async function verifyMfa(token: string, totpCode: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/mfa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ totp_code: totpCode }),
  });

  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))).detail ?? 'Invalid MFA code';
    throw new ApiError(res.status, msg);
  }
}
