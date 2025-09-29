'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Task definitions with visibility logic
const allTasks = [
  {
    id: 'secure_visa',
    title: 'Secure residence permit / visa',
    description: 'Apply for the necessary residence permit or visa before entering Switzerland',
    priority: 'high',
    category: 'visa',
    visibility: {
      // Only show to non-EU/EFTA citizens or if country is not specified
      condition: (user: any) => !user.is_eu_efta_citizen || !user.country_of_origin
    }
  },
  {
    id: 'find_housing',
    title: 'Find housing',
    description: 'Search for and secure accommodation in your target location',
    priority: 'high',
    category: 'housing',
    visibility: {
      // Show to everyone
      condition: () => true
    }
  },
  {
    id: 'register_gemeinde',
    title: 'Register at your Gemeinde (municipality)',
    description: 'Register your residence with the local municipality within 14 days of arrival',
    priority: 'high',
    category: 'registration',
    visibility: {
      // Show to everyone
      condition: () => true
    }
  },
  {
    id: 'register_school',
    title: 'Register for school/kindergarten',
    description: 'Register your children for school or kindergarten',
    priority: 'medium',
    category: 'family',
    visibility: {
      // Always show to everyone
      condition: () => true
    }
  },
  {
    id: 'receive_permit_card',
    title: 'Receive residence permit card',
    description: 'Collect your residence permit card from the cantonal migration office',
    priority: 'medium',
    category: 'permit',
    visibility: {
      // Show to everyone
      condition: () => true
    }
  }
];

// Function to determine which tasks are visible to a user
function getVisibleTasks(user: any) {
  return allTasks.filter(task => task.visibility.condition(user));
}

// TaskCard component
function TaskCard({ task, user }: { task: any, user: any }) {
  const handleCardClick = () => {
    // Navigate to task detail page
    window.location.href = `/tasks/${task.id}`;
  };

  // Check if task is completed - must be user-specific
  const isCompleted = () => {
    if (!user?.first_name) return false; // No user, no completion
    
    // Use user-specific localStorage key to prevent cross-user contamination
    const userSpecificKey = `expatvillage_completed_tasks_${user.first_name}`;
    const completedTasks = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');
    return completedTasks.includes(task.id);
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative"
      onClick={handleCardClick}
    >
      <h3 className="text-lg font-medium text-gray-900 text-center">
        {task.title}
      </h3>
      
      {/* Green checkmark for completed tasks */}
      {isCompleted() && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('expatvillage_current_user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('expatvillage_current_user');
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to ExpatVillage
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your personal guide to settling in Switzerland
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <Link
                href="/auth/signup"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Account
              </Link>
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <p className="text-sm font-medium text-gray-900">Welcome, {currentUser.first_name}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/profile/settings"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Tasks Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Your Tasks
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getVisibleTasks(currentUser).map((task, index) => (
                  <TaskCard key={index} task={task} user={currentUser} />
                ))}
              </div>

              {/* Show message if no tasks are visible */}
              {getVisibleTasks(currentUser).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks available</h3>
                  <p className="text-gray-600">
                    Complete your profile information to see personalized tasks.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}