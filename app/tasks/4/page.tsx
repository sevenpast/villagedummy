'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, GraduationCap, FileText, CheckSquare, Upload, Loader2, Download } from 'lucide-react';
import IntelligentPDFProcessor from '../../../components/IntelligentPDFProcessor';

// All data now comes from real database - no mock data

interface FormField {
  name: string;
  label: string;
  key: string;
  value: string | boolean | string[];
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'question';
  isPrefilled: boolean;
  group: string;
  groupType?: 'single' | 'multiple' | 'text' | 'checkbox_text' | 'checkbox_text_multiple' | 'table';
  options?: { name: string; originalName: string; label: string }[];
  originalName?: string;
}

export default function Task4Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState(2);
  const [municipalityWebsite, setMunicipalityWebsite] = useState<string | null>(null);
  const [isLoadingWebsite, setIsLoadingWebsite] = useState(false);

  // PDF workflow states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Load real children data from API
  const loadUserWithChildren = async () => {
    try {
      const currentUser = localStorage.getItem('village_current_user');
      if (!currentUser) {
        router.push('/signin');
        return;
      }

      const userData = JSON.parse(currentUser);
      const childrenResponse = await fetch('/api/children');
      const childrenData = await childrenResponse.json();

      const enhancedUser = {
        ...userData,
        // Add real children data from database
        children: childrenData.success ? childrenData.children : [],
        // Ensure we have address and phone from profile
        address: userData.address || userData.current_address || '',
        phone: userData.phone || ''
      };

      console.log('TASK4: Loaded real user data with children:', enhancedUser);
      setUser(enhancedUser);
    } catch (error) {
      console.error('Error loading user with children:', error);
      router.push('/signin');
    }
  };

  useEffect(() => {
    loadUserWithChildren();

    // Listen for children data updates
    const handleChildrenUpdate = () => {
      console.log('TASK4: Children updated event received - reloading user data');
      loadUserWithChildren();
    };

    window.addEventListener('childrenUpdated', handleChildrenUpdate);

    return () => {
      window.removeEventListener('childrenUpdated', handleChildrenUpdate);
    };
  }, [router]);


  const handleMarkCompleted = () => {
    setTaskStatus('completed');
    
    // Update progress in parent window (dashboard)
    if (window.opener) {
      window.opener.postMessage({
        type: 'TASK_COMPLETED',
        taskNumber: 4,
        progress: 100
      }, '*');
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowDetails(true);
    
    if (answer === 'yes') {
      setTaskStatus('completed');
      // Update progress in parent window (dashboard)
      if (window.opener) {
        window.opener.postMessage({
          type: 'TASK_COMPLETED',
          taskNumber: 4,
          progress: 100
        }, '*');
      }
    } else {
      setTaskStatus('in_progress');
      // Update partial progress
      if (window.opener) {
        window.opener.postMessage({
          type: 'TASK_PROGRESS',
          taskNumber: 4,
          progress: 25
        }, '*');
      }
    }
  };

  const setReminder = () => {
    setShowReminder(false);
    setTaskStatus('in_progress');
    // Update progress in parent window (dashboard)
    if (window.opener) {
      window.opener.postMessage({
        type: 'TASK_PROGRESS',
        taskNumber: 4,
        progress: 50
      }, '*');
    }
  };

  // Check if user has children
  const hasChildren = user?.children && user.children.length > 0;
  const hasChildrenAges4to15 = hasChildren && user.children.some((child: any) => {
    const age = child.age || 0;
    return age >= 4 && age <= 15;
  });

  // Function to find municipality school registration website using Gemini
  const findMunicipalityWebsite = async () => {
    if (!user?.target_municipality || !user?.target_canton) {
      alert('Please complete your profile with municipality and canton information first.');
      return;
    }

    setIsLoadingWebsite(true);
    try {
      const response = await fetch('/api/gemini/find-school-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          municipality: user.target_municipality,
          canton: user.target_canton,
          postalCode: user.target_postal_code
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.website) {
          setMunicipalityWebsite(data.website);
        } else {
          alert('Could not find school registration website. Please contact your municipality directly.');
        }
      } else {
        alert('Error finding school website. Please try again.');
      }
    } catch (error) {
      console.error('Error finding municipality website:', error);
      alert('Error finding school website. Please try again.');
    } finally {
      setIsLoadingWebsite(false);
    }
  };

  // PDF workflow functions
  const resetState = () => {
    setFormFields([]);
    setError(null);
    setSuccess(null);
    setCurrentStep(1);
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      resetState();
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));

      // Automatically analyze the PDF after upload
      await handleAnalyze(file);
    } else {
      setError("Bitte wählen Sie eine gültige PDF-Datei.");
      setPdfFile(null);
      setPdfUrl(null);
    }
  };

  const handleAnalyze = async (fileToAnalyze?: File) => {
    const file = fileToAnalyze || pdfFile;
    if (!file) {
      setError("Bitte laden Sie zuerst eine PDF hoch.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the new smart field extraction API
      const response = await fetch('/api/pdf/smart-extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setFormFields(result.data.formFields);
        setCurrentStep(2);
        setSuccess(`Successfully extracted ${result.data.formFields.length} form fields!`);
      } else {
        setError(result.error || "Analysis failed.");
      }
    } catch (err) {
      setError("An error occurred during analysis.");
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (index: number, field: 'value' | 'label', newValue: any) => {
    setFormFields(prev => prev.map((f, i) =>
      i === index ? { ...f, [field]: newValue } : f
    ));
  };

  const handleDownloadPDF = async () => {
    if (!pdfFile || !formFields.length) return;

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const originalPdfBase64 = (reader.result as string).split(',')[1];

        const response = await fetch('/api/fill-original-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalPdfBase64,
            formFields: formFields.map(field => ({
              name: field.name,
              label: field.label,
              key: field.key,
              value: field.value,
              type: field.type,
              isPrefilled: field.isPrefilled,
              options: field.options,
              groupType: field.groupType
            }))
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'filled-school-form.pdf';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setSuccess('PDF successfully filled and downloaded!');
        } else {
          setError('Failed to fill PDF');
        }
      };
      reader.readAsDataURL(pdfFile);
    } catch (err) {
      setError('An error occurred while downloading the PDF');
      console.error('Download error:', err);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Task 4: Register for School/Kindergarten
              </h1>
            </div>
            <div className="flex items-center">
              {taskStatus === 'completed' && (
                <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
              )}
              <span className="text-sm text-gray-700">
                Welcome, {user.first_name}!
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 text-sm">Family</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-7 h-7" />
                  Register for School/Kindergarten
                </h2>
                <p className="text-gray-600 mt-1">
                  Get your children registered for school
                </p>
              </div>
            </div>



            {/* Main Content */}
            {taskStatus === 'not_started' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Register your kids for school right after arrival.
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 mb-6">
                    <p>• Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.</p>
                    <p>• School attendance is compulsory from age 4–6 (varies slightly by canton).</p>
                    <p>• Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).</p>
                    <p>• Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).</p>
                    <p>• You may also apply to private or international schools, but these require direct application and tuition fees.</p>
                  </div>
                  
                  {hasChildrenAges4to15 ? (
                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                      <p className="text-gray-700">
                        This task is shown to you because your profile states that you have children between the ages of 4 and 15. If that is incorrect, you can change your information here: <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:underline">change profile</button>.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                      <p className="text-gray-700">
                        You are seeing this task, because we don't know whether you have children. For a more tailored experience, please complete your profile.
                      </p>
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Have you already registered your child(ren) for school yet?
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAnswerSelect('yes')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Yes, I'm registered</div>
                    </button>
                    
                    <button
                      onClick={() => handleAnswerSelect('no')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Not yet</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Details based on answer */}
            {showDetails && selectedAnswer === 'yes' && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Excellent!</h3>
                </div>
              </div>
            )}

            {/* No answer section */}
            {showDetails && selectedAnswer === 'no' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    School Registration Checklist
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">What you need for registration:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Child's birth certificate</li>
                        <li>Child's passport/ID</li>
                        <li>Proof of residence (rental contract, etc.)</li>
                        <li>Vaccination records</li>
                        <li>Previous school records (if applicable)</li>
                        <li>Passport photos of the child</li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">
                        <strong>Don't delay! School registration is mandatory immediately after arrival.</strong>
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Find your school registration website:</h4>
                      <p className="text-sm text-gray-600">
                        We'll automatically find the school administration website for your municipality.
                      </p>
                      
                      {!municipalityWebsite ? (
                        <button
                          onClick={findMunicipalityWebsite}
                          disabled={isLoadingWebsite}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition font-medium"
                        >
                          {isLoadingWebsite ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Finding Website...
                            </>
                          ) : (
                            'Find School Registration Website'
                          )}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-green-600">
                            ✅ Found school registration website for {user?.target_municipality}:
                          </p>
                          <a
                            href={municipalityWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                          >
                            Open School Website
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Upload school forms:</h4>
                      <button
                        onClick={() => setShowUpload(true)}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                      >
                        Upload PDF Form
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Reminder Setup */}
                {showReminder && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Reminder: We will remind you every {reminderDays} days to ensure you don't miss your deadline.
                      </h3>
                      
                      <div className="bg-white rounded border p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                          We'll remind you to complete school registration {reminderDays} days from now.
                        </p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <label className="text-sm text-gray-700">Remind me every:</label>
                          <input
                            type="number"
                            min="1"
                            max="14"
                            value={reminderDays}
                            onChange={(e) => setReminderDays(parseInt(e.target.value) || 2)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-700">days</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={setReminder}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                        >
                          Set Reminder
                        </button>
                        <button
                          onClick={() => {
                            setShowReminder(false);
                            setTaskStatus('in_progress');
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                        >
                          No Reminder
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {!showReminder && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowReminder(true)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Set Reminder
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Smart PDF Form Overlay Section */}
            {showUpload && taskStatus !== 'completed' && (
              <div className="space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="text-lg font-semibold text-gray-900">
               Upload PDF Form
             </h3>
             <button
               onClick={() => setShowUpload(false)}
               className="text-gray-600 hover:text-gray-800"
             >
               Cancel
             </button>
           </div>

                {/* Intelligent PDF Processor */}
                <IntelligentPDFProcessor 
                  userData={user}
                  onFilledPDF={(pdfBlob) => {
                    console.log('PDF filled successfully:', pdfBlob);
                  }}
                  onComplete={() => {
                    setShowUpload(false);
                    handleMarkCompleted();
                  }}
                />

              </div>
            )}

            {/* Completed State */}
            {taskStatus === 'completed' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  School Registration Completed!
                </h3>
                <p className="text-gray-700">
                  Great job! Your child should be all set for school. Don't forget to submit the filled form to the school.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}