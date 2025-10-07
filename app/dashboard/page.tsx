'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Home, User, Clock, CheckCircle2, Settings, Upload, Calendar, MapPin, Edit2, X, Building, GraduationCap, Vault } from 'lucide-react';
import SwissPlaceAutocomplete from '../../components/SwissPlaceAutocomplete';
import EUStatusIndicator from '../../components/EUStatusIndicator';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [vaultDocuments, setVaultDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState<number | null>(null);
  const [taskProgress, setTaskProgress] = useState<Record<number, number>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [profileFormData, setProfileFormData] = useState<any>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Calculate actual profile completeness
  const calculateProfileCompleteness = (userData: any) => {
    const requiredFields = {
      basic_info: ['first_name', 'last_name', 'email'],
      country_info: ['country_of_origin'],
      location_info: ['target_canton', 'target_municipality', 'target_postal_code'],
      family_info: []
    };

    let completedSections = 0;
    let totalSections = 4;

    const basicComplete = requiredFields.basic_info.every(field =>
      userData[field] && userData[field].toString().trim() !== ''
    );

    const countryComplete = requiredFields.country_info.every(field =>
      userData[field] !== undefined && userData[field] !== null && userData[field].toString().trim() !== ''
    );

    const locationComplete = requiredFields.location_info.every(field =>
      userData[field] && userData[field].toString().trim() !== ''
    );

    const familyComplete = userData.children && userData.children.length > 0;

    if (basicComplete) completedSections++;
    if (countryComplete) completedSections++;
    if (locationComplete) completedSections++;
    if (familyComplete) completedSections++;

    return Math.round((completedSections / totalSections) * 100);
  };

  // Secure logout function
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const accessToken = localStorage.getItem('village_access_token');
      
      if (accessToken) {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all local storage
      localStorage.removeItem('village_current_user');
      localStorage.removeItem('village_session');
      localStorage.removeItem('village_access_token');
      localStorage.removeItem('village_task_progress');
      localStorage.removeItem('village_children');
      
      // Redirect to signin
      router.push('/signin');
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    // Validate session and load user data
    const validateAndLoadUser = async () => {
      const currentUser = localStorage.getItem('village_current_user');
      const accessToken = localStorage.getItem('village_access_token');
      
      if (!currentUser || !accessToken) {
        router.push('/signin');
        return;
      }

      try {
        // Validate session with server
        const response = await fetch('/api/auth/validate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) {
          // Session invalid, clear storage and redirect
          localStorage.removeItem('village_current_user');
          localStorage.removeItem('village_session');
          localStorage.removeItem('village_access_token');
          router.push('/signin');
          return;
        }

        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          setFormData(data.user);
          loadUserDocuments(data.user);
          loadTasks(data.user);
        } else {
          router.push('/signin');
        }
      } catch (error) {
        console.error('Session validation error:', error);
        router.push('/signin');
      }
    };

    validateAndLoadUser();
  }, [router]);

  // Listen for task completion messages from child windows
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TASK_COMPLETED' || event.data.type === 'TASK_PROGRESS') {
        const { taskNumber, progress } = event.data;
        updateTaskProgress(taskNumber, progress);
        console.log(`Task ${taskNumber} progress updated to ${progress}%`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadUserDocuments = async (userData: any) => {
    try {
      const response = await fetch(`/api/documents/load?userId=${userData.id}`);
      const result = await response.json();

      if (result.success && Array.isArray(result.documents)) {
        const documents = result.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.filename || doc.title || 'Unknown Document',
          type: doc.document_type || 'document',
          uploadDate: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown',
          status: doc.status || 'active',
          url: doc.file_url || doc.content_url
        }));

        setVaultDocuments(documents);
        console.log(`📁 Loaded ${documents.length} documents from database`);
      } else {
        console.warn('Documents API not available, using mock data');
        setVaultDocuments([]);
      }
    } catch (error) {
      console.warn('Documents API not available, using mock data');
      setVaultDocuments([]);
    }
  };

  const loadTasks = async (userData: any) => {
    setLoadingTasks(true);
    try {
      const response = await fetch(`/api/tasks/load?userId=${userData.id}`);
      const result = await response.json();

      if (result.success) {
        setTasks(result.tasks);
        console.log(`📋 Loaded ${result.tasks.length} tasks for user segments:`, result.userSegments);
      } else {
        console.warn('Tasks API not available, using mock data');
        loadMockTasks(userData);
      }
    } catch (error) {
      console.warn('Tasks API not available, using mock data');
      loadMockTasks(userData);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadMockTasks = (userData: any) => {
    // Simplified tasks with all available tasks
    const mockTasks = [
      {
        id: 1,
        task_number: 1,
        title: 'Secure residence permit / visa',
        category: 'legal',
        initial_question: 'Do you already have a residence permit or visa?',
        ui_config: {
          components: [
            {
              type: 'question_multiple',
              question: 'Do you already have a residence permit or visa?',
              options: [
                { value: 'yes', label: 'Yes, I have it', description: 'I already have my residence permit' },
                { value: 'no', label: 'No, I need to apply', description: 'I need to start the application process' }
              ]
            }
          ]
        }
      },
      {
        id: 2,
        task_number: 2,
        title: 'Find housing',
        category: 'housing',
        initial_question: 'Do you already have housing arranged?'
      },
      {
        id: 3,
        task_number: 3,
        title: 'Register at your Gemeinde (municipality)',
        category: 'legal',
        initial_question: 'Have you already registered at your Gemeinde?',
        ui_config: {
          components: [
            {
              type: 'question_multiple',
              question: 'Have you already registered at your Gemeinde?',
              options: [
                { value: 'yes', label: 'Yes, I am registered', description: 'I have completed the registration' },
                { value: 'no', label: 'No, I need to register', description: 'I need to start the registration process' }
              ]
            }
          ]
        }
      },
      {
        id: 4,
        task_number: 4,
        title: 'Register for School/Kindergarten',
        category: 'family',
        hasSpecialFlow: true
      },
      {
        id: 5,
        task_number: 5,
        title: 'Open bank account',
        category: 'banking'
      },
      {
        id: 6,
        task_number: 6,
        title: 'Get health insurance',
        category: 'health'
      },
      {
        id: 7,
        task_number: 7,
        title: 'Register for taxes',
        category: 'legal'
      },
      {
        id: 8,
        task_number: 8,
        title: 'Set up internet and utilities',
        category: 'housing'
      },
      {
        id: 9,
        task_number: 9,
        title: 'Get a Swiss phone number',
        category: 'communication'
      },
      {
        id: 10,
        task_number: 10,
        title: 'Register for public transport',
        category: 'transport'
      },
      {
        id: 11,
        task_number: 11,
        title: 'Find a local doctor/GP',
        category: 'health'
      },
      {
        id: 12,
        task_number: 12,
        title: 'Learn about Swiss customs and culture',
        category: 'culture'
      },
      {
        id: 13,
        task_number: 13,
        title: 'Set up waste disposal and recycling',
        category: 'housing'
      },
      {
        id: 14,
        task_number: 14,
        title: 'Join local community groups',
        category: 'social'
      },
      {
        id: 15,
        task_number: 15,
        title: 'Register for language courses',
        category: 'education'
      },
      {
        id: 16,
        task_number: 16,
        title: 'Understand Swiss voting system',
        category: 'civic'
      },
      {
        id: 17,
        task_number: 17,
        title: 'Find employment or transfer job',
        category: 'employment'
      },
      {
        id: 18,
        task_number: 18,
        title: 'Plan integration and long-term goals',
        category: 'planning'
      }
    ];

    // Initialize progress from localStorage
    const savedProgress = localStorage.getItem('taskProgress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setTaskProgress(progress);
    }

    setTasks(mockTasks);
    console.log('📋 Loaded enhanced mock tasks with progress:', mockTasks);
  };

  const handleTaskClick = (task: any) => {
    if (task.task_number === 4 || task.hasSpecialFlow) {
      // Navigate to special Task 4 flow in new window
      window.open('/tasks/4', '_blank');
    } else {
      // For other tasks, navigate to task page in new window
      window.open(`/tasks/${task.task_number}`, '_blank');
    }
  };


  const updateTaskProgress = (taskNumber: number, progress: number) => {
    const newProgress = { ...taskProgress, [taskNumber]: progress };
    setTaskProgress(newProgress);
    localStorage.setItem('taskProgress', JSON.stringify(newProgress));
    
    // Force re-render to update progress bar
    setTasks(prevTasks => [...prevTasks]);
  };

  const renderTaskComponent = (component: any, taskId: number) => {
    switch (component.type) {
      case 'question_multiple':
        return (
          <div key={`${taskId}-${component.type}`} className="mb-6">
            <p className="font-medium mb-3 text-gray-900">{component.question}</p>
            <div className="space-y-2">
              {component.options?.map((option: any, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    // Update progress based on answer
                    if (option.value === 'yes') {
                      updateTaskProgress(taskId, 100);
                    } else {
                      updateTaskProgress(taskId, 25);
                    }
                  }}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleUpdateProfile = () => {
    setShowUpdateModal(true);
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('village_current_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setShowUpdateModal(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log('File selected:', file.name);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  const profileCompleteness = calculateProfileCompleteness(user);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Village Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/vault')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Document Vault
              </button>
              <button
                onClick={() => {
                  setProfileFormData({
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: user.address || user.current_address || '',
                    country_of_origin: user.country_of_origin || '',
                    target_canton: user.target_canton || '',
                    target_municipality: user.target_municipality || '',
                    target_postal_code: user.target_postal_code || '',
                    gender: user.gender || '',
                    role_in_family: user.role_in_family || ''
                  });
                  setShowProfileModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
              <span className="text-sm text-gray-700">Welcome, {user.first_name}!</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to Switzerland, {user.first_name}!
                </h2>
                <p className="text-gray-600">
                  Track your relocation progress and complete important tasks
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Profile completeness</div>
                <div className="text-2xl font-bold text-blue-600">{profileCompleteness}%</div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Your Tasks</h3>
              {/* Overall Progress */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {tasks.filter(t => taskProgress[t.task_number] === 100).length} of {tasks.length} completed
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${tasks.length > 0 ? (tasks.filter(t => taskProgress[t.task_number] === 100).length / tasks.length) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tasks Grid - Card View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingTasks ? (
                <div className="col-span-full text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading tasks...</p>
                </div>
              ) : tasks.length > 0 ? (
                tasks.map((task) => {
                  const progress = taskProgress[task.task_number] || 0;
                  const isCompleted = progress === 100;

                  return (
                    <div
                      key={task.id}
                      className={`bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${
                        isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleTaskClick(task)}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                            {task.category}
                          </span>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        )}
                      </div>

                      {/* Title */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 text-lg leading-tight">
                          {task.title}
                        </h4>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">No tasks available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={profileFormData.first_name || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={profileFormData.last_name || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={profileFormData.email || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileFormData.phone || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={profileFormData.address || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>

                {/* Origin Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Origin Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country of Origin *
                      </label>
                      <select
                        value={profileFormData.country_of_origin || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, country_of_origin: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select your country</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IT">Italy</option>
                        <option value="AT">Austria</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="ES">Spain</option>
                        <option value="NL">Netherlands</option>
                        <option value="BE">Belgium</option>
                        <option value="PT">Portugal</option>
                        <option value="PL">Poland</option>
                        <option value="SE">Sweden</option>
                        <option value="NO">Norway</option>
                        <option value="DK">Denmark</option>
                        <option value="FI">Finland</option>
                        <option value="other">Other</option>
                      </select>
                      <EUStatusIndicator 
                        countryCode={profileFormData.country_of_origin || ''} 
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Location */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Target Location in Switzerland</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code & City
                      </label>
                      <SwissPlaceAutocomplete
                        value={`${profileFormData.target_postal_code || ''} ${profileFormData.target_municipality || ''}`.trim()}
                        onSelect={(place) => {
                          setProfileFormData({
                            ...profileFormData,
                            target_postal_code: place.postalCode,
                            target_municipality: place.name,
                            target_canton: place.canton
                          });
                        }}
                        placeholder="PLZ oder Ort eingeben..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Canton: {profileFormData.target_canton || 'Not selected'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Information for Autofill */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information (for Document Autofill)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={profileFormData.gender || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role in Family
                      </label>
                      <select
                        value={profileFormData.role_in_family || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, role_in_family: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select role</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                        <option value="single">Single Person</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Children Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Children</h3>
                    <button
                      type="button"
                      onClick={() => setChildren([...children, {
                        id: Date.now(),
                        first_name: '',
                        last_name: '',
                        date_of_birth: '',
                        gender: '',
                        nationality: profileFormData.country_of_origin || ''
                      }])}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Add Child
                    </button>
                  </div>

                  {children.length === 0 ? (
                    <p className="text-gray-500 text-sm">No children added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {children.map((child, index) => (
                        <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-900">Child {index + 1}</h4>
                            <button
                              onClick={() => setChildren(children.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={child.first_name}
                                onChange={(e) => {
                                  const updatedChildren = [...children];
                                  updatedChildren[index].first_name = e.target.value;
                                  setChildren(updatedChildren);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Child's first name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={child.last_name}
                                onChange={(e) => {
                                  const updatedChildren = [...children];
                                  updatedChildren[index].last_name = e.target.value;
                                  setChildren(updatedChildren);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Child's last name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Birth
                              </label>
                              <input
                                type="date"
                                value={child.date_of_birth}
                                onChange={(e) => {
                                  const updatedChildren = [...children];
                                  updatedChildren[index].date_of_birth = e.target.value;
                                  setChildren(updatedChildren);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gender
                              </label>
                              <select
                                value={child.gender}
                                onChange={(e) => {
                                  const updatedChildren = [...children];
                                  updatedChildren[index].gender = e.target.value;
                                  setChildren(updatedChildren);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save profile data
                      const updatedUser = { ...user, ...profileFormData, children };
                      localStorage.setItem('village_current_user', JSON.stringify(updatedUser));
                      setUser(updatedUser);
                      setShowProfileModal(false);

                      // Trigger children update event for Task 4
                      window.dispatchEvent(new CustomEvent('childrenUpdated'));
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}