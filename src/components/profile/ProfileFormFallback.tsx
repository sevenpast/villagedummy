'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/lib/types'

interface ProfileFormFallbackProps {
  user: User
}

export function ProfileFormFallback({ user }: ProfileFormFallbackProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    movedToSwitzerland: '',
    planningToStay: '',
    originCountry: '',
    lastResidenceCountry: '',
    dateOfBirth: '',
    livingWith: '',
    homeAddress: '',
    workAddress: '',
    hasChildren: '',
    childrenAges: '',
    currentSituation: '',
    interests: '',
    primaryLanguage: '',
    aboutMe: ''
  })

  const supabase = createClient()

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data && !error) {
          setExistingProfile(data)
          setFormData({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            gender: data.gender || '',
            phone: data.phone || '',
            movedToSwitzerland: data.moved_to_switzerland || '',
            planningToStay: data.planning_to_stay || '',
            originCountry: data.country_of_origin || '',
            lastResidenceCountry: data.last_residence_country || '',
            dateOfBirth: data.date_of_birth || '',
            livingWith: data.living_with || '',
            homeAddress: data.home_address || '',
            workAddress: data.work_address || '',
            hasChildren: data.has_children ? '1' : '0',
            childrenAges: data.children_ages || '',
            currentSituation: data.current_situation || '',
            interests: data.interests || '',
            primaryLanguage: data.primary_language || '',
            aboutMe: data.about_me || ''
          })
          if (data.profile_image_url) {
            setProfileImage(data.profile_image_url)
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      }
    }

    loadProfile()
  }, [user.id, supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
    setSuccess(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // For now, just simulate success and store in localStorage
      const profileData = {
        user_id: user.id,
        email: user.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        gender: formData.gender || null,
        moved_to_switzerland: formData.movedToSwitzerland || null,
        planning_to_stay: formData.planningToStay || null,
        country_of_origin: formData.originCountry || null,
        last_residence_country: formData.lastResidenceCountry || null,
        date_of_birth: formData.dateOfBirth || null,
        living_with: formData.livingWith || null,
        home_address: formData.homeAddress || null,
        work_address: formData.workAddress || null,
        has_children: formData.hasChildren === '1' || formData.hasChildren === '2' || formData.hasChildren === '3' || formData.hasChildren === '4+',
        children_ages: formData.childrenAges || null,
        current_situation: formData.currentSituation || null,
        interests: formData.interests || null,
        primary_language: formData.primaryLanguage || null,
        about_me: formData.aboutMe || null,
        profile_image_url: profileImage || null,
        updated_at: new Date().toISOString()
      }

      // Store in localStorage as fallback
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
      
      setSuccess('Profile saved locally! Database permissions need to be fixed.')
      
      // Redirect to dashboard after successful save
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
      
    } catch (err: any) {
      console.error('Profile update error:', err)
      setError(err.message || 'An error occurred while updating your profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-xl font-bold text-gray-900 ml-4">Village</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full flex flex-col md:flex-row bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 space-y-8 md:space-y-0 md:space-x-8">
          {/* Left Column: Profile Picture & Info Text */}
          <div className="md:w-1/3 flex flex-col items-center text-center space-y-6">
            <div className="relative w-32 h-32 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden border-2 border-gray-300">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="profile-picture-upload"
                className="absolute bottom-0 right-0 bg-gray-700 text-white rounded-full p-2 cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </label>
            </div>

            {/* Info Text */}
            <div className="text-sm text-gray-700 space-y-4">
              <p>
                The better we get to know you the more{' '}
                <span className="font-bold">we can tailor your experience on Village!</span>
              </p>
              <p>
                By creating a profile you will{' '}
                <span className="font-bold">appear on the neighborhood map (launching soon!)</span>{' '}
                where you can view other profiles and get in touch with people nearby!
              </p>
              <p>
                Don't worry, you can always edit your information or hide your profile in the settings.
              </p>
            </div>
          </div>

          {/* Right Column: Profile Form */}
          <div className="md:w-2/3 max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 border-b-2 border-gray-300 pb-2">
              Create Your Profile
            </h1>

            {/* Database Error Notice */}
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Database Permissions Issue
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your profile will be saved locally for now. To fix this permanently, 
                      please run the database migration in Supabase. Check the{' '}
                      <code className="bg-yellow-200 px-1 rounded">QUICK_FIX_INSTRUCTIONS.md</code> file.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Basic information about you
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your first name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your last name"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94l-1.72-1.72z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Success</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{success}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Profile (Local)'}
                </button>
                
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
