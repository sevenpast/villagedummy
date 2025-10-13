// ============================================================================
// PROFILE API - SECURED VERSION
// Fixed IDOR vulnerability by using authenticated user context
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling, createError } from '@/lib/error-handling'
import { ProfileUpdateSchema, validateRequestBody } from '@/lib/validation/schemas'
import { createClient } from '@/lib/supabase/server'

const profileHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const user = request.user
  const userId = user.id

  // SECURITY FIX: Use authenticated user ID instead of client-provided ID
  const supabase = await createClient()
  
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

const createProfileHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const user = request.user
  const userId = user.id
  const body = await request.json()
  const profileData = validateRequestBody(ProfileUpdateSchema, body)

  // SECURITY FIX: Use authenticated user ID
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId, // SECURE: Use authenticated user ID
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw createError.database('Failed to create profile', error)
  }

  return NextResponse.json({ 
    success: true,
    data 
  })
}

const updateProfileHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const user = request.user
  const userId = user.id
  const body = await request.json()
  const profileData = validateRequestBody(ProfileUpdateSchema, body)

  // SECURITY FIX: Use authenticated user ID and upsert for simplicity
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId, // SECURE: Use authenticated user ID
      ...profileData,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id' 
    })
    .select()
    .single()

  if (error) {
    throw createError.database('Failed to update profile', error)
  }

  return NextResponse.json({ 
    success: true,
    data 
  })
}

// SECURITY FIX: All routes now require authentication
export const GET = withAuth(withErrorHandling(profileHandler))
export const POST = withAuth(withErrorHandling(createProfileHandler))
export const PUT = withAuth(withErrorHandling(updateProfileHandler))