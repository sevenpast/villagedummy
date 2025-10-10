'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwissPlaceAutocomplete from '../../components/SwissPlaceAutocomplete';
import EUStatusIndicator from '../../components/EUStatusIndicator';

// Country data for the dropdown
const countries = [
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'AT', name: 'Austria' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NO', name: 'Norway' },
  { code: 'IS', name: 'Iceland' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CN', name: 'China' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LV', name: 'Latvia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'MT', name: 'Malta' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'OTHER', name: 'Other' },
];

// Swiss cantons
const cantons = [
  'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'
];

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    countryOfOrigin: '',
    gender: '',
    nationality: '',
    birthPlace: '',
    germanSkills: '',
    firstLanguage: '',
    familyLanguage: '',
    hasChildren: false,
    childrenCount: 0,
    parentRole: '',
    targetCanton: '',
    targetMunicipality: '',
    targetPostalCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showUserData, setShowUserData] = useState(false);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('village_current_user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Pre-fill form with existing data
      setFormData({
        name: user.first_name || '',
        countryOfOrigin: user.country_of_origin || '',
        gender: user.gender || '',
        nationality: user.nationality || '',
        birthPlace: user.birth_place || '',
        germanSkills: user.german_skills || '',
        firstLanguage: user.first_language || '',
        familyLanguage: user.family_language || '',
        hasChildren: user.has_children || false,
        childrenCount: user.children_count || 0,
        parentRole: user.parent_role || '',
        targetCanton: user.target_canton || '',
        targetMunicipality: user.target_municipality || '',
        targetPostalCode: user.target_postal_code || '',
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Reset children count if hasChildren is false
        childrenCount: name === 'hasChildren' && !checked ? 0 : prev.childrenCount,
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePlaceSelect = (place: any) => {
    setFormData(prev => ({
      ...prev,
      targetPostalCode: place.postalCode,
      targetMunicipality: place.name,
      targetCanton: place.canton
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';

    // Children validation
    if (formData.hasChildren && formData.childrenCount === 0) {
      newErrors.childrenCount = 'Please specify number of children';
    }
    if (formData.hasChildren && !formData.parentRole) {
      newErrors.parentRole = 'Please specify if you are father or mother';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update user profile
      const updatedUser = {
        ...currentUser,
        first_name: formData.name,
        country_of_origin: formData.countryOfOrigin,
        gender: formData.gender,
        nationality: formData.nationality,
        birth_place: formData.birthPlace,
        german_skills: formData.germanSkills,
        first_language: formData.firstLanguage,
        family_language: formData.familyLanguage,
        has_children: formData.hasChildren,
        children_count: formData.childrenCount,
        parent_role: formData.parentRole,
        target_canton: formData.targetCanton,
        target_municipality: formData.targetMunicipality,
        target_postal_code: formData.targetPostalCode,
        updated_at: new Date().toISOString()
      };

      // Update localStorage
      const existingUsers = JSON.parse(localStorage.getItem('village_users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === currentUser.id);
      if (userIndex !== -1) {
        existingUsers[userIndex] = updatedUser;
        localStorage.setItem('village_users', JSON.stringify(existingUsers));
      }
      
      // Update current user session
      localStorage.setItem('village_current_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // Show success state and redirect
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      setErrors({ submit: error.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access profile settings.</p>
          <button 
            onClick={() => router.push('/signin')}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Sign In
          </button>
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
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-sm text-gray-600">Update your personal information</p>
            </div>
            <div>
              <button
                onClick={handleBackClick}
                className="bg-gray-200 text-gray-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form className="space-y-8" onSubmit={handleSubmit}>
                
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Gender *
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${
                          errors.gender ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                    </div>
                  </div>
                </div>

                {/* Country & Language Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Country & Language Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="countryOfOrigin" className="block text-sm font-medium text-gray-700">
                        Country of Origin
                      </label>
                      <select
                        id="countryOfOrigin"
                        name="countryOfOrigin"
                        value={formData.countryOfOrigin}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="">Select your country</option>
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <EUStatusIndicator 
                        countryCode={formData.countryOfOrigin || ''} 
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                        Nationality
                      </label>
                      <input
                        id="nationality"
                        name="nationality"
                        type="text"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g. German, French, American"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700">
                        Place of Birth/Citizenship
                      </label>
                      <input
                        id="birthPlace"
                        name="birthPlace"
                        type="text"
                        value={formData.birthPlace}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g. Berlin, Paris, New York"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="germanSkills" className="block text-sm font-medium text-gray-700">
                        German Language Skills
                      </label>
                      <select
                        id="germanSkills"
                        name="germanSkills"
                        value={formData.germanSkills}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="">Select German skills</option>
                        <option value="gut">Good (gut)</option>
                        <option value="mittel">Average (mittel)</option>
                        <option value="keine">None (keine)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="firstLanguage" className="block text-sm font-medium text-gray-700">
                        First Language
                      </label>
                      <input
                        id="firstLanguage"
                        name="firstLanguage"
                        type="text"
                        value={formData.firstLanguage}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g. English, Spanish, Arabic"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="familyLanguage" className="block text-sm font-medium text-gray-700">
                        Language Spoken in Family
                      </label>
                      <input
                        id="familyLanguage"
                        name="familyLanguage"
                        type="text"
                        value={formData.familyLanguage}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g. English, Spanish, Arabic"
                      />
                    </div>
                  </div>
                </div>

                {/* Family Status */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Family Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="hasChildren"
                        name="hasChildren"
                        type="checkbox"
                        checked={formData.hasChildren}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hasChildren" className="ml-2 block text-sm font-medium text-gray-700">
                        I have children
                      </label>
                    </div>
                    
                    {formData.hasChildren && (
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="childrenCount" className="block text-sm font-medium text-gray-700">
                            Number of Children *
                          </label>
                          <input
                            id="childrenCount"
                            name="childrenCount"
                            type="number"
                            min="1"
                            max="20"
                            value={formData.childrenCount}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${
                              errors.childrenCount ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.childrenCount && <p className="mt-1 text-sm text-red-600">{errors.childrenCount}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="parentRole" className="block text-sm font-medium text-gray-700">
                            Are you the father or mother? *
                          </label>
                          <select
                            id="parentRole"
                            name="parentRole"
                            value={formData.parentRole}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${
                              errors.parentRole ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select role</option>
                            <option value="father">Father</option>
                            <option value="mother">Mother</option>
                          </select>
                          {errors.parentRole && <p className="mt-1 text-sm text-red-600">{errors.parentRole}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Location */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Target Location in Switzerland</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="targetCanton" className="block text-sm font-medium text-gray-700">
                        Target Canton
                      </label>
                      <select
                        id="targetCanton"
                        name="targetCanton"
                        value={formData.targetCanton}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="">Select canton</option>
                        {cantons.map((canton) => (
                          <option key={canton} value={canton}>
                            {canton}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="targetPostalCode" className="block text-sm font-medium text-gray-700">
                        Postal Code & City
                      </label>
                      <SwissPlaceAutocomplete
                        value={`${formData.targetPostalCode} ${formData.targetMunicipality}`.trim()}
                        onSelect={handlePlaceSelect}
                        placeholder="PLZ oder Ort eingeben..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* My Data Button - Simple gray button */}
                <div className="border-t pt-6">
                  <button
                    type="button"
                    onClick={() => setShowDataModal(true)}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mb-4"
                  >
                    My Data (DSGVO)
                  </button>
                </div>

                {/* Submit Button */}
                <div className="border-t pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-600 hover:bg-gray-700"
                  >
                    {isSuccess ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Profile updated! Redirecting...
                      </div>
                    ) : isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating Profile...
                      </div>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>

                {errors.submit && (
                  <div className="text-center">
                    <p className="mt-1 text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-800">Profile updated successfully! Redirecting to dashboard...</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* My Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">My Data (DSGVO)</h3>
                <button
                  onClick={() => {
                    setShowDataModal(false);
                    setShowUserData(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!showUserData ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-6">Click the button below to view your personal data</p>
                  <button
                    onClick={() => setShowUserData(true)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    View My Data
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {currentUser?.first_name || 'Not provided'}</div>
                      <div><span className="font-medium">Gender:</span> {currentUser?.gender || 'Not provided'}</div>
                      <div><span className="font-medium">Country of Origin:</span> {currentUser?.country_of_origin || 'Not provided'}</div>
                      <div><span className="font-medium">Nationality:</span> {currentUser?.nationality || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Location Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Target Canton:</span> {currentUser?.target_canton || 'Not provided'}</div>
                      <div><span className="font-medium">Target Municipality:</span> {currentUser?.target_municipality || 'Not provided'}</div>
                      <div><span className="font-medium">Postal Code:</span> {currentUser?.target_postal_code || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Language & Family</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">German Skills:</span> {currentUser?.german_skills || 'Not provided'}</div>
                      <div><span className="font-medium">First Language:</span> {currentUser?.first_language || 'Not provided'}</div>
                      <div><span className="font-medium">Has Children:</span> {currentUser?.has_children ? 'Yes' : 'No'}</div>
                      {currentUser?.has_children && (
                        <div><span className="font-medium">Number of Children:</span> {currentUser?.children_count || 'Not specified'}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowUserData(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        setShowDataModal(false);
                        setShowUserData(false);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
