'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { requestMfaSetup, verifyMfa } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MfaPage() {
  const { token, user, hydrated } = useAuth();
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [totp, setTotp] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/auth');
    }
  }, [hydrated, token, router]);

  const startMfa = async () => {
    if (!token) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const data = await requestMfaSetup(token);
      setSecret(data.secret);
      setOtpauthUrl(data.otpauth_url);
      setMessage('Scan the QR or enter the secret into your authenticator app, then verify below.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start MFA');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!token) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await verifyMfa(token, totp);
      setMessage('MFA enabled! You will need a code on next login.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Multi-Factor Authentication</h1>
          <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
            Back to app
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!token && (
          <div className="text-center text-gray-700">Redirecting to login…</div>
        )}

        {token && (
          <div className="bg-white border border-amber-100 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Signed in as</p>
                  <p className="font-semibold text-gray-900">{user?.email}</p>
                </div>
                <Button variant="warm" onClick={startMfa} disabled={loading}>
                  Generate MFA secret
                </Button>
              </div>

              {secret && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">Scan or copy this secret into your authenticator app</div>
                  {otpauthUrl && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                          otpauthUrl
                        )}&size=200x200`}
                        alt="Authenticator QR code"
                        className="w-40 h-40 border border-gray-200 rounded-lg bg-white"
                      />
                    </div>
                  )}
                  <code className="block break-all bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {secret}
                  </code>
                  <p className="text-xs text-gray-600">
                    If your app doesn&apos;t support QR scanning, add the account manually with this secret.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-gray-700">Enter 6-digit code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  placeholder="123456"
                  disabled={!secret}
                />
                <Button variant="accent" onClick={verify} disabled={!secret || !totp || loading}>
                  Verify & Enable
                </Button>
              </div>

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
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          Protect your account with an authenticator app. Codes refresh every 30 seconds.
        </div>
      </footer>
    </div>
  );
}
