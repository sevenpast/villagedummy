'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import PostalCodeAutocomplete from '@/components/PostalCodeAutocomplete'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [existingProfile, setExistingProfile] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    // Basic info
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    
    // Private info (not shown to other users)
    movedToSwitzerland: '',
    planningToStay: '',
    originCountry: '',
    lastResidenceCountry: '',
    dateOfBirth: '',
    livingWith: '',
    
    // Public info (shown to other users)
    homeAddress: '',
    workAddress: '',
    postalCode: '',
    municipality: '',
    canton: '',
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
        console.log('Loading profile for user:', user.id)
        
        // Verwende API Route für das Laden der Profildaten
        const response = await fetch(`/api/profile?userId=${user.id}`)
        console.log('API response status:', response.status)
        
        const result = await response.json()
        console.log('API response data:', result)
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to load profile')
        }
        
        const data = result.data

        if (data) {
          console.log('Profile data found:', data)
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
            postalCode: data.postal_code || '',
            municipality: data.municipality || '',
            canton: data.canton || '',
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
        } else {
          console.log('No profile data found for user')
        }
      } catch (err: any) {
        console.error('Error loading profile:', err)
        setError(err.message || 'An error occurred while loading your profile')
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
      // Prepare the data object with only non-empty values
      const profileData: any = {
        user_id: user.id,
        email: user.email,
        updated_at: new Date().toISOString()
      }

      // Only add fields that have values
      if (formData.firstName) profileData.first_name = formData.firstName
      if (formData.lastName) profileData.last_name = formData.lastName
      if (formData.phone) profileData.phone = formData.phone
      if (formData.gender) profileData.gender = formData.gender
      if (formData.movedToSwitzerland) profileData.moved_to_switzerland = formData.movedToSwitzerland
      if (formData.planningToStay) profileData.planning_to_stay = formData.planningToStay
      if (formData.originCountry) profileData.country_of_origin = formData.originCountry
      if (formData.lastResidenceCountry) profileData.last_residence_country = formData.lastResidenceCountry
      if (formData.dateOfBirth) profileData.date_of_birth = formData.dateOfBirth
      if (formData.livingWith) profileData.living_with = formData.livingWith
      if (formData.homeAddress) profileData.home_address = formData.homeAddress
      if (formData.workAddress) profileData.work_address = formData.workAddress
      if (formData.postalCode) profileData.postal_code = formData.postalCode
      if (formData.municipality) profileData.municipality = formData.municipality
      if (formData.canton) profileData.canton = formData.canton
      if (formData.hasChildren) {
        profileData.has_children = formData.hasChildren === '1' || formData.hasChildren === '2' || formData.hasChildren === '3' || formData.hasChildren === '4+'
      }
      if (formData.childrenAges) profileData.children_ages = formData.childrenAges
      if (formData.currentSituation) profileData.current_situation = formData.currentSituation
      if (formData.interests) profileData.interests = formData.interests
      if (formData.primaryLanguage) profileData.primary_language = formData.primaryLanguage
      if (formData.aboutMe) profileData.about_me = formData.aboutMe
      if (profileImage) profileData.profile_image_url = profileImage

      console.log('Saving profile data:', profileData)
      console.log('Current user:', user)
      console.log('Supabase client:', supabase)

      // Check if user is authenticated
      if (!user || !user.id) {
        throw new Error('User not authenticated')
      }

      // Verwende API Route für Profil-Operationen
      console.log('Saving profile via API...')
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          user_id: user.id
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile')
      }
      
      const data = result.data

      // Keine Error-Behandlung mehr nötig, da API Route das macht

      setSuccess('Profile updated successfully!')
      
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
    // Redirect to dashboard or next step
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <div className="flex-1 flex">
        {/* Left Column - Profile Picture & Info */}
        <div className="w-1/3 p-8 flex flex-col items-center">
          {/* Profile Picture Section */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center border-4 border-amber-200">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => document.getElementById('profile-image-upload')?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Info Text */}
          <div className="text-sm text-gray-700 space-y-4">
            <p>
              The better we get to know you the more{' '}
              <strong>we can tailor your experience on Village!</strong>
            </p>
            <p>
              By creating a profile you will{' '}
              <strong>appear on the neighborhood map (launching soon!)</strong>{' '}
              where you can view other profiles and get in touch with people nearby!
            </p>
            <p>
              Don't worry, you can always edit your information or hide your profile in the settings.
            </p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-2/3 p-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 border-b-2 border-gray-300 pb-2">
              Create Your Profile
            </h1>

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

              {/* Private Info Section */}
              <div className="space-y-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    This info is NOT shown to other users. It's used to enhance your experience on Village
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="movedToSwitzerland" className="block text-sm font-medium text-gray-700 mb-1">
                      When did you move to Switzerland?
                    </label>
                    <input
                      id="movedToSwitzerland"
                      name="movedToSwitzerland"
                      type="date"
                      value={formData.movedToSwitzerland}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="calendar"
                    />
                  </div>

                  <div>
                    <label htmlFor="planningToStay" className="block text-sm font-medium text-gray-700 mb-1">
                      How long are you planning to live in Switzerland?
                    </label>
                    <select
                      id="planningToStay"
                      name="planningToStay"
                      value={formData.planningToStay}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">(&lt;1 yrs / 1-3 yrs / 3+ yrs / not sure)</option>
                      <option value="<1">Less than 1 year</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3+">3+ years</option>
                      <option value="not-sure">Not sure</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="originCountry" className="block text-sm font-medium text-gray-700 mb-1">
                      Where are you from, originally?
                    </label>
                    <select
                      id="originCountry"
                      name="originCountry"
                      value={formData.originCountry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select country</option>
                      <option value="afghanistan">Afghanistan</option>
                      <option value="albania">Albania</option>
                      <option value="algeria">Algeria</option>
                      <option value="argentina">Argentina</option>
                      <option value="armenia">Armenia</option>
                      <option value="australia">Australia</option>
                      <option value="austria">Austria</option>
                      <option value="azerbaijan">Azerbaijan</option>
                      <option value="bangladesh">Bangladesh</option>
                      <option value="belarus">Belarus</option>
                      <option value="belgium">Belgium</option>
                      <option value="bolivia">Bolivia</option>
                      <option value="bosnia-herzegovina">Bosnia and Herzegovina</option>
                      <option value="brazil">Brazil</option>
                      <option value="bulgaria">Bulgaria</option>
                      <option value="cambodia">Cambodia</option>
                      <option value="canada">Canada</option>
                      <option value="chile">Chile</option>
                      <option value="china">China</option>
                      <option value="colombia">Colombia</option>
                      <option value="croatia">Croatia</option>
                      <option value="czech-republic">Czech Republic</option>
                      <option value="denmark">Denmark</option>
                      <option value="ecuador">Ecuador</option>
                      <option value="egypt">Egypt</option>
                      <option value="estonia">Estonia</option>
                      <option value="finland">Finland</option>
                      <option value="france">France</option>
                      <option value="georgia">Georgia</option>
                      <option value="germany">Germany</option>
                      <option value="ghana">Ghana</option>
                      <option value="greece">Greece</option>
                      <option value="hungary">Hungary</option>
                      <option value="iceland">Iceland</option>
                      <option value="india">India</option>
                      <option value="indonesia">Indonesia</option>
                      <option value="iran">Iran</option>
                      <option value="iraq">Iraq</option>
                      <option value="ireland">Ireland</option>
                      <option value="israel">Israel</option>
                      <option value="italy">Italy</option>
                      <option value="japan">Japan</option>
                      <option value="jordan">Jordan</option>
                      <option value="kazakhstan">Kazakhstan</option>
                      <option value="kenya">Kenya</option>
                      <option value="south-korea">South Korea</option>
                      <option value="kuwait">Kuwait</option>
                      <option value="latvia">Latvia</option>
                      <option value="lebanon">Lebanon</option>
                      <option value="lithuania">Lithuania</option>
                      <option value="luxembourg">Luxembourg</option>
                      <option value="malaysia">Malaysia</option>
                      <option value="mexico">Mexico</option>
                      <option value="morocco">Morocco</option>
                      <option value="netherlands">Netherlands</option>
                      <option value="new-zealand">New Zealand</option>
                      <option value="nigeria">Nigeria</option>
                      <option value="norway">Norway</option>
                      <option value="pakistan">Pakistan</option>
                      <option value="peru">Peru</option>
                      <option value="philippines">Philippines</option>
                      <option value="poland">Poland</option>
                      <option value="portugal">Portugal</option>
                      <option value="romania">Romania</option>
                      <option value="russia">Russia</option>
                      <option value="saudi-arabia">Saudi Arabia</option>
                      <option value="serbia">Serbia</option>
                      <option value="singapore">Singapore</option>
                      <option value="slovakia">Slovakia</option>
                      <option value="slovenia">Slovenia</option>
                      <option value="south-africa">South Africa</option>
                      <option value="spain">Spain</option>
                      <option value="sri-lanka">Sri Lanka</option>
                      <option value="sweden">Sweden</option>
                      <option value="switzerland">Switzerland</option>
                      <option value="thailand">Thailand</option>
                      <option value="turkey">Turkey</option>
                      <option value="ukraine">Ukraine</option>
                      <option value="united-arab-emirates">United Arab Emirates</option>
                      <option value="united-kingdom">United Kingdom</option>
                      <option value="united-states">United States</option>
                      <option value="vietnam">Vietnam</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="lastResidenceCountry" className="block text-sm font-medium text-gray-700 mb-1">
                      What country did you move from (last residence)?
                    </label>
                    <select
                      id="lastResidenceCountry"
                      name="lastResidenceCountry"
                      value={formData.lastResidenceCountry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select country</option>
                      <option value="afghanistan">Afghanistan</option>
                      <option value="albania">Albania</option>
                      <option value="algeria">Algeria</option>
                      <option value="argentina">Argentina</option>
                      <option value="armenia">Armenia</option>
                      <option value="australia">Australia</option>
                      <option value="austria">Austria</option>
                      <option value="azerbaijan">Azerbaijan</option>
                      <option value="bangladesh">Bangladesh</option>
                      <option value="belarus">Belarus</option>
                      <option value="belgium">Belgium</option>
                      <option value="bolivia">Bolivia</option>
                      <option value="bosnia-herzegovina">Bosnia and Herzegovina</option>
                      <option value="brazil">Brazil</option>
                      <option value="bulgaria">Bulgaria</option>
                      <option value="cambodia">Cambodia</option>
                      <option value="canada">Canada</option>
                      <option value="chile">Chile</option>
                      <option value="china">China</option>
                      <option value="colombia">Colombia</option>
                      <option value="croatia">Croatia</option>
                      <option value="czech-republic">Czech Republic</option>
                      <option value="denmark">Denmark</option>
                      <option value="ecuador">Ecuador</option>
                      <option value="egypt">Egypt</option>
                      <option value="estonia">Estonia</option>
                      <option value="finland">Finland</option>
                      <option value="france">France</option>
                      <option value="georgia">Georgia</option>
                      <option value="germany">Germany</option>
                      <option value="ghana">Ghana</option>
                      <option value="greece">Greece</option>
                      <option value="hungary">Hungary</option>
                      <option value="iceland">Iceland</option>
                      <option value="india">India</option>
                      <option value="indonesia">Indonesia</option>
                      <option value="iran">Iran</option>
                      <option value="iraq">Iraq</option>
                      <option value="ireland">Ireland</option>
                      <option value="israel">Israel</option>
                      <option value="italy">Italy</option>
                      <option value="japan">Japan</option>
                      <option value="jordan">Jordan</option>
                      <option value="kazakhstan">Kazakhstan</option>
                      <option value="kenya">Kenya</option>
                      <option value="south-korea">South Korea</option>
                      <option value="kuwait">Kuwait</option>
                      <option value="latvia">Latvia</option>
                      <option value="lebanon">Lebanon</option>
                      <option value="lithuania">Lithuania</option>
                      <option value="luxembourg">Luxembourg</option>
                      <option value="malaysia">Malaysia</option>
                      <option value="mexico">Mexico</option>
                      <option value="morocco">Morocco</option>
                      <option value="netherlands">Netherlands</option>
                      <option value="new-zealand">New Zealand</option>
                      <option value="nigeria">Nigeria</option>
                      <option value="norway">Norway</option>
                      <option value="pakistan">Pakistan</option>
                      <option value="peru">Peru</option>
                      <option value="philippines">Philippines</option>
                      <option value="poland">Poland</option>
                      <option value="portugal">Portugal</option>
                      <option value="romania">Romania</option>
                      <option value="russia">Russia</option>
                      <option value="saudi-arabia">Saudi Arabia</option>
                      <option value="serbia">Serbia</option>
                      <option value="singapore">Singapore</option>
                      <option value="slovakia">Slovakia</option>
                      <option value="slovenia">Slovenia</option>
                      <option value="south-africa">South Africa</option>
                      <option value="spain">Spain</option>
                      <option value="sri-lanka">Sri Lanka</option>
                      <option value="sweden">Sweden</option>
                      <option value="switzerland">Switzerland</option>
                      <option value="thailand">Thailand</option>
                      <option value="turkey">Turkey</option>
                      <option value="ukraine">Ukraine</option>
                      <option value="united-arab-emirates">United Arab Emirates</option>
                      <option value="united-kingdom">United Kingdom</option>
                      <option value="united-states">United States</option>
                      <option value="vietnam">Vietnam</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="dropdown"
                    />
                  </div>

                  <div>
                    <label htmlFor="livingWith" className="block text-sm font-medium text-gray-700 mb-1">
                      Who is living with you?
                    </label>
                    <select
                      id="livingWith"
                      name="livingWith"
                      value={formData.livingWith}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">(dropdown)</option>
                      <option value="alone">Alone</option>
                      <option value="partner">With partner</option>
                      <option value="family">With family</option>
                      <option value="roommates">With roommates</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Public Info Section */}
              <div className="space-y-6">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <p className="text-sm text-orange-800">
                    This info is shown to other users. It helps you find your people
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <PostalCodeAutocomplete
                      value={formData.postalCode}
                      onChange={(value) => setFormData(prev => ({ ...prev, postalCode: value }))}
                      onCityChange={(city) => setFormData(prev => ({ ...prev, municipality: city }))}
                      onCantonChange={(canton, cantonCode) => setFormData(prev => ({ ...prev, canton: canton }))}
                      placeholder="Enter postal code or city..."
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Start typing to see suggestions
                    </p>
                  </div>

                  <div>
                    <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                      Municipality
                    </label>
                    <input
                      id="municipality"
                      name="municipality"
                      type="text"
                      value={formData.municipality}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Auto-filled from postal code"
                      readOnly
                    />
                  </div>

                  <div>
                    <label htmlFor="canton" className="block text-sm font-medium text-gray-700 mb-1">
                      Canton
                    </label>
                    <input
                      id="canton"
                      name="canton"
                      type="text"
                      value={formData.canton}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Auto-filled from postal code"
                      readOnly
                    />
                  </div>

                  <div>
                    <label htmlFor="homeAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      What's your home address?
                    </label>
                    <input
                      id="homeAddress"
                      name="homeAddress"
                      type="text"
                      value={formData.homeAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Street address (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      → On the map, we position your pin(s) around 100m away to keep your exact location private
                    </p>
                  </div>

                  <div>
                    <label htmlFor="workAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      Add your work address to find events & people nearby
                    </label>
                    <input
                      id="workAddress"
                      name="workAddress"
                      type="text"
                      value={formData.workAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="searchable & auto-complete"
                    />
                  </div>

                  <div>
                    <label htmlFor="hasChildren" className="block text-sm font-medium text-gray-700 mb-1">
                      Do you have children? If yes, how old are they?
                    </label>
                    <select
                      id="hasChildren"
                      name="hasChildren"
                      value={formData.hasChildren}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">(number dropdown)</option>
                      <option value="0">No children</option>
                      <option value="1">1 child</option>
                      <option value="2">2 children</option>
                      <option value="3">3 children</option>
                      <option value="4+">4+ children</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="currentSituation" className="block text-sm font-medium text-gray-700 mb-1">
                      What best describes your current situation?
                    </label>
                    <select
                      id="currentSituation"
                      name="currentSituation"
                      value={formData.currentSituation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">(dropdown)</option>
                      <option value="student">Student</option>
                      <option value="working">Working</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="entrepreneur">Entrepreneur</option>
                      <option value="retired">Retired</option>
                      <option value="looking-for-work">Looking for work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                      (Family) Interests
                    </label>
                    <select
                      id="interests"
                      name="interests"
                      value={formData.interests}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">dropdown (0/5)</option>
                      <option value="sports">Sports</option>
                      <option value="music">Music</option>
                      <option value="art">Art</option>
                      <option value="cooking">Cooking</option>
                      <option value="travel">Travel</option>
                      <option value="reading">Reading</option>
                      <option value="gardening">Gardening</option>
                      <option value="photography">Photography</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="primaryLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                      What's your primary language?
                    </label>
                    <select
                      id="primaryLanguage"
                      name="primaryLanguage"
                      value={formData.primaryLanguage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">dropdown</option>
                      <option value="german">German</option>
                      <option value="english">English</option>
                      <option value="french">French</option>
                      <option value="italian">Italian</option>
                      <option value="spanish">Spanish</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-700 mb-1">
                      Tell people something about you / your family. This helps neighbours get to know you. You can keep it short & sweet!
                    </label>
                    <textarea
                      id="aboutMe"
                      name="aboutMe"
                      rows={4}
                      value={formData.aboutMe}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Value"
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
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

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-700 text-white py-3 px-6 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="bg-amber-200 h-8 flex items-center justify-between px-4">
        <span className="text-sm text-gray-700 font-medium">Village</span>
        <div className="flex space-x-4 text-sm text-gray-700">
          <a href="#" className="hover:text-gray-900">About</a>
          <span>|</span>
          <a href="#" className="hover:text-gray-900">Privacy</a>
          <span>|</span>
          <a href="#" className="hover:text-gray-900">Terms</a>
        </div>
      </div>
    </div>
  )
}
