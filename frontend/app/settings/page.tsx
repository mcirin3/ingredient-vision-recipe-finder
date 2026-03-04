'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { token, user, hydrated, clearAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/auth');
    }
  }, [hydrated, token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
              Back to app
            </Button>
            {user && (
              <>
                <span className="text-sm text-gray-700">Signed in as {user.email}</span>
                <Button variant="outline" size="sm" onClick={clearAuth}>
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {!token && <div className="text-center text-gray-700">Redirecting to login…</div>}

        {token && (
          <>
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              <p className="text-sm text-gray-600 mt-1">Configure how Ingredient Vision behaves for you.</p>
              <ul className="mt-4 space-y-3 text-sm text-gray-800">
                <li className="flex items-center justify-between">
                  <span>Theme</span>
                  <Button variant="secondary" size="sm" disabled>System (coming soon)</Button>
                </li>
                <li className="flex items-center justify-between">
                  <span>Notifications</span>
                  <Button variant="secondary" size="sm" disabled>Email alerts off</Button>
                </li>
              </ul>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-600 mt-1">Keep your account safe.</p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-800">
                <div>
                  <p className="font-medium">Multi-factor authentication</p>
                  <p className="text-gray-600">Set up a TOTP code via authenticator app.</p>
                </div>
                <Button variant="accent" size="sm" onClick={() => router.push('/auth/mfa')}>
                  Manage MFA
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          Tune your Ingredient Vision experience from this page.
        </div>
      </footer>
    </div>
  );
}
