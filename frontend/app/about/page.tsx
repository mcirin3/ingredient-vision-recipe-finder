'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">About Ingredient Vision</h1>
          <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
            Back to app
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">What it does</h2>
          <p className="mt-2 text-gray-700 text-sm">
            Ingredient Vision lets you snap a photo of what&apos;s in your kitchen and instantly get recipe ideas
            tailored to what you have on hand.
          </p>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
          <ul className="list-disc list-inside mt-2 space-y-2 text-sm text-gray-700">
            <li>Upload or take a photo of your ingredients.</li>
            <li>We detect items with vision models and normalize names.</li>
            <li>We rank recipes by match quality and show what you might be missing.</li>
          </ul>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Security & privacy</h2>
          <p className="mt-2 text-gray-700 text-sm">
            Accounts use email/password with optional MFA. Images are used only to suggest recipes and are stored in your configured S3 bucket.
          </p>
        </section>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          Built to help you cook more with what you already have.
        </div>
      </footer>
    </div>
  );
}
