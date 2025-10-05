'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, GraduationCap, FileText, Calendar, MapPin } from 'lucide-react';
import PDFUploadAndFill from '@/components/PDFUploadAndFill';
import { createClient } from '@supabase/supabase-js';

export default function Task4SchoolRegistration({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [loading, setLoading] = useState(true);
  const [hasKids, setHasKids] = useState<boolean | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
        setHasKids(profileData.has_kids);
      }

      // Load task status
      const { data: statusData } = await supabase
        .from('user_task_status')
        .select('*')
        .eq('user_id', userId)
        .eq('task_id', 4)
        .single();

      if (statusData) {
        setTaskStatus(statusData.status);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsCompleted() {
    await supabase
      .from('user_task_status')
      .upsert({
        user_id: userId,
        task_id: 4,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,task_id' });

    setTaskStatus('completed');
  }

  async function markAsNotApplicable() {
    await supabase
      .from('user_task_status')
      .upsert({
        user_id: userId,
        task_id: 4,
        status: 'skipped',
        notes: 'No children - task not applicable',
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,task_id' });

    setTaskStatus('completed');
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              URGENT
            </span>
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

        {taskStatus === 'completed' && (
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📚 What you need to know:</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>Enrolling your child(ren) in school/kindergarten is a separate step from Gemeinde registration.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>School attendance is compulsory from age 4-6 (varies by canton)</li>
            <li>Kindergarten usually starts at age 4 or 5</li>
            <li>Registration happens at your Gemeinde (municipality)</li>
            <li>Public schools are free, private schools have tuition fees</li>
          </ul>
        </div>
      </div>

      {/* Check if user has kids */}
      {hasKids === null && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-3">Do you have children?</h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setHasKids(true);
                supabase.from('users').update({ has_kids: true }).eq('id', userId);
              }}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
            >
              Yes, I have children
            </button>
            <button
              onClick={() => {
                setHasKids(false);
                markAsNotApplicable();
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              No children
            </button>
          </div>
        </div>
      )}

      {/* No kids - task not applicable */}
      {hasKids === false && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            This task is not applicable since you don't have children.
          </p>
        </div>
      )}

      {/* Has kids - show registration flow */}
      {hasKids === true && (
        <div className="space-y-6">
          {/* Profile Info Check */}
          {profile && profile.num_children > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    You have {profile.num_children} {profile.num_children === 1 ? 'child' : 'children'} registered in your profile
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Location: {profile.municipality}, {profile.canton}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Required Documents */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">📎 Documents you'll need:</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">•</span>
                <span>Child's birth certificate (original or certified copy)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">•</span>
                <span>Passport or ID for child</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">•</span>
                <span>Residence permit (if available)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">•</span>
                <span>Proof of address (rental contract)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">•</span>
                <span>Vaccination records (if available)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">•</span>
                <span>Previous school reports (if applicable)</span>
              </li>
            </ul>
          </div>

          {/* Main Action */}
          {!showUpload && taskStatus !== 'completed' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="font-semibold text-indigo-900 mb-2">
                  🎯 Two options to complete registration:
                </h3>
                
                <div className="space-y-3 mt-4">
                  <button
                    onClick={() => setShowUpload(true)}
                    className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold mb-1">Option 1: Upload & Auto-Fill PDF Form (Recommended) ✨</div>
                      <div className="text-sm opacity-90">
                        Upload the form you received from school, we'll translate it and fill it for you
                      </div>
                    </div>
                    <FileText className="w-6 h-6" />
                  </button>

                  <button
                    onClick={markAsCompleted}
                    className="w-full px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold mb-1">Option 2: I'll do it manually</div>
                      <div className="text-sm">I've already registered or will do it myself</div>
                    </div>
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PDF Upload Component */}
          {showUpload && taskStatus !== 'completed' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload School Registration Form
                </h3>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>

              <PDFUploadAndFill
                userId={userId}
                taskId={4}
                userProfile={profile}
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={markAsCompleted}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Mark as Completed
                </button>
              </div>
            </div>
          )}

          {/* Completed State */}
          {taskStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                School Registration Completed! 🎉
              </h3>
              <p className="text-green-700">
                Great job! Your child(ren) should be all set for school.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
