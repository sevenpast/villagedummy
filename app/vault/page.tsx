'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DocumentVault from '../../components/DocumentVault';

export default function VaultPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get user ID from localStorage or session
    const storedUserData = localStorage.getItem('user_profile');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUserId(userData.id || userData.email || 'default');
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUserId('default');
      }
    } else {
      setUserId('default');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Document Vault</h1>
                <p className="text-sm text-gray-500">Secure document storage with AI recognition</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DocumentVault userId={userId} />
      </div>
    </div>
  );
}