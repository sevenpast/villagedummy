'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Building, ArrowLeft } from 'lucide-react';
import IntelligentPDFProcessor from '../../../components/IntelligentPDFProcessor';

export default function Task3Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userStatus, setUserStatus] = useState<'no_country' | 'eu_efta' | 'visa_exempt' | 'visa_required' | 'loading'>('loading');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState(2);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showFormUpload, setShowFormUpload] = useState(false);

  // Function to determine official language based on canton
  const getOfficialLanguage = (canton: string) => {
    const languageMap: { [key: string]: string } = {
      // German-speaking cantons
      'ZH': 'de', 'BE': 'de', 'LU': 'de', 'UR': 'de', 'SZ': 'de', 'OW': 'de', 'NW': 'de', 
      'GL': 'de', 'ZG': 'de', 'FR': 'de', 'SO': 'de', 'BS': 'de', 'BL': 'de', 'SH': 'de', 
      'AR': 'de', 'AI': 'de', 'SG': 'de', 'AG': 'de', 'TG': 'de',
      
      // French-speaking cantons
      'GE': 'fr', 'VD': 'fr', 'NE': 'fr', 'JU': 'fr',
      
      // Italian-speaking cantons
      'TI': 'it',
      
      // Bilingual cantons (default to German)
      'VS': 'de', 'GR': 'de'
    };
    
    return languageMap[canton?.toUpperCase()] || 'de'; // Default to German
  };

  // Function to get email text based on language
  const getEmailText = (language: string) => {
    const emailTexts = {
      'de': {
        subject: 'Anmeldung in der Gemeinde - Registrierung als Einwohner',
        body: 'Sehr geehrte Damen und Herren,%0A%0Aich wende mich an Sie, um mich als neuer Einwohner in Ihrer Gemeinde anzumelden.%0A%0AAnbei finden Sie alle erforderlichen Dokumente für meine Registrierung:%0A%0A- Reisepass/Personalausweis%0A- Arbeitsvertrag%0A- Mietvertrag oder Wohnungsbestätigung%0A- Krankenversicherungsnachweis%0A%0AIch bitte Sie, meine Anmeldung zu bearbeiten und mich über die nächsten Schritte zu informieren.%0A%0AMit freundlichen Grüßen%0A' + (user?.first_name || '') + ' ' + (user?.last_name || '') + '%0A%0A---%0A%0AENGLISH VERSION:%0A%0ADear Sir or Madam,%0A%0AI am writing to register as a new resident in your municipality.%0A%0APlease find attached all required documents for my registration:%0A%0A- Passport/ID%0A- Employment contract%0A- Rental contract or accommodation confirmation%0A- Health insurance certificate%0A%0APlease process my registration and inform me about the next steps.%0A%0AKind regards%0A' + (user?.first_name || '') + ' ' + (user?.last_name || '')
      },
      'fr': {
        subject: 'Inscription dans la commune - Enregistrement comme résident',
        body: 'Madame, Monsieur,%0A%0Aje m\'adresse à vous pour m\'inscrire comme nouveau résident dans votre commune.%0A%0AVeuillez trouver ci-joint tous les documents requis pour mon inscription:%0A%0A- Passeport/Carte d\'identité%0A- Contrat de travail%0A- Contrat de location ou confirmation de logement%0A- Certificat d\'assurance maladie%0A%0AJe vous prie de traiter mon inscription et de m\'informer des prochaines étapes.%0A%0ACordialement%0A' + (user?.first_name || '') + ' ' + (user?.last_name || '') + '%0A%0A---%0A%0AVERSION ANGLAISE:%0A%0ADear Sir or Madam,%0A%0AI am writing to register as a new resident in your municipality.%0A%0APlease find attached all required documents for my registration:%0A%0A- Passport/ID%0A- Employment contract%0A- Rental contract or accommodation confirmation%0A- Health insurance certificate%0A%0APlease process my registration and inform me about the next steps.%0A%0AKind regards%0A' + (user?.first_name || '') + ' ' + (user?.last_name || '')
      },
      'it': {
        subject: 'Iscrizione nel comune - Registrazione come residente',
        body: 'Gentili Signore e Signori,%0A%0Ami rivolgo a voi per iscrivermi come nuovo residente nel vostro comune.%0A%0AIn allegato trovate tutti i documenti richiesti per la mia iscrizione:%0A%0A- Passaporto/Carta d\'identità%0A- Contratto di lavoro%0A- Contratto di affitto o conferma alloggio%0A- Certificato assicurazione sanitaria%0A%0AVi prego di elaborare la mia iscrizione e informarmi sui prossimi passi.%0A%0ACordiali saluti%0A' + (user?.first_name || '') + ' ' + (user?.last_name || '') + '%0A%0A---%0A%0AVERSIONE INGLESE:%0A%0ADear Sir or Madam,%0A%0AI am writing to register as a new resident in your municipality.%0A%0APlease find attached all required documents for my registration:%0A%0A- Passport/ID%0A- Employment contract%0A- Rental contract or accommodation confirmation%0A- Health insurance certificate%0A%0APlease process my registration and inform me about the next steps.%0A%0AKind regards%0A' + (user?.first_name || '') + ' ' + (user?.last_name || '')
      }
    };
    
    return emailTexts[language as keyof typeof emailTexts] || emailTexts['de'];
  };

  // Function to determine user status based on country
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

  // Function to load documents from vault
  const loadDocuments = async () => {
    try {
      const currentUser = localStorage.getItem('village_current_user');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        const response = await fetch(`/api/documents/load?userId=${userData.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDocuments(data.documents || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Function to create signed URLs for all documents
  const createDocumentLinks = async () => {
    try {
      const currentUser = localStorage.getItem('village_current_user');
      if (currentUser && documents.length > 0) {
        const userData = JSON.parse(currentUser);
        
        // Call API to create signed URLs for all documents
        const response = await fetch('/api/documents/create-links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userData.id,
            documentIds: documents.map(doc => doc.id)
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.links) {
            return data.links;
          }
        }
        console.error('Failed to create document links');
        return null;
      }
    } catch (error) {
      console.error('Error creating document links:', error);
      return null;
    }
  };

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
      loadDocuments(); // Load documents from vault
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/signin');
    }
  }, [router]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowDetails(true);
    
    if (answer === 'yes') {
      setTaskStatus('completed');
      // Update progress in parent window (dashboard)
      if (window.opener) {
        window.opener.postMessage({
          type: 'TASK_COMPLETED',
          taskNumber: 3,
          progress: 100
        }, '*');
      }
    } else {
      setTaskStatus('in_progress');
      // For Non-EU/EFTA users and no_country users, show reminder
      if (userStatus === 'visa_exempt' || userStatus === 'visa_required' || userStatus === 'no_country') {
        setShowReminder(true);
      }
      // Update partial progress
      if (window.opener) {
        window.opener.postMessage({
          type: 'TASK_PROGRESS',
          taskNumber: 3,
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
        taskNumber: 3,
        progress: 100
      }, '*');
    }
  };

  const setReminder = () => {
    // In a real implementation, this would set up an actual reminder
    console.log(`Reminder set for ${reminderDays} days from now`);
    setShowReminder(false);
    setTaskStatus('in_progress');
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
                Task 3: Register at your Gemeinde (municipality)
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
                  <Building className="w-7 h-7" />
                  Register at your Gemeinde (municipality)
                </h2>
                <p className="text-gray-600 mt-1">
                  Register at your local municipality - MANDATORY within 14 days
                </p>
              </div>
            </div>


            {/* Loading State */}
            {userStatus === 'loading' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your information...</p>
              </div>
            )}

            {/* Main Question */}
            {taskStatus === 'not_started' && userStatus !== 'loading' && userStatus !== 'no_country' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Make your residence official within 14 days of arrival
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 mb-6">
                    <p><strong>Since you are a citizen of "{user?.country_of_origin}":</strong></p>
                    {userStatus === 'eu_efta' ? (
                      <>
                        <p>• To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.</p>
                        <p>• You will usually receive an L permit (short-term) or B permit (longer-term).</p>
                      </>
                    ) : (
                      <>
                        <p>• To live and work in Switzerland, you must register at your Gemeinde (municipality) within 14 days of arrival after your residence/work permit has been approved.</p>
                        <p>• At registration you will be issued your L (short-term) or B (longer-term) permit card.</p>
                      </>
                    )}
                    <p>• Registration is mandatory for access to services (insurance, bank account, schooling, etc.).</p>
                    <p>• Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Documents usually required at the Gemeinde (municipality):</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Passport/ID for each family member</li>
                      <li>• For families: documents on marital status (family book, marriage certificate, birth certificates)</li>
                      <li>• Employment contract (with length and hours)</li>
                      <li>• Rental contract or landlord confirmation</li>
                      <li>• Passport photos (sometimes required)</li>
                      <li>• Proof of health insurance (or provide it within 3 months)</li>
                    </ul>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Have you already registered yourself?
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
                      <div className="font-medium text-gray-900">No, I need to register</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No Country Question */}
            {taskStatus === 'not_started' && userStatus === 'no_country' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Make your residence official within 14 days of arrival
                  </h3>
                  
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <p className="text-gray-700">
                      You haven't shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.
                    </p>
                  </div>
                  
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Complete Profile
                    </button>
                    <button
                      onClick={() => setShowDetails(true)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Continue Anyway
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Have you already registered yourself?
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
                      <div className="font-medium text-gray-900">No, I need to register</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Details based on answer */}
            {showDetails && selectedAnswer === 'yes' && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Excellent!</h3>
                </div>
              </div>
            )}

            {showDetails && selectedAnswer === 'no' && userStatus === 'eu_efta' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Registration Checklist
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded border p-4">
                      <h4 className="font-medium text-gray-900 mb-3">What you need to register at your Swiss municipality:</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Valid passport or ID card</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Employment contract or job offer</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Rental contract or proof of accommodation</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Health insurance certificate</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Passport photos (2-4 copies)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Birth certificate (if applicable)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Marriage certificate (if applicable)</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Requirements can vary from municipality to municipality. Check with your specific Gemeinde for exact requirements.
                      </p>
                    </div>
                    
                    <div className="bg-white rounded border p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Your Municipality Information:</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        {user?.target_municipality ? 
                          `You're planning to register in: ${user.target_municipality}` :
                          'Please update your profile with your target municipality for specific information.'
                        }
                      </p>
                      {user?.target_municipality && (
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(user.target_municipality + ' gemeinde switzerland official website')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                        >
                          Find {user.target_municipality} Municipality Website
                        </a>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Upload Documents:</h4>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <p className="text-sm text-gray-600 mb-3">
                          Upload municipality registration forms
                        </p>
                        <button
                          onClick={() => setShowFormUpload(true)}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                        >
                          Upload PDF Form
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Send Email to Municipality:</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Send your documents via email to your municipality in the official language:
                      </p>
                  {(() => {
                    const language = getOfficialLanguage(user?.target_canton || '');
                    const emailText = getEmailText(language);
                    const languageNames = { 'de': 'German', 'fr': 'French', 'it': 'Italian' };
                    
                    // Create municipality email (fallback if no specific email found)
                    const municipalityEmail = user?.target_municipality ? 
                      `gemeinde@${user.target_municipality.toLowerCase().replace(/\s+/g, '')}.ch` : 
                      'gemeinde@example.ch';
                    
                    // Add CC with user's email
                    const userEmail = user?.email || 'user@example.com';
                    
                    const handleSendEmail = async () => {
                      if (documents.length > 0) {
                        const links = await createDocumentLinks();
                        if (links) {
                          // Create document links list
                          const documentLinks = links.map((link: any) => 
                            `%0A- ${link.fileName}: ${link.url}`
                          ).join('');
                          
                          const emailBodyWithLinks = emailText.body + 
                            `%0A%0ADOCUMENTS FOR DOWNLOAD:${documentLinks}%0A%0ANote: Please click on the links above to download the required documents.`;
                          
                          window.open(`mailto:${municipalityEmail}?cc=${userEmail}&subject=${emailText.subject}&body=${emailBodyWithLinks}`, '_blank');
                        } else {
                          alert('Failed to create document links. Please try again.');
                        }
                      } else {
                        window.open(`mailto:${municipalityEmail}?cc=${userEmail}&subject=${emailText.subject}&body=${emailText.body}`, '_blank');
                      }
                    };
                    
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                          Language: {languageNames[language as keyof typeof languageNames]}
                        </p>
                        <p className="text-xs text-gray-500">
                          Documents in vault: {documents.length} files
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSendEmail}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                          >
                            Send Email to Municipality
                          </button>
                        </div>
                        {documents.length > 0 && (
                          <p className="text-xs text-blue-600">
                            📎 Document download links will be automatically included in the email
                          </p>
                        )}
                      </div>
                    );
                  })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={handleMarkCompleted}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Mark as Completed
                  </button>
                </div>
              </div>
            )}

            {/* Non-EU/EFTA specific section */}
            {showDetails && selectedAnswer === 'no' && (userStatus === 'visa_exempt' || userStatus === 'visa_required') && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Registration Checklist
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded border p-4">
                      <h4 className="font-medium text-gray-900 mb-3">What you need to register at your Swiss municipality:</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Valid passport or ID card</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Employment contract or job offer</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Rental contract or proof of accommodation</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Health insurance certificate</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Passport photos (2-4 copies)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Birth certificate (if applicable)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Marriage certificate (if applicable)</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">
                        <strong>Don't delay! Registration is mandatory within 14 days.</strong>
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Requirements can vary from municipality to municipality. Check with your specific Gemeinde for exact requirements.
                      </p>
                    </div>
                    
                    <div className="bg-white rounded border p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Your Municipality Information:</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        {user?.target_municipality ? 
                          `You're planning to register in: ${user.target_municipality}` :
                          'Please update your profile with your target municipality for specific information.'
                        }
                      </p>
                      {user?.target_municipality && (
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(user.target_municipality + ' gemeinde switzerland official website')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                        >
                          Find {user.target_municipality} Municipality Website
                        </a>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Upload Documents:</h4>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <p className="text-sm text-gray-600 mb-3">
                          Upload municipality registration forms
                        </p>
                        <button
                          onClick={() => setShowFormUpload(true)}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                        >
                          Upload PDF Form
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={handleMarkCompleted}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Mark as Completed
                  </button>
                </div>
              </div>
            )}

            {/* No Country specific section */}
            {showDetails && selectedAnswer === 'no' && userStatus === 'no_country' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Please update your profile with your country of origin so we can give you the exact next steps.
                  </h3>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Complete Profile
                    </button>
                    <button
                      onClick={() => setShowReminder(true)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Set Reminder
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reminder Setup for Non-EU/EFTA */}
            {showReminder && (userStatus === 'visa_exempt' || userStatus === 'visa_required') && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Reminder: We'll remind you {reminderDays} days from now to ensure you don't miss your deadline.
                  </h3>
                  
                  <div className="bg-white rounded border p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      We'll remind you to complete your registration {reminderDays} days from now.
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-sm text-gray-700">Remind me in:</label>
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

            {/* Reminder Setup for no_country */}
            {showReminder && userStatus === 'no_country' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Set a follow-up to update your profile in {reminderDays} days?
                  </h3>
                  
                  <div className="bg-white rounded border p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      We'll remind you to update your profile {reminderDays} days from now.
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
                      Yes, Set Reminder
                    </button>
                    <button
                      onClick={() => {
                        setShowReminder(false);
                        setTaskStatus('in_progress');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      No, No Reminder
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Form Upload Section */}
            {showFormUpload && taskStatus !== 'completed' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload PDF Form
                  </h3>
                  <button
                    onClick={() => setShowFormUpload(false)}
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
                    setShowFormUpload(false);
                    handleMarkCompleted();
                  }}
                />

              </div>
            )}

            {/* Completed State */}
            {taskStatus === 'completed' && (
              <div className="border border-gray-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Municipality Registration Completed!
                </h3>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
