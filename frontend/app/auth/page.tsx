'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { login, register } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { ApiError } from '@/lib/api';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const { setAuth, token, user } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user && token) {
      router.replace('/');
    }
  }, [router, user, token]);

  const handleSignup = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await register(email, password);
      setMode('login');
      setMessage('Account created. Please sign in.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const response = await login(email, password, totp || undefined);
      setAuth(response);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && err.message?.toLowerCase().includes('mfa')) {
        setMessage('MFA enabled for this account. Enter a 6-digit code to continue.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">🍳 Ingredient Vision</h1>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-10 border border-amber-100">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Access your cookbook</h2>
                <div className="flex gap-2">
                  <Button
                    variant={mode === 'login' ? 'accent' : 'secondary'}
                    size="sm"
                    onClick={() => setMode('login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant={mode === 'signup' ? 'accent' : 'secondary'}
                    size="sm"
                    onClick={() => setMode('signup')}
                  >
                    Create account
                  </Button>
                </div>
              </div>
              <p className="text-gray-600">
                Secure your ingredient uploads and recipe history with email + password, and optional MFA for extra safety.
              </p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-700">Email</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700">Password</span>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                {mode === 'login' && (
                  <label className="block">
                    <span className="text-sm text-gray-700">MFA code (6 digits)</span>
                    <input
                      type="text"
                      maxLength={6}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      value={totp}
                      onChange={(e) => setTotp(e.target.value)}
                      placeholder="Only if your account has MFA"
                    />
                  </label>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-100">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm border border-green-100">
                    {message}
                  </div>
                )}

                <Button
                  onClick={mode === 'login' ? handleLogin : handleSignup}
                  variant="accent"
                  size="lg"
                  fullWidth
                  disabled={loading}
                >
                  {mode === 'login' ? 'Login' : 'Create account'}
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-orange-100 via-white to-amber-50 rounded-2xl p-6 border border-amber-100">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Need MFA?</h2>
                <p className="text-sm text-gray-700">
                  After you log in, visit the Multi-Factor page to set up a TOTP code with your authenticator app.
                </p>
                <Button
                  variant="warm"
                  fullWidth
                  onClick={() => router.push('/auth/mfa')}
                >
                  Go to MFA setup
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          Secure access to your Ingredient Vision workspace.
        </div>
      </footer>
    </div>
  );
}
