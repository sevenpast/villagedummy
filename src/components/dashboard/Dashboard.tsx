'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/lib/types'
import Link from 'next/link'

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)


    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Village</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {profile?.first_name || 'User'}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">
            Manage your expat journey in Switzerland
          </p>
        </div>



              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  href="/document-vault"
                  className="bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  <div className="p-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Document Vault</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Store and manage your documents
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/tasks"
                  className="bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  <div className="p-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        View and manage your tasks
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  className="bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  <div className="p-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage your personal information
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/privacy"
                  className="bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  <div className="p-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Privacy & Data</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage your data and privacy settings
                      </p>
                    </div>
                  </div>
                </Link>
              </div>


      </div>
    </div>
  )
}
