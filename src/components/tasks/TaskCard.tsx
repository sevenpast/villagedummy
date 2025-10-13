'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PdfProcessor from './PdfProcessor'
import { getDynamicTaskContent, UserProfile } from '@/lib/dynamic-content-generator'

interface TaskVariant {
  id: string
  variant_name: string
  intro_text: string
  info_box_content: string
  question_text?: string
  actions?: any[]
  modal_title?: string
  modal_content?: string
  modal_has_reminder?: boolean
  modal_default_reminder_days?: number
  modal_has_email_generator?: boolean
  modal_has_pdf_upload?: boolean
  modal_has_school_email_generator?: boolean
  official_link_url?: string
  official_link_label?: string
  checklist_items?: any[]
}

interface Task {
  task_id: string
  task_number: number
  title: string
  priority: number
  display_order: number
  variant_id: string
  variant_name: string
  intro_text: string
  info_box_content: string
  question_text?: string
  actions?: any[]
  modal_title?: string
  modal_content?: string
  modal_has_reminder?: boolean
  modal_default_reminder_days?: number
  modal_has_email_generator?: boolean
  modal_has_pdf_upload?: boolean
  modal_has_school_email_generator?: boolean
  official_link_url?: string
  official_link_label?: string
  checklist_items?: any[]
  user_status: string
  user_completed_at?: string
}

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, status: string) => void
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reminderDays, setReminderDays] = useState(task.modal_default_reminder_days || 7)
  const [userCanton, setUserCanton] = useState<string | null>(null)
  const [userMunicipality, setUserMunicipality] = useState<string | null>(null)
  const [hasChildren, setHasChildren] = useState<boolean>(false)
  const [municipalityWebsite, setMunicipalityWebsite] = useState<string | null>(null)
  const [isLoadingWebsite, setIsLoadingWebsite] = useState(false)
  const [schoolWebsite, setSchoolWebsite] = useState<string | null>(null)
  const [isLoadingSchoolWebsite, setIsLoadingSchoolWebsite] = useState(false)
  const [schoolEmailData, setSchoolEmailData] = useState<any>(null)
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
  const [dynamicInfoBoxContent, setDynamicInfoBoxContent] = useState<string>('')
  
  const supabase = createClient()

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('canton, municipality, has_children, country_of_origin, first_name, last_name')
            .eq('user_id', user.id)
            .single()
          
          if (error) {
            console.warn('Could not load user profile:', error.message)
            return
          }
          
          if (profile) {
            if (profile.canton) setUserCanton(profile.canton)
            if (profile.municipality) setUserMunicipality(profile.municipality)
            if (profile.has_children) setHasChildren(profile.has_children)
            
            // Generate dynamic content based on user profile
            const userProfile: UserProfile = {
              country_of_origin: profile.country_of_origin,
              has_children: profile.has_children,
              first_name: profile.first_name,
              last_name: profile.last_name
            }
            
            console.log('TaskCard - User Profile:', userProfile);
            console.log('TaskCard - Task Number:', task.task_number);
            
            // Test the visa status detection directly
            if (userProfile.country_of_origin) {
              const { getVisaStatus, getUserSegment } = await import('@/data/visaRequirements');
              const visaStatus = getVisaStatus(userProfile.country_of_origin);
              const segment = getUserSegment(userProfile.country_of_origin);
              console.log('Direct test - Visa Status:', visaStatus);
              console.log('Direct test - Segment:', segment);
            }
            
            const dynamicContent = getDynamicTaskContent(task.task_number, userProfile)
            console.log('TaskCard - Dynamic Content:', dynamicContent);
            
            setDynamicInfoBoxContent(dynamicContent.infoBoxContent)
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    }

    loadUserProfile()
  }, [supabase])

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: // URGENT
        return 'bg-red-100 text-red-800 border-red-200'
      case 3: // HIGH
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 2: // MEDIUM
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 1: // LOW
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 4: return 'URGENT'
      case 3: return 'HIGH'
      case 2: return 'MEDIUM'
      case 1: return 'LOW'
      default: return 'UNKNOWN'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'skipped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAction = async (action: any) => {
    setIsLoading(true)
    
    try {
      // Handle both 'behavior' and 'action' properties for compatibility
      const actionType = action.behavior || action.action
      
      switch (actionType) {
        case 'mark_done':
        case 'complete':
          await markTaskComplete()
          break
        case 'open_modal':
          setIsModalOpen(true)
          break
        case 'redirect':
          if (action.redirect_url) {
            window.location.href = action.redirect_url
          }
          break
        case 'set_reminder':
          await setReminder()
          break
        default:
          console.log('Unknown action:', actionType)
      }
    } catch (error) {
      console.error('Error handling action:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const markTaskComplete = async () => {
    const { error } = await supabase
      .from('user_task_progress')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        task_id: task.task_id,
        task_variant_id: task.variant_id,
        status: 'completed',
        completed_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    onStatusChange(task.task_id, 'completed')
  }

  const setReminder = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get user email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', user.id)
        .single()

      const userEmail = profile?.email || user.email

      if (!userEmail) {
        throw new Error('No email address found for user')
      }

      // Determine reminder type
      const reminderType = reminderDays === 0 ? 'now' : 'scheduled'

      // Call our new API
      const response = await fetch('/api/send-task-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.task_id,
          reminderDays: reminderDays,
          userEmail: userEmail,
          taskTitle: task.title,
          reminderType: reminderType
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set reminder')
      }

      setIsModalOpen(false)
      
      if (reminderType === 'now') {
        alert(`📧 Reminder email sent successfully to ${userEmail}!`)
      } else {
        alert(`⏰ Reminder scheduled! You'll receive an email in ${reminderDays} days.`)
      }

    } catch (error) {
      console.error('Error setting reminder:', error)
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to set reminder'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const renderChecklist = () => {
    if (!task.checklist_items || task.checklist_items.length === 0) {
      return null
    }

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Checklist:</h4>
        <ul className="space-y-1">
          {task.checklist_items.map((item: any, index: number) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <span className={`mr-2 ${item.required ? 'text-red-500' : 'text-gray-400'}`}>
                {item.required ? '•' : '○'}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const generateEmailToCanton = () => {
    // Generate mailto link for cantonal migration office
    const subject = encodeURIComponent('Inquiry about residence permit card - biometric appointment')
    
    // Create email body with canton-specific or generic content
    let emailBody = `Dear Sir/Madam,

I registered at my local Gemeinde on [DATE] and have not yet received my biometric appointment letter for the residence permit card.

Could you please provide an update on the status of my application?

Thank you for your assistance.

Best regards,
[YOUR NAME]`

    // If we have a canton, add it to the subject and body
    if (userCanton) {
      const cantonSubject = encodeURIComponent(`Inquiry about residence permit card - biometric appointment (${userCanton})`)
      const cantonBody = encodeURIComponent(`Dear ${userCanton} Migration Office,

I registered at my local Gemeinde on [DATE] and have not yet received my biometric appointment letter for the residence permit card.

Could you please provide an update on the status of my application?

Thank you for your assistance.

Best regards,
[YOUR NAME]`)
      
      const mailtoLink = `mailto:?subject=${cantonSubject}&body=${cantonBody}`
      window.open(mailtoLink)
    } else {
      // Generic email without specific canton
      const genericBody = encodeURIComponent(emailBody)
      const mailtoLink = `mailto:?subject=${subject}&body=${genericBody}`
      window.open(mailtoLink)
    }
  }

  const loadMunicipalityWebsite = async () => {
    if (!userMunicipality || !userCanton) {
      alert('Municipality and canton information not found in your profile. Please update your profile first.')
      return
    }

    setIsLoadingWebsite(true)
    try {
      const response = await fetch('/api/municipality-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          municipality: userMunicipality,
          canton: userCanton
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to find municipality website')
      }

      setMunicipalityWebsite(result.website_url)
    } catch (error) {
      console.error('Error loading municipality website:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to find municipality website'}`)
    } finally {
      setIsLoadingWebsite(false)
    }
  }

  const generateSchoolEmail = async () => {
    if (!userMunicipality || !userCanton) {
      alert('Municipality and canton information not found in your profile. Please update your profile first.')
      return
    }

    setIsGeneratingEmail(true)
    try {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/school-email-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          municipality: userMunicipality,
          canton: userCanton,
          childrenAges: [6] // Default age, could be enhanced with actual children data
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate school email')
      }

      setSchoolEmailData(result)
      
      // Open the mailto link
      if (result.mailto_url) {
        window.open(result.mailto_url)
      }
    } catch (error) {
      console.error('Error generating school email:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate school email'}`)
    } finally {
      setIsGeneratingEmail(false)
    }
  }

  const loadSchoolWebsite = async () => {
    if (!userMunicipality || !userCanton) {
      alert('Municipality and canton information not found in your profile. Please update your profile first.')
      return
    }

    setIsLoadingSchoolWebsite(true)
    try {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/school-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          municipality: userMunicipality,
          canton: userCanton
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to find school website')
      }

      setSchoolWebsite(result.school_website_url)
    } catch (error) {
      console.error('Error loading school website:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to load school website'}`)
    } finally {
      setIsLoadingSchoolWebsite(false)
    }
  }


  return (
    <>
      <div className="bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200">
        {/* Compact Header - Always Visible */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.user_status)}`}>
                  {task.user_status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            </div>
            <div className="ml-4">
              <span className="text-sm text-gray-500">
                {isExpanded ? 'Less' : 'More'}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Content - Only visible when expanded */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-200">
            <div className="pt-4">
              <p className="text-sm text-gray-600 mb-4">{task.intro_text}</p>

              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-300 p-4 mb-4">
                <div className="text-sm text-gray-800 whitespace-pre-line">
                  {dynamicInfoBoxContent || task.info_box_content}
                </div>
              </div>

              {/* Checklist */}
              {renderChecklist()}

              {/* Official Link */}
              {task.official_link_url && (
                <div className="mb-4">
                  <a
                    href={task.official_link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {task.official_link_label || 'Official Information'}
                  </a>
                </div>
              )}

              {/* PDF Upload Section - Show first for Task 3 and 4 */}
              {task.modal_has_pdf_upload && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      📄 PDF Form Processing
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Upload your Swiss municipality registration form and we'll automatically fill it with your profile data using AI-powered OCR technology.
                    </p>
                    
                    {/* Upload Button that shows error message */}
                    <button
                      onClick={() => {
                        alert("Sorry, this function still doesn't work as wished. I am doing my best to fix it as soon as possible.");
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      + Upload PDF Document
                    </button>
                    
                    <p className="text-xs text-gray-600 mt-2">
                      Upload a PDF form to automatically fill it with your profile data
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: PDF files up to 10MB
                    </p>
                  </div>
                </div>
              )}

              {/* Question and Actions - Show after PDF upload */}
              {task.question_text && task.actions && task.actions.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">{task.question_text}</p>
                  <div className="flex flex-wrap gap-2">
                    {task.actions.map((action: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleAction(action)}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          action.style === 'primary' || action.style === 'success'
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : action.style === 'warning'
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : action.style === 'info'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isLoading ? 'Loading...' : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Status */}
              {task.user_status === 'completed' && task.user_completed_at && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Completed on {new Date(task.user_completed_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && task.modal_title && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{task.modal_title}</h3>
              
              {/* Municipality Website Section for Task 3 */}
              {task.modal_has_pdf_upload && task.task_id !== 'task-4-school-registration' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Official Website:</span>
                    <button
                      onClick={loadMunicipalityWebsite}
                      disabled={isLoadingWebsite}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                    >
                      {isLoadingWebsite ? 'Loading...' : 'Load Website'}
                    </button>
                  </div>
                  {municipalityWebsite ? (
                    <a
                      href={municipalityWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {municipalityWebsite}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Click "Load Website" to find your municipality's official website</p>
                  )}
                </div>
              )}

              {/* School Website Section for Task 4 */}
              {task.task_id === 'task-4-school-registration' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">School Registration Website:</span>
                    <button
                      onClick={loadSchoolWebsite}
                      disabled={isLoadingSchoolWebsite}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                    >
                      {isLoadingSchoolWebsite ? 'Loading...' : 'Find Website'}
                    </button>
                  </div>
                  {schoolWebsite ? (
                    <a
                      href={schoolWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {schoolWebsite}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Click "Find Website" to locate the school registration website</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Für weitere Informationen kannst du dort nachschauen.
                  </p>
                </div>
              )}
              
              <div className="text-sm text-gray-600 mb-6 whitespace-pre-line">
                {task.modal_content}
              </div>

              {/* Task 4 Specific Content */}
              {task.task_id === 'task-4-school-registration' && (
                <div className="mb-6 space-y-4">
                  {/* Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-red-800">Important Notice</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Don't delay! School registration is mandatory for all children aged 4-16 in Switzerland. 
                          Contact your local school authority immediately after arrival to avoid delays.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Required Documents Checklist</h4>
                    <p className="text-xs text-blue-700 mb-3">
                      Note: Requirements may vary by canton and municipality. Contact your local school authority for specific requirements.
                    </p>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Birth certificate (translated and certified)
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Vaccination records (translated and certified)
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Proof of residence (rental agreement or property deed)
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Previous school records (if applicable)
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Language assessment (may be required)
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Health insurance certificate
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Passport or ID documents
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Email Generator Button */}
              {task.modal_has_email_generator && (
                <div className="mb-6">
                  <button
                    onClick={generateEmailToCanton}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {userCanton ? `Generate email to ${userCanton} migration office` : 'Generate email to migration office'}
                  </button>
                </div>
              )}
              
              {/* School Email Generator Button for Task 3 and Task 4 */}
              {task.modal_has_school_email_generator && hasChildren && (
                <div className="mb-6">
                  <button
                    onClick={generateSchoolEmail}
                    disabled={isGeneratingEmail}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingEmail ? 'Generating Email...' : 'Write a mail to school authority'}
                  </button>
                  {schoolEmailData && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-xs text-green-700">
                        Email generated for: {schoolEmailData.school_authority_name}
                      </p>
                      <p className="text-xs text-green-600">
                        Language: {schoolEmailData.official_language}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {task.modal_has_reminder && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remind me in:
                  </label>
                  <select
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label="Select reminder interval"
                  >
                    <option value={0}>Send now</option>
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                    <option value={30}>1 month</option>
                  </select>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                {task.modal_has_reminder && (
                  <button
                    onClick={setReminder}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : reminderDays === 0 ? 'Send Now' : 'Set Reminder'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
