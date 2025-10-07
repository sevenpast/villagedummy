'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SwissPlaceAutocomplete from '../../components/SwissPlaceAutocomplete';
import EUStatusIndicator from '../../components/EUStatusIndicator';


export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
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
    targetPostalCode: '',
    targetMunicipality: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    let processedValue = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = value === '' ? 0 : parseInt(value, 10) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Handle children checkbox
    if (name === 'hasChildren') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        hasChildren: isChecked,
        childrenCount: isChecked ? (prev.childrenCount === 0 ? 1 : prev.childrenCount) : 0
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validation - only name and password are required
      const missingFields = [];
      if (!formData.name) missingFields.push('Name');
      if (!formData.password) missingFields.push('Password');
      
      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Validate children count if hasChildren is true
      if (formData.hasChildren && (!formData.childrenCount || formData.childrenCount < 1)) {
        setError('Please enter a valid number of children (minimum 1)');
        setIsLoading(false);
        return;
      }

      // Create user in database
      const response = await fetch('/api/auth/demo-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.name.split(' ')[0] || formData.name,
          last_name: formData.name.split(' ').slice(1).join(' ') || '',
          country_of_origin: formData.countryOfOrigin,
          gender: formData.gender,
          nationality: formData.nationality,
          birth_place: formData.birthPlace,
          german_skills: formData.germanSkills,
          first_language: formData.firstLanguage,
          family_language: formData.familyLanguage,
          municipality: formData.targetMunicipality,
          canton: formData.targetCanton,
          postal_code: formData.targetPostalCode,
          has_kids: formData.hasChildren,
          num_children: formData.hasChildren ? formData.childrenCount : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store user data in localStorage for session management
      localStorage.setItem('village_current_user', JSON.stringify(data.user));
      localStorage.setItem('village_session', JSON.stringify(data.session));
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Village to get personalized guidance for your move to Switzerland
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username *
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                    placeholder="Choose a username"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                    placeholder="Enter your password"
                  />
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
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Critical Profile Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                This information is essential for the app to show you the right tasks and guidance.
              </p>
              <div className="mb-4">
                <label htmlFor="countryOfOrigin" className="block text-sm font-medium text-gray-700">
                  Country of Origin
                </label>
                <select
                  id="countryOfOrigin"
                  name="countryOfOrigin"
                  value={formData.countryOfOrigin}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                >
                  <option value="">Select your country</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IT">Italy</option>
                  <option value="AT">Austria</option>
                  <option value="ES">Spain</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="CH">Switzerland</option>
                  <option value="NO">Norway</option>
                  <option value="IS">Iceland</option>
                  <option value="LI">Liechtenstein</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                  <option value="IN">India</option>
                  <option value="BR">Brazil</option>
                  <option value="AR">Argentina</option>
                  <option value="MX">Mexico</option>
                  <option value="CN">China</option>
                  <option value="TW">Taiwan</option>
                  <option value="SG">Singapore</option>
                  <option value="HK">Hong Kong</option>
                  <option value="MY">Malaysia</option>
                  <option value="TH">Thailand</option>
                  <option value="PH">Philippines</option>
                  <option value="ID">Indonesia</option>
                  <option value="VN">Vietnam</option>
                  <option value="RU">Russia</option>
                  <option value="UA">Ukraine</option>
                  <option value="PL">Poland</option>
                  <option value="CZ">Czech Republic</option>
                  <option value="HU">Hungary</option>
                  <option value="RO">Romania</option>
                  <option value="BG">Bulgaria</option>
                  <option value="HR">Croatia</option>
                  <option value="SI">Slovenia</option>
                  <option value="SK">Slovakia</option>
                  <option value="LT">Lithuania</option>
                  <option value="LV">Latvia</option>
                  <option value="EE">Estonia</option>
                  <option value="FI">Finland</option>
                  <option value="SE">Sweden</option>
                  <option value="DK">Denmark</option>
                  <option value="IE">Ireland</option>
                  <option value="PT">Portugal</option>
                  <option value="GR">Greece</option>
                  <option value="CY">Cyprus</option>
                  <option value="MT">Malta</option>
                  <option value="LU">Luxembourg</option>
                  <option value="ZA">South Africa</option>
                  <option value="EG">Egypt</option>
                  <option value="NG">Nigeria</option>
                  <option value="KE">Kenya</option>
                  <option value="MA">Morocco</option>
                  <option value="TN">Tunisia</option>
                  <option value="IL">Israel</option>
                  <option value="TR">Turkey</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="QA">Qatar</option>
                  <option value="KW">Kuwait</option>
                  <option value="BH">Bahrain</option>
                  <option value="OM">Oman</option>
                  <option value="JO">Jordan</option>
                  <option value="LB">Lebanon</option>
                  <option value="OTHER">Other</option>
                </select>
                <EUStatusIndicator 
                  countryCode={formData.countryOfOrigin || ''} 
                  className="mt-2"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                  Nationality
                </label>
                <input
                  id="nationality"
                  name="nationality"
                  type="text"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                  placeholder="e.g. German, French, American"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700">
                  Place of Birth/Citizenship
                </label>
                <input
                  id="birthPlace"
                  name="birthPlace"
                  type="text"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                  placeholder="e.g. Berlin, Paris, New York"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="germanSkills" className="block text-sm font-medium text-gray-700">
                  German Language Skills
                </label>
                <select
                  id="germanSkills"
                  name="germanSkills"
                  value={formData.germanSkills}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                >
                  <option value="">Select German skills</option>
                  <option value="gut">Good (gut)</option>
                  <option value="mittel">Average (mittel)</option>
                  <option value="keine">None (keine)</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="firstLanguage" className="block text-sm font-medium text-gray-700">
                  First Language
                </label>
                <input
                  id="firstLanguage"
                  name="firstLanguage"
                  type="text"
                  value={formData.firstLanguage}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                  placeholder="e.g. English, Spanish, Arabic"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="familyLanguage" className="block text-sm font-medium text-gray-700">
                  Language Spoken in Family
                </label>
                <input
                  id="familyLanguage"
                  name="familyLanguage"
                  type="text"
                  value={formData.familyLanguage}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                  placeholder="e.g. English, Spanish, Arabic"
                />
              </div>
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="hasChildren"
                    name="hasChildren"
                    type="checkbox"
                    checked={formData.hasChildren}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasChildren" className="ml-2 block text-sm font-medium text-gray-700">
                    I have children
                  </label>
                </div>
                
                {/* Children count input - only show when hasChildren is true */}
                {formData.hasChildren && (
                  <div className="mt-3 ml-6 space-y-4">
                    <div>
                      <label htmlFor="childrenCount" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of children
                      </label>
                      <input
                        id="childrenCount"
                        name="childrenCount"
                        type="number"
                        min="1"
                        max="20"
                        value={formData.childrenCount || ''}
                        onChange={handleInputChange}
                        placeholder="e.g. 2"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="parentRole" className="block text-sm font-medium text-gray-700 mb-1">
                        Are you the father or mother?
                      </label>
                      <select
                        id="parentRole"
                        name="parentRole"
                        value={formData.parentRole}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select role</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Target Location in Switzerland</h3>
              <p className="text-sm text-gray-600 mb-4">
                This helps us provide location-specific guidance and requirements.
              </p>
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
                    className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                  >
                    <option value="">Select canton</option>
                    <option value="ZH">ZH</option>
                    <option value="BE">BE</option>
                    <option value="LU">LU</option>
                    <option value="UR">UR</option>
                    <option value="SZ">SZ</option>
                    <option value="OW">OW</option>
                    <option value="NW">NW</option>
                    <option value="GL">GL</option>
                    <option value="ZG">ZG</option>
                    <option value="FR">FR</option>
                    <option value="SO">SO</option>
                    <option value="BS">BS</option>
                    <option value="BL">BL</option>
                    <option value="SH">SH</option>
                    <option value="AR">AR</option>
                    <option value="AI">AI</option>
                    <option value="SG">SG</option>
                    <option value="GR">GR</option>
                    <option value="AG">AG</option>
                    <option value="TG">TG</option>
                    <option value="TI">TI</option>
                    <option value="VD">VD</option>
                    <option value="VS">VS</option>
                    <option value="NE">NE</option>
                    <option value="GE">GE</option>
                    <option value="JU">JU</option>
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}