'use client';

import { mockUserProfile } from '@/data/mockData';

export function UserProfile() {
  const user = mockUserProfile;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Citizenship</h3>
          <p className="text-sm text-gray-600">
            {user.citizenship_info.country_of_origin}
            {user.citizenship_info.is_eu_efta ? ' (EU/EFTA)' : ' (Non-EU/EFTA)'}
          </p>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Residence</h3>
          <p className="text-sm text-gray-600">
            {user.residence_info.municipality}
          </p>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Family</h3>
          <p className="text-sm text-gray-600">
            {user.family_unit.length} family member(s)
            {user.family_unit.some(member => member.relationship === 'child') && ' (with children)'}
          </p>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Profile Status</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              user.profile_completeness.has_country && user.profile_completeness.has_family_status 
                ? 'bg-green-500' 
                : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {user.profile_completeness.has_country && user.profile_completeness.has_family_status 
                ? 'Complete' 
                : 'Incomplete'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
