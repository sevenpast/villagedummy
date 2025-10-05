'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, FileText, ArrowLeft } from 'lucide-react';

export default function Task1Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userStatus, setUserStatus] = useState<'no_country' | 'eu_efta' | 'visa_exempt' | 'visa_required' | 'loading'>('loading');
  const [showVisaQuestion, setShowVisaQuestion] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState(7);

  useEffect(() => {
    const currentUser = localStorage.getItem('village_current_user');
    if (!currentUser) {
      router.push('/signin');
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      setUser(userData);
      determineUserStatus(userData.country_of_origin);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/signin');
    }
  }, [router]);

  const determineUserStatus = async (countryCode: string) => {
    if (!countryCode) {
      setUserStatus('no_country');
      return;
    }

    try {
      const response = await fetch(`/api/eu-countries?code=${countryCode}`);
      if (response.ok) {
        const countryInfo = await response.json();
        if (countryInfo.isEUOrEFTA) {
          setUserStatus('eu_efta');
        } else {
          // For now, we'll treat all non-EU/EFTA as visa-required
          // In a real implementation, you'd have a separate API for visa-exempt countries
          setUserStatus('visa_required');
        }
      } else {
        setUserStatus('visa_required');
      }
    } catch (error) {
      console.error('Error determining user status:', error);
      setUserStatus('visa_required');
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
          taskNumber: 1,
          progress: 100
        }, '*');
      }
    } else {
      setTaskStatus('in_progress');
      // Update partial progress
      if (window.opener) {
        window.opener.postMessage({
          type: 'TASK_PROGRESS',
          taskNumber: 1,
          progress: 25
        }, '*');
      }
    }
  };

  const handleMarkCompleted = () => {
    setTaskStatus('completed');
    
    // Update progress in parent window (dashboard)
    if (window.opener) {
      window.opener.postMessage({
        type: 'TASK_COMPLETED',
        taskNumber: 1,
        progress: 100
      }, '*');
    }
  };

  const handleVisaAnswer = (answer: string) => {
    if (answer === 'yes') {
      setTaskStatus('completed');
      if (window.opener) {
        window.opener.postMessage({
          type: 'TASK_COMPLETED',
          taskNumber: 1,
          progress: 100
        }, '*');
      }
    } else {
      setShowReminder(true);
    }
  };

  const setReminder = () => {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + reminderDays);
    
    // Store reminder in localStorage
    const reminder = {
      taskId: 1,
      date: reminderDate.toISOString(),
      message: userStatus === 'no_country' 
        ? 'Update your profile with your country of origin'
        : 'Check the status of your permit application',
      userEmail: user?.email
    };
    
    const existingReminders = JSON.parse(localStorage.getItem('task_reminders') || '[]');
    existingReminders.push(reminder);
    localStorage.setItem('task_reminders', JSON.stringify(existingReminders));
    
    setShowReminder(false);
    setTaskStatus('in_progress');
    
    if (window.opener) {
      window.opener.postMessage({
        type: 'TASK_PROGRESS',
        taskNumber: 1,
        progress: 50
      }, '*');
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
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Task 1: Secure residence permit / visa
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
                  <span className="text-gray-500 text-sm">Legal</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-7 h-7" />
                  Secure residence permit / visa
                </h2>
                <p className="text-gray-600 mt-1">
                  Get your residence permit to work legally in Switzerland
                </p>
              </div>
            </div>

            {/* Main Content based on User Status */}
            {taskStatus === 'not_started' && userStatus === 'loading' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your information...</p>
              </div>
            )}

            {taskStatus === 'not_started' && userStatus === 'no_country' && !showVisaQuestion && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Make sure your legal right to stay in Switzerland is secured
                  </h3>
                  
                  <div className="border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-gray-700">
                      You haven't shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.
                    </p>
                    <p className="text-gray-700 mt-2">
                      Would you like to complete your profile, so you get the most out of your experience on Village?
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Complete Profile
                    </button>
                    <button
                      onClick={() => setShowVisaQuestion(true)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Continue Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Visa Question for no_country users */}
            {showVisaQuestion && userStatus === 'no_country' && !showReminder && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Do you already have a work visa / permit for Switzerland?
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleVisaAnswer('yes')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Yes, I have it</div>
                      <div className="text-sm text-gray-600 mt-1">I already have my work visa/permit</div>
                    </button>
                    
                    <button
                      onClick={() => handleVisaAnswer('no')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">No, I need to apply</div>
                      <div className="text-sm text-gray-600 mt-1">I need to start the application process</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {taskStatus === 'not_started' && (userStatus === 'eu_efta' || userStatus === 'visa_exempt' || userStatus === 'visa_required') && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Make sure your legal right to stay in Switzerland is secured
                  </h3>
                  
                  <button
                    onClick={() => setShowDetails(true)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Details based on User Status */}
            {showDetails && userStatus === 'eu_efta' && !showVisaQuestion && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Since you are a citizen of "{user?.country_of_origin}":
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>• You may enter Switzerland without a visa and stay up to 90 days as a tourist.</p>
                    <p>• To live and work here, you need one of the following residence/work permits: L (short-term) or B (longer-term).</p>
                    <p>• Your Swiss employer must apply for this permit before you start work.</p>
                    <p>• Once approved, you can enter Switzerland visa-free and must register at your Gemeinde (municipality) within 14 days (see task Register at your Gemeinde (municipality)).</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowVisaQuestion(true)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {showDetails && userStatus === 'visa_exempt' && !showVisaQuestion && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Since you are a citizen of "{user?.country_of_origin}":
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>• You may enter Switzerland without a visa and stay up to 90 days as a tourist.</p>
                    <p>• To live and work here, you need one of the following residence/work permits: L (short-term) or B (longer-term).</p>
                    <p>• Your Swiss employer must apply for this permit before you start work.</p>
                    <p>• Once approved, you can enter Switzerland visa-free and must register at your Gemeinde (municipality) within 14 days (see task Register at your Gemeinde (municipality)).</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowVisaQuestion(true)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {showDetails && userStatus === 'visa_required' && !showVisaQuestion && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Since you are a citizen of "{user?.country_of_origin}":
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>• Non-EU/EFTA citizens require a permit to live and work in Switzerland.</p>
                    <p>• Your Swiss employer must apply for a work permit on your behalf with the cantonal authorities.</p>
                    <p>• After your permit is approved by the canton and confirmed by the federal authorities (SEM), the Swiss embassy/consulate in your home country will issue you a D visa, which allows you to enter Switzerland to take up residence and employment.</p>
                    <p>• After arrival, you must register at your Gemeinde (municipality) within 14 days and you will then receive your permit card: L (short-term) or B (longer-term) (see task Register at your Gemeinde (municipality)).</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowVisaQuestion(true)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Visa Question */}
            {showVisaQuestion && !showReminder && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Do you already have a work visa / permit for Switzerland?
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleVisaAnswer('yes')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Yes, I have it</div>
                    </button>
                    
                    <button
                      onClick={() => handleVisaAnswer('no')}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">No, I need to apply</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reminder Setup */}
            {showReminder && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {userStatus === 'no_country' 
                      ? 'Please update your profile with your country of origin so we can give you the exact next steps.'
                      : userStatus === 'visa_required'
                      ? 'Check the status of your application with your employer. Once it\'s approved by the authorities, you must contact the Swiss embassy/consulate in your home country to obtain a D visa before traveling.'
                      : 'Check the status of your permit application with your Swiss employer. You cannot start work until it\'s approved.'
                    }
                  </h3>
                  
                  <div className="bg-white rounded border p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      We'll remind you to check on the status {reminderDays} days from now.
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-sm text-gray-700">Remind me in:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={reminderDays}
                        onChange={(e) => setReminderDays(parseInt(e.target.value) || 7)}
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

            {/* Completed State */}
            {taskStatus === 'completed' && (
              <div className="border border-gray-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Residence Permit Task Completed!
                </h3>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
