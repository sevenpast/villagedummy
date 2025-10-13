// ============================================================================
// PROFILE API - SIMPLIFIED & SECURED VERSION
// Optimized with upsert() and simplified logic
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling, createError } from '@/lib/error-handling'
import { ProfileUpdateSchema, validateRequestBody } from '@/lib/validation/schemas'
import { createClient } from '@/lib/supabase/server'

const profileHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const user = request.user
  const userId = user.id
  const supabase = await createClient()
  
  // SIMPLIFIED: Use .single() for cleaner code
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw createError.database('Failed to fetch profile', error)
  }

  return NextResponse.json({ 
    success: true,
    data: data || null 
  })
}

const upsertProfileHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const user = request.user
  const userId = user.id
  const body = await request.json()
  const profileData = validateRequestBody(ProfileUpdateSchema, body)
  const supabase = await createClient()
  
  // SIMPLIFIED: Single upsert operation handles both create and update
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id' 
    })
    .select()
    .single()

  if (error) {
    throw createError.database('Failed to save profile', error)
  }

  return NextResponse.json({ 
    success: true,
    data 
  })
}

// SIMPLIFIED: Only two endpoints needed - GET and UPSERT
export const GET = withAuth(withErrorHandling(profileHandler))
export const POST = withAuth(withErrorHandling(upsertProfileHandler))
export const PUT = withAuth(withErrorHandling(upsertProfileHandler))