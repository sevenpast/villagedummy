'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from './TaskCard'

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

interface TaskListProps {
  moduleNumber?: number
}

export function TaskList({ moduleNumber = 1 }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [moduleNumber])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to view your tasks')
        return
      }

      // Try the RPC function first
      try {
        const { data, error } = await supabase.rpc('get_user_tasks', {
          user_uuid: user.id,
          module_num: moduleNumber
        })

        if (error) {
          console.warn('RPC function error, using fallback:', error)
          throw error
        }

        if (data && data.length > 0) {
          setTasks(data)
          return
        } else {
          console.warn('RPC function returned no data, using fallback')
          throw new Error('No data returned from RPC')
        }
      } catch (rpcError) {
        console.warn('RPC function failed, using direct query fallback')
        
        // Debug: Check what's in the database
        console.log('Debugging: Checking database contents...')
        
        // First, let's try a simple query to see if we can access the tasks table
        const { data: simpleTasks, error: simpleError } = await supabase
          .from('tasks')
          .select('id, task_number, title, is_active')
          .eq('is_active', true)
          .limit(5)
        
        console.log('Simple tasks query result:', { simpleTasks, simpleError })
        
        if (simpleError) {
          console.error('Simple query failed:', simpleError)
          setError(`Database connection error: ${simpleError.message}`)
          return
        }
        
        // Fallback: Direct query to get tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id,
            task_number,
            title,
            priority,
            display_order,
            task_variants!inner(
              id,
              variant_name,
              intro_text,
              info_box_content,
              question_text,
              actions,
              modal_title,
              modal_content,
              modal_has_reminder,
              modal_default_reminder_days,
              modal_has_email_generator,
              modal_has_pdf_upload,
              modal_has_school_email_generator,
              official_link_url,
              official_link_label,
              checklist_items
            ),
            user_task_progress!left(
              status,
              completed_at
            )
          `)
          .eq('is_active', true)
          .eq('user_task_progress.user_id', user.id)

        if (tasksError) {
          console.error('Direct query error:', tasksError)
          
          // Emergency fallback: Use simple tasks if complex query fails
          if (simpleTasks && simpleTasks.length > 0) {
            console.log('Using emergency fallback with simple tasks')
            const emergencyTasks = simpleTasks.map(task => ({
              task_id: task.id,
              task_number: task.task_number,
              title: task.title,
              priority: 1,
              display_order: task.task_number,
              variant_id: 'emergency',
              variant_name: 'emergency',
              intro_text: 'This is a simplified task view. Please complete your profile for full functionality.',
              info_box_content: 'Complete your profile to see personalized task content.',
              question_text: 'Would you like to complete this task?',
              actions: [{ label: 'Mark as Complete', action: 'complete' }],
              modal_title: 'Task Details',
              modal_content: 'This is a simplified task. Complete your profile for full functionality.',
              modal_has_reminder: false,
              modal_default_reminder_days: 7,
              modal_has_email_generator: false,
              modal_has_pdf_upload: false,
              modal_has_school_email_generator: false,
              user_status: 'not_started',
              user_completed_at: undefined
            }))
            setTasks(emergencyTasks)
            return
          }
          
          setError(`Failed to load tasks: ${tasksError.message}`)
          return
        }

        if (!tasksData || tasksData.length === 0) {
          console.warn('No tasks found in database')
          
          // If we have simple tasks, use them as emergency fallback
          if (simpleTasks && simpleTasks.length > 0) {
            console.log('Using simple tasks as emergency fallback')
            const emergencyTasks = simpleTasks.map(task => ({
              task_id: task.id,
              task_number: task.task_number,
              title: task.title,
              priority: 1,
              display_order: task.task_number,
              variant_id: 'emergency',
              variant_name: 'emergency',
              intro_text: 'This is a simplified task view. Please complete your profile for full functionality.',
              info_box_content: 'Complete your profile to see personalized task content.',
              question_text: 'Would you like to complete this task?',
              actions: [{ label: 'Mark as Complete', action: 'complete' }],
              modal_title: 'Task Details',
              modal_content: 'This is a simplified task. Complete your profile for full functionality.',
              modal_has_reminder: false,
              modal_default_reminder_days: 7,
              modal_has_email_generator: false,
              modal_has_pdf_upload: false,
              modal_has_school_email_generator: false,
              user_status: 'not_started',
              user_completed_at: undefined
            }))
            setTasks(emergencyTasks)
            return
          }
          
          setTasks([])
          return
        }

        // Transform the data to match the expected format
        let transformedTasks = []
        try {
          transformedTasks = tasksData?.map(task => {
            const variant = Array.isArray(task.task_variants) ? task.task_variants[0] : task.task_variants;
            const progress = Array.isArray(task.user_task_progress) ? task.user_task_progress[0] : task.user_task_progress;
            
            return {
              task_id: task.id,
              task_number: task.task_number,
              title: task.title,
              priority: task.priority,
              display_order: task.display_order,
              variant_id: variant?.id || '',
              variant_name: variant?.variant_name || 'default',
              intro_text: variant?.intro_text || '',
              info_box_content: variant?.info_box_content || '',
              question_text: variant?.question_text,
              actions: variant?.actions,
              modal_title: variant?.modal_title,
              modal_content: variant?.modal_content,
              modal_has_reminder: variant?.modal_has_reminder || false,
              modal_default_reminder_days: variant?.modal_default_reminder_days || 7,
              modal_has_email_generator: variant?.modal_has_email_generator || false,
              modal_has_pdf_upload: variant?.modal_has_pdf_upload || false,
              modal_has_school_email_generator: variant?.modal_has_school_email_generator || false,
              official_link_url: variant?.official_link_url,
              official_link_label: variant?.official_link_label,
              checklist_items: variant?.checklist_items,
              user_status: progress?.status || 'not_started',
              user_completed_at: progress?.completed_at
            };
          }).filter(task => task.variant_id) || []
        } catch (transformError) {
          console.error('Error transforming task data:', transformError)
          
          // If transformation fails, use simple tasks as emergency fallback
          if (simpleTasks && simpleTasks.length > 0) {
            console.log('Using simple tasks as emergency fallback after transformation error')
            const emergencyTasks = simpleTasks.map(task => ({
              task_id: task.id,
              task_number: task.task_number,
              title: task.title,
              priority: 1,
              display_order: task.task_number,
              variant_id: 'emergency',
              variant_name: 'emergency',
              intro_text: 'This is a simplified task view. Please complete your profile for full functionality.',
              info_box_content: 'Complete your profile to see personalized task content.',
              question_text: 'Would you like to complete this task?',
              actions: [{ label: 'Mark as Complete', action: 'complete' }],
              modal_title: 'Task Details',
              modal_content: 'This is a simplified task. Complete your profile for full functionality.',
              modal_has_reminder: false,
              modal_default_reminder_days: 7,
              modal_has_email_generator: false,
              modal_has_pdf_upload: false,
              modal_has_school_email_generator: false,
              user_status: 'not_started',
              user_completed_at: undefined
            }))
            setTasks(emergencyTasks)
            return
          }
          
          throw transformError
        }

        if (transformedTasks.length === 0) {
          console.warn('No valid tasks after transformation')
          
          // If we have simple tasks, use them as emergency fallback
          if (simpleTasks && simpleTasks.length > 0) {
            console.log('Using simple tasks as emergency fallback after transformation')
            const emergencyTasks = simpleTasks.map(task => ({
              task_id: task.id,
              task_number: task.task_number,
              title: task.title,
              priority: 1,
              display_order: task.task_number,
              variant_id: 'emergency',
              variant_name: 'emergency',
              intro_text: 'This is a simplified task view. Please complete your profile for full functionality.',
              info_box_content: 'Complete your profile to see personalized task content.',
              question_text: 'Would you like to complete this task?',
              actions: [{ label: 'Mark as Complete', action: 'complete' }],
              modal_title: 'Task Details',
              modal_content: 'This is a simplified task. Complete your profile for full functionality.',
              modal_has_reminder: false,
              modal_default_reminder_days: 7,
              modal_has_email_generator: false,
              modal_has_pdf_upload: false,
              modal_has_school_email_generator: false,
              user_status: 'not_started',
              user_completed_at: undefined
            }))
            setTasks(emergencyTasks)
            return
          }
        }
        
        console.log('Successfully loaded tasks:', transformedTasks.length, 'tasks')
        setTasks(transformedTasks)
      }
    } catch (err) {
      console.error('Error loading tasks:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(`Failed to load tasks: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (taskId: string, status: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.task_id === taskId
          ? { ...task, user_status: status, user_completed_at: status === 'completed' ? new Date().toISOString() : undefined }
          : task
      )
    )
  }

  const getCompletedCount = () => {
    return tasks.filter(task => task.user_status === 'completed').length
  }

  const getTotalCount = () => {
    return tasks.length
  }

  const getProgressPercentage = () => {
    const completed = getCompletedCount()
    const total = getTotalCount()
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Loading your tasks...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading tasks</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadTasks}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Complete your profile to see personalized tasks for your situation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Tasks</h2>
          <span className="text-sm text-gray-500">
            {getCompletedCount()} of {getTotalCount()} completed
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` } as React.CSSProperties}
          />
        </div>
        
        <p className="mt-2 text-sm text-gray-600">
          {getProgressPercentage()}% complete
        </p>
      </div>

      {/* Tasks */}
      <div className="space-y-6">
        {tasks.map((task) => (
          <TaskCard
            key={`${task.task_id}-${task.variant_id}`}
            task={task}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Completion Message */}
      {getCompletedCount() === getTotalCount() && getTotalCount() > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-semibold text-green-900">Congratulations!</h3>
          <p className="mt-1 text-sm text-green-700">
            You've completed all tasks in this module. Great job on your progress!
          </p>
        </div>
      )}
    </div>
  )
}
