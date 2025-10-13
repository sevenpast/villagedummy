import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskList } from '@/components/tasks/TaskList'
import Link from 'next/link'

export default async function TasksPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Tasks</h1>
          <p className="text-gray-600">
            Personalized guidance for your journey in Switzerland
          </p>
        </div>

        {/* Task List */}
        <TaskList moduleNumber={1} />
      </div>
    </div>
  )
}
