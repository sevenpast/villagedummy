'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SwissPlaceAutocomplete from '../../components/SwissPlaceAutocomplete';
import EUStatusIndicator from '../../components/EUStatusIndicator';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
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
    if (name === 'hasChildren' && !processedValue) {
      setFormData(prev => ({
        ...prev,
        childrenCount: 0,
        parentRole: ''
      }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.password) {
      setError('First name, last name, and password are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          country_of_origin: formData.countryOfOrigin,
          gender: formData.gender,
          nationality: formData.nationality,
          birth_place: formData.birthPlace,
          german_skills: formData.germanSkills,
          first_language: formData.firstLanguage,
          family_language: formData.familyLanguage,
          has_kids: formData.hasChildren,
          num_children: formData.childrenCount,
          municipality: formData.targetMunicipality,
          canton: formData.targetCanton,
          postal_code: formData.targetPostalCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store user data in localStorage for session management
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('session', JSON.stringify(data.session));

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Village community
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSignUp}>
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Country Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Country Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="countryOfOrigin" className="block text-sm font-medium text-gray-700">
                  Country of Origin
                </label>
                <input
                  type="text"
                  name="countryOfOrigin"
                  id="countryOfOrigin"
                  value={formData.countryOfOrigin}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <EUStatusIndicator countryCode={formData.countryOfOrigin} />
              </div>
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  id="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700">
                  Birth Place
                </label>
                <input
                  type="text"
                  name="birthPlace"
                  id="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Language Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Language Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="germanSkills" className="block text-sm font-medium text-gray-700">
                  German Skills
                </label>
                <select
                  name="germanSkills"
                  id="germanSkills"
                  value={formData.germanSkills}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select level</option>
                  <option value="none">None</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="native">Native</option>
                </select>
              </div>
              <div>
                <label htmlFor="firstLanguage" className="block text-sm font-medium text-gray-700">
                  First Language
                </label>
                <input
                  type="text"
                  name="firstLanguage"
                  id="firstLanguage"
                  value={formData.firstLanguage}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="familyLanguage" className="block text-sm font-medium text-gray-700">
                  Family Language
                </label>
                <input
                  type="text"
                  name="familyLanguage"
                  id="familyLanguage"
                  value={formData.familyLanguage}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Family Information</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hasChildren"
                  id="hasChildren"
                  checked={formData.hasChildren}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasChildren" className="ml-2 block text-sm text-gray-900">
                  I have children
                </label>
              </div>
              
              {formData.hasChildren && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="childrenCount" className="block text-sm font-medium text-gray-700">
                      Number of Children
                    </label>
                    <input
                      type="number"
                      name="childrenCount"
                      id="childrenCount"
                      min="1"
                      max="10"
                      value={formData.childrenCount}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="parentRole" className="block text-sm font-medium text-gray-700">
                      Parent Role
                    </label>
                    <select
                      name="parentRole"
                      id="parentRole"
                      value={formData.parentRole}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select role</option>
                      <option value="mother">Mother</option>
                      <option value="father">Father</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Target Location */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Target Location in Switzerland</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="targetCanton" className="block text-sm font-medium text-gray-700">
                  Canton
                </label>
                <select
                  name="targetCanton"
                  id="targetCanton"
                  value={formData.targetCanton}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select canton</option>
                  <option value="ZH">Zurich</option>
                  <option value="BE">Bern</option>
                  <option value="LU">Lucerne</option>
                  <option value="UR">Uri</option>
                  <option value="SZ">Schwyz</option>
                  <option value="OW">Obwalden</option>
                  <option value="NW">Nidwalden</option>
                  <option value="GL">Glarus</option>
                  <option value="ZG">Zug</option>
                  <option value="FR">Fribourg</option>
                  <option value="SO">Solothurn</option>
                  <option value="BS">Basel-Stadt</option>
                  <option value="BL">Basel-Landschaft</option>
                  <option value="SH">Schaffhausen</option>
                  <option value="AR">Appenzell Ausserrhoden</option>
                  <option value="AI">Appenzell Innerrhoden</option>
                  <option value="SG">St. Gallen</option>
                  <option value="GR">Graubünden</option>
                  <option value="AG">Aargau</option>
                  <option value="TG">Thurgau</option>
                  <option value="TI">Ticino</option>
                  <option value="VD">Vaud</option>
                  <option value="VS">Valais</option>
                  <option value="NE">Neuchâtel</option>
                  <option value="GE">Geneva</option>
                  <option value="JU">Jura</option>
                </select>
              </div>
              <div>
                <label htmlFor="targetPostalCode" className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <SwissPlaceAutocomplete
                  value={formData.targetPostalCode}
                  onChange={(value) => setFormData(prev => ({ ...prev, targetPostalCode: value }))}
                  onPlaceSelect={(place) => {
                    setFormData(prev => ({
                      ...prev,
                      targetPostalCode: place.postalCode,
                      targetMunicipality: place.municipality
                    }));
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="targetMunicipality" className="block text-sm font-medium text-gray-700">
                  Municipality
                </label>
                <input
                  type="text"
                  name="targetMunicipality"
                  id="targetMunicipality"
                  value={formData.targetMunicipality}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-600 text-sm">
                {error}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="/signin" className="text-blue-600 hover:text-blue-500">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}