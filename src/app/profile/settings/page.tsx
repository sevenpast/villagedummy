'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    countryOfOrigin: '',
    hasChildren: false,
    childrenCount: 0,
    targetCanton: '',
    targetMunicipality: '',
    targetPostalCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('expatvillage_current_user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Pre-fill form with existing data
      setFormData({
        name: user.first_name || '',
        countryOfOrigin: user.country_of_origin || '',
        hasChildren: user.has_children || false,
        childrenCount: user.children_count || 0,
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name) newErrors.name = 'Name is required';

    // Children validation
    if (formData.hasChildren && formData.childrenCount === 0) {
      newErrors.childrenCount = 'Please specify number of children';
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
      // Determine EU/EFTA status based on country
      const euEftaCountries = ['DE', 'FR', 'IT', 'AT', 'ES', 'NL', 'BE', 'NO', 'IS', 'LI', 'CH'];
      const isEUEFTA = formData.countryOfOrigin ? euEftaCountries.includes(formData.countryOfOrigin) : false;

      // Update user profile
      const updatedUser = {
        ...currentUser,
        first_name: formData.name,
        country_of_origin: formData.countryOfOrigin,
        is_eu_efta_citizen: isEUEFTA,
        has_children: formData.hasChildren,
        children_count: formData.childrenCount,
        target_canton: formData.targetCanton,
        target_municipality: formData.targetMunicipality,
        target_postal_code: formData.targetPostalCode,
        profile_completeness: {
          basic_info: true,
          country_info: !!formData.countryOfOrigin,
          family_info: formData.hasChildren,
          location_info: !!formData.targetCanton,
          completeness_percentage: 0
        },
        updated_at: new Date().toISOString()
      };

      // Calculate completeness percentage
      let completedFields = 0;
      if (updatedUser.profile_completeness.basic_info) completedFields++;
      if (updatedUser.profile_completeness.country_info) completedFields++;
      if (updatedUser.profile_completeness.family_info) completedFields++;
      if (updatedUser.profile_completeness.location_info) completedFields++;
      updatedUser.profile_completeness.completeness_percentage = (completedFields / 4) * 100;

      // Update localStorage
      const existingUsers = JSON.parse(localStorage.getItem('expatvillage_users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === currentUser.id);
      if (userIndex !== -1) {
        existingUsers[userIndex] = updatedUser;
        localStorage.setItem('expatvillage_users', JSON.stringify(existingUsers));
      }
      
      // Update current user session
      localStorage.setItem('expatvillage_current_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // Show success state and redirect
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      setErrors({ submit: error.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    router.push('/');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access profile settings.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
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
              <p className="text-sm font-medium text-gray-900">Profile Settings</p>
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
      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h1>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="space-y-4">
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
                  </div>
                </div>

                {/* Country Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Country Information</h3>
                  
                  <div className="mb-4">
                    <label htmlFor="countryOfOrigin" className="block text-sm font-medium text-gray-700">
                      Country of Origin
                    </label>
                    <select
                      id="countryOfOrigin"
                      name="countryOfOrigin"
                      value={formData.countryOfOrigin}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${
                        errors.countryOfOrigin ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select your country</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.countryOfOrigin && <p className="mt-1 text-sm text-red-600">{errors.countryOfOrigin}</p>}
                  </div>
                </div>

                {/* Family Status */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Family Status</h3>
                  
                  <div className="mb-4">
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
                      <div className="mt-3">
                        <label htmlFor="childrenCount" className="block text-sm font-medium text-gray-700">
                          Number of Children *
                        </label>
                        <input
                          id="childrenCount"
                          name="childrenCount"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.childrenCount}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${
                            errors.childrenCount ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.childrenCount && <p className="mt-1 text-sm text-red-600">{errors.childrenCount}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Location */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Target Location in Switzerland</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="targetCanton" className="block text-sm font-medium text-gray-700">
                        Target Canton
                      </label>
                      <select
                        id="targetCanton"
                        name="targetCanton"
                        value={formData.targetCanton}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${
                          errors.targetCanton ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select canton</option>
                        {cantons.map((canton) => (
                          <option key={canton} value={canton}>
                            {canton}
                          </option>
                        ))}
                      </select>
                      {errors.targetCanton && <p className="mt-1 text-sm text-red-600">{errors.targetCanton}</p>}
                    </div>

                    <div>
                      <label htmlFor="targetPostalCode" className="block text-sm font-medium text-gray-700">
                        Postal Code
                      </label>
                      <input
                        id="targetPostalCode"
                        name="targetPostalCode"
                        type="text"
                        value={formData.targetPostalCode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="targetMunicipality" className="block text-sm font-medium text-gray-700">
                      Municipality/City
                    </label>
                    <input
                      id="targetMunicipality"
                      name="targetMunicipality"
                      type="text"
                      value={formData.targetMunicipality}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="border-t pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSuccess 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
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
    </div>
  );
}

