'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  // Calculate actual profile completeness
  const calculateProfileCompleteness = (userData: any) => {
    const requiredFields = {
      basic_info: ['first_name', 'last_name', 'email'],
      country_info: ['country_of_origin', 'is_eu_efta_citizen'],
      location_info: ['target_canton', 'target_municipality', 'target_postal_code'],
      family_info: [] // We'll check if children exist
    };

    let completedSections = 0;
    let totalSections = 4;

    // Check basic info
    const basicComplete = requiredFields.basic_info.every(field =>
      userData[field] && userData[field].toString().trim() !== ''
    );

    // Check country info
    const countryComplete = requiredFields.country_info.every(field =>
      userData[field] !== undefined && userData[field] !== null && userData[field].toString().trim() !== ''
    );

    // Check location info
    const locationComplete = requiredFields.location_info.every(field =>
      userData[field] && userData[field].toString().trim() !== ''
    );

    // Check family info (if children exist in database)
    const familyComplete = userData.children && userData.children.length > 0;

    if (basicComplete) completedSections++;
    if (countryComplete) completedSections++;
    if (locationComplete) completedSections++;
    if (familyComplete) completedSections++;

    const percentage = Math.round((completedSections / totalSections) * 100);

    return {
      completeness_percentage: percentage,
      basic_info: basicComplete,
      country_info: countryComplete,
      location_info: locationComplete,
      family_info: familyComplete
    };
  };

  useEffect(() => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('village_current_user');
    if (!currentUser) {
      // Redirect to signin if not logged in
      router.push('/signin');
      return;
    }

    try {
      const userData = JSON.parse(currentUser);

      // Calculate real profile completeness
      const profileCompleteness = calculateProfileCompleteness(userData);
      const enhancedUser = {
        ...userData,
        profile_completeness: profileCompleteness
      };

      setUser(enhancedUser);
      setFormData(enhancedUser);
      
      // Load user documents and tasks
      loadUserDocuments(enhancedUser.id);
      loadTasks(enhancedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/signin');
    }
  }, [router]);

  const loadUserDocuments = async (userId: number) => {
    try {
      const response = await fetch(`/api/documents/load?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        const documents = result.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.original_name,
          type: doc.document_type,
          tags: doc.tags,
          uploadedAt: doc.uploaded_at,
          confidence: doc.confidence,
          description: doc.description
        }));
        
        setVaultDocuments(documents);
        console.log(`📁 Loaded ${documents.length} documents from database`);
      } else {
        console.warn('Documents API not available, using mock data');
        // Set empty documents array as fallback
        setVaultDocuments([]);
      }
    } catch (error) {
      console.warn('Documents API not available, using mock data');
      // Set empty documents array as fallback
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
        // Fallback to mock data if API fails
        loadMockTasks(userData);
      }
    } catch (error) {
      console.warn('Tasks API not available, using mock data');
      // Fallback to mock data if API fails
      loadMockTasks(userData);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadMockTasks = (userData: any) => {
    // Mock tasks that match our database structure
    const mockTasks = [
      {
        id: 1,
        task_number: 1,
        title: 'Secure residence permit / visa',
        category: 'legal',
        is_urgent: false,
        priority: 100,
        icon_name: 'passport',
        variants: [
          {
            id: 'task1-eu',
            target_audience: ['EU/EFTA'],
            intro: 'Get your residence permit to work legally in Switzerland',
            info_box: 'As an EU/EFTA citizen, you have the right to live and work in Switzerland, but you still need to register and get a residence permit.\n\n**What you need:**\n- Valid passport or ID card\n- Employment contract or job offer\n- Proof of health insurance\n- Proof of accommodation\n\n**Timeline:** Apply within 14 days of arrival\n**Cost:** Usually free for EU/EFTA citizens\n**Validity:** 5 years (can be renewed)',
            ui_config: {
              components: [
                {
                  type: 'question_multiple',
                  question: 'Do you already have a residence permit or visa?',
                  options: [
                    { value: 'yes', label: 'Yes, I have it', description: 'I already have my residence permit' },
                    { value: 'no', label: 'No, I need to apply', description: 'I need to start the application process' },
                    { value: 'not_sure', label: "I'm not sure", description: 'Help me figure out what I need' }
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        id: 2,
        task_number: 2,
        title: 'Find housing',
        category: 'housing',
        is_urgent: false,
        priority: 90,
        icon_name: 'home',
        variants: [
          {
            id: 'task2-all',
            target_audience: ['all'],
            intro: 'Find your new home in Switzerland',
            info_box: 'Finding housing in Switzerland can be challenging, especially in popular areas like Zurich, Geneva, and Basel.\n\n**Key Facts:**\n- Rental market is competitive\n- You\'ll need 3 months rent as deposit\n- Most apartments are unfurnished\n- Contracts are usually for 1 year minimum\n- Landlords often require employment contract and references\n\n**Timeline:** Start looking immediately, can take 1-3 months\n**Cost:** 3 months rent as deposit + first month rent',
            ui_config: {
              components: [
                {
                  type: 'question_multiple',
                  question: 'Do you already have housing arranged?',
                  options: [
                    { value: 'yes', label: 'Yes, I have a place', description: 'I have permanent housing arranged' },
                    { value: 'no', label: 'No, I need to find housing', description: 'I need to start looking for housing' },
                    { value: 'temporary', label: 'I have temporary housing', description: 'I have short-term housing but need permanent' }
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        id: 3,
        task_number: 3,
        title: 'Register at your Gemeinde (municipality)',
        category: 'legal',
        is_urgent: true,
        priority: 95,
        icon_name: 'building',
        variants: [
          {
            id: 'task3-all',
            target_audience: ['all'],
            intro: 'Register at your local municipality - MANDATORY within 14 days',
            info_box: '⚠️ **URGENT:** You MUST register at your local Gemeinde (municipality) within 14 days of arrival in Switzerland.\n\n**What happens at registration:**\n- You get your residence permit card\n- You\'re officially registered as a resident\n- You can open bank accounts, get health insurance, etc.\n- You\'re assigned to your local tax office\n\n**Required Documents:**\n- Passport/ID\n- Employment contract\n- Rental contract or proof of accommodation\n- Health insurance certificate\n- Passport photos\n\n**Cost:** Usually CHF 0-50\n**Processing time:** 2-4 weeks for permit card',
            ui_config: {
              components: [
                {
                  type: 'question_multiple',
                  question: 'Have you already registered at your Gemeinde?',
                  options: [
                    { value: 'yes', label: 'Yes, I\'m registered', description: 'I have completed the registration' },
                    { value: 'no', label: 'No, I need to register', description: 'I need to start the registration process' },
                    { value: 'not_sure', label: "I'm not sure", description: 'Help me figure out if I need to register' }
                  ]
                }
              ]
            }
          }
        ]
      }
    ];

    // Filter tasks based on user profile
    const userSegments = [];
    if (userData.country_of_origin && ['DE', 'FR', 'IT', 'AT', 'ES', 'NL', 'BE', 'NO', 'IS', 'LI'].includes(userData.country_of_origin)) {
      userSegments.push('EU/EFTA');
    } else if (userData.country_of_origin) {
      userSegments.push('Non-EU/EFTA');
    }
    if (userData.has_kids) {
      userSegments.push('with_kids');
    }
    userSegments.push('all');

    const filteredTasks = mockTasks.map(task => ({
      ...task,
      variants: task.variants.filter(variant => 
        variant.target_audience.some(audience => userSegments.includes(audience))
      )
    })).filter(task => task.variants.length > 0);

    setTasks(filteredTasks);
    console.log(`📋 Loaded ${filteredTasks.length} mock tasks for user segments:`, userSegments);
  };

  const downloadDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/download?documentId=${documentId}&userId=${user.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `document_${documentId}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error downloading document');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading document');
    }
  };


  const handleSignOut = () => {
    localStorage.removeItem('village_current_user');
    router.push('/signin');
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
      
      case 'question_yesno':
        return (
          <div key={`${taskId}-${component.type}`} className="mb-6">
            <p className="font-medium mb-3 text-gray-900">{component.question}</p>
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Yes
              </button>
              <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                No
              </button>
            </div>
          </div>
        );
      
      case 'form':
        return (
          <div key={`${taskId}-${component.type}`} className="mb-6">
            <h4 className="font-medium mb-3 text-gray-900">{component.title}</h4>
            <div className="space-y-4">
              {component.fields?.map((field: any, index: number) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.type === 'select' ? (
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option: string, optIndex: number) => (
                        <option key={optIndex} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                {component.submitText || 'Submit'}
              </button>
            </div>
          </div>
        );
      
      case 'checklist':
        return (
          <div key={`${taskId}-${component.type}`} className="mb-6">
            <h4 className="font-medium mb-3 text-gray-900">{component.title}</h4>
            <div className="space-y-2">
              {component.items?.map((item: string, index: number) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{item}</label>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'comparison_table':
        return (
          <div key={`${taskId}-${component.type}`} className="mb-6">
            <h4 className="font-medium mb-3 text-gray-900">{component.title}</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    {component.headers?.map((header: string, index: number) => (
                      <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {component.rows?.map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex} className="border-b">
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div key={`${taskId}-${component.type}`} className={`mb-4 p-4 rounded-lg ${
            component.style === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            component.style === 'info' ? 'bg-blue-50 border border-blue-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="text-sm text-gray-800 whitespace-pre-line">
              {component.content}
            </div>
          </div>
        );
      
      case 'external_link':
        return (
          <div key={`${taskId}-${component.type}`} className="mb-4">
            <a
              href={component.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {component.text}
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        );
      
      case 'ai_generate':
        return (
          <div key={`${taskId}-${component.type}`} className="mb-4">
            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {component.buttonText}
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleVaultFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Step 1: Analyze document with AI
      const formData = new FormData();
      formData.append('file', file);

      const analyzeResponse = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: formData,
      });

      const analyzeResult = await analyzeResponse.json();

      if (!analyzeResult.success) {
        alert('Error analyzing document: ' + analyzeResult.error);
        return;
      }

      // Step 2: Save document to database
      const saveResponse = await fetch('/api/documents/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          fileName: `doc_${Date.now()}_${file.name}`,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: analyzeResult.fileData,
          documentType: analyzeResult.documentType,
          tags: analyzeResult.tags,
          confidence: analyzeResult.confidence,
          description: analyzeResult.description
        }),
      });

      const saveResult = await saveResponse.json();

      if (saveResult.success) {
        // Step 3: Add to local state
        const newDocument = {
          id: saveResult.documentId,
          name: file.name,
          type: analyzeResult.documentType,
          tags: analyzeResult.tags,
          uploadedAt: new Date().toISOString(),
          confidence: analyzeResult.confidence,
          description: analyzeResult.description
        };
        
        setVaultDocuments(prev => [...prev, newDocument]);
        setSelectedFile(null);
        alert('Document uploaded and saved successfully!');
      } else {
        alert('Error saving document: ' + saveResult.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading document');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Loading...
          </h1>
          <p className="text-gray-600">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Village Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.first_name}!
              </span>
              <button
                onClick={handleUpdateProfile}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Profile
              </button>
              <button
                onClick={() => setShowVaultModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Vault
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Welcome Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to your Dashboard!
                </h2>
                <p className="text-gray-600 mb-6">
                  You have successfully signed in to Village. Here's your personalized overview.
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Location Details
                  </h3>
                  <div className="text-sm text-gray-800 space-y-1">
                    <p><strong>Target Canton:</strong> {user.target_canton}</p>
                    <p><strong>Target Municipality:</strong> {user.target_municipality}</p>
                    <p><strong>Postal Code:</strong> {user.target_postal_code}</p>
                    {user.country_of_origin && (
                      <p><strong>EU/EFTA Citizen:</strong> {user.is_eu_efta_citizen ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Completeness */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Profile Completeness
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Overall Progress</span>
                      <span>{user.profile_completeness?.completeness_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${user.profile_completeness?.completeness_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${user.profile_completeness?.basic_info ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span>Basic Information</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${user.profile_completeness?.country_info ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span>Country Information</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${user.profile_completeness?.family_info ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span>Family Information</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${user.profile_completeness?.location_info ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span>Location Information</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Tasks Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Tasks</h2>
            
            {loadingTasks ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading your personalized tasks...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tasks.map((task) => {
                  const variant = task.variants[0]; // Use first matching variant
                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-lg shadow-md border-l-4 ${
                        task.is_urgent ? 'border-red-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              Task {task.task_number}: {task.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.category === 'legal' ? 'bg-red-100 text-red-800' :
                                task.category === 'housing' ? 'bg-green-100 text-green-800' :
                                task.category === 'health' ? 'bg-blue-100 text-blue-800' :
                                task.category === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.category}
                              </span>
                              {task.is_urgent && (
                                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                  URGENT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-700 mb-3">{variant.intro}</p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">📋 Important Information</h4>
                            <div className="text-sm text-blue-800 whitespace-pre-line">
                              {variant.info_box}
                            </div>
                          </div>
                        </div>

                        {/* Render UI Components */}
                        {variant.ui_config?.components && (
                          <div className="mt-6">
                            {variant.ui_config.components.map((component: any, index: number) =>
                              renderTaskComponent(component, task.id)
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tasks available for your profile yet.</p>
                    <p className="text-sm mt-2">Complete your profile to see personalized tasks.</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Update Profile</h2>

            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name || formData.first_name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>

              {/* Critical Profile Information Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Critical Profile Information</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This information is essential for the app to show you the right tasks and guidance.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Origin
                  </label>
                  <select
                    value={formData.country_of_origin || ''}
                    onChange={(e) => handleInputChange('country_of_origin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                </div>
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasChildren"
                      checked={formData.has_kids || formData.hasChildren || false}
                      onChange={(e) => handleInputChange('has_kids', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasChildren" className="ml-2 block text-sm font-medium text-gray-700">
                      I have children
                    </label>
                  </div>
                  
                  {/* Children count input - only show when hasChildren is true */}
                  {(formData.has_kids || formData.hasChildren) && (
                    <div className="mt-3 ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of children
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.num_children || formData.childrenCount || ''}
                        onChange={(e) => handleInputChange('num_children', e.target.value)}
                        placeholder="e.g. 2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Target Location Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Target Location in Switzerland</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This helps us provide location-specific guidance and requirements.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Canton
                    </label>
                    <select
                      value={formData.target_canton || ''}
                      onChange={(e) => handleInputChange('target_canton', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code || formData.target_postal_code || ''}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="Enter postal code..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipality/City
                  </label>
                  <input
                    type="text"
                    value={formData.target_municipality || formData.municipality || ''}
                    onChange={(e) => handleInputChange('target_municipality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter municipality/city"
                  />
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="eu_efta"
                      checked={formData.is_eu_efta_citizen || false}
                      onChange={(e) => handleInputChange('is_eu_efta_citizen', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="eu_efta" className="ml-2 block text-sm font-medium text-gray-700">
                      EU/EFTA Citizen
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Document
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {selectedFile && (
                      <p className="text-sm text-green-600 mt-1">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault Modal */}
      {showVaultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Document Vault</h2>
            <p className="text-sm text-gray-600 mb-6">
              Upload documents and let AI automatically identify and tag them for easy organization.
            </p>

            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="vault-file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload documents for AI analysis
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PDF, JPG, PNG files supported
                    </span>
                    <input
                      id="vault-file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleVaultFileUpload}
                      disabled={isUploading}
                    />
                    <span className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                      {isUploading ? 'Analyzing...' : 'Choose Files'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Your Documents</h3>
              {vaultDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vaultDocuments.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {doc.type}
                            </span>
                          </div>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {doc.tags.map((tag: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadDocument(doc.id)}
                            className="text-gray-400 hover:text-blue-600"
                            title="Download document"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setVaultDocuments(prev => prev.filter(d => d.id !== doc.id))}
                            className="text-gray-400 hover:text-red-600"
                            title="Remove document"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVaultModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
