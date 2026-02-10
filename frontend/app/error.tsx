'use client';

import { useEffect } from 'react';
import { MdError } from 'react-icons/md';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <MdError className="w-16 h-16 text-red-600 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900">Something went wrong!</h1>
        <p className="text-gray-600">
          An error occurred while loading the application. Please try again.
        </p>
        <Button onClick={reset} variant="primary" size="lg">
          Try again
        </Button>
      </div>
    </div>
  );
}
