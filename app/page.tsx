'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signin page when accessing the root
    router.push('/signin');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome to Village
        </h1>
        <p className="text-gray-600">
          Redirecting to sign in...
        </p>
      </div>
    </div>
  );
}
