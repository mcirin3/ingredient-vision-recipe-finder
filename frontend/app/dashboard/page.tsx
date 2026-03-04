'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, token, clearAuth, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/auth');
    }
  }, [hydrated, token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
        {!token && (
          <div className="text-center text-gray-700">Redirecting to login…</div>
        )}

        {token && (
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Account</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your profile and session.</p>
              <div className="mt-4 space-y-3 text-sm text-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email</span>
                  <span className="text-gray-700">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Session</span>
                  <Button variant="outline" size="sm" onClick={clearAuth}>
                    Sign out everywhere
                  </Button>
                </div>
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-600 mt-1">Strengthen your account.</p>
              <div className="mt-4 space-y-3 text-sm text-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Multi-factor authentication</p>
                    <p className="text-gray-600">Use an authenticator app for 6-digit codes.</p>
                  </div>
                  <Button variant="accent" size="sm" onClick={() => router.push('/auth/mfa')}>
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-gray-600">Change password (coming soon).</p>
                  </div>
                  <Button variant="secondary" size="sm" disabled>
                    Pending
                  </Button>
                </div>
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              <p className="text-sm text-gray-600 mt-1">General app settings.</p>
              <div className="mt-4 text-sm text-gray-700">
                <p>Additional preferences can go here (theme, notifications, etc.).</p>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          Manage your Ingredient Vision account and security from one place.
        </div>
      </footer>
    </div>
  );
}
