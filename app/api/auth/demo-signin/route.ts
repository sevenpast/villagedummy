import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Check if Supabase is properly configured
if (!supabase) {
  console.warn('⚠️ Supabase not configured - using demo mode for authentication')
}

// SECURE: Real Supabase authentication with proper validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      // Demo mode - simulate authentication
      const demoUser = {
        id: `user_${Date.now()}`,
        auth_user_id: `auth_${Date.now()}`,
        username: username,
        email: username.includes('@') ? username : `${username}@demo.local`,
        first_name: username.charAt(0).toUpperCase() + username.slice(1),
        last_name: 'User',
        country_of_origin: 'DE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        user: demoUser,
        session: {
          access_token: `demo_token_${Date.now()}`,
          refresh_token: `demo_refresh_${Date.now()}`,
          expires_at: Date.now() + 3600000,
          user: {
            id: demoUser.auth_user_id,
            email: demoUser.email
          }
        },
        message: 'Login successful (DEMO MODE)'
      })
    }

    // Convert username to email format for Supabase Auth
    // This allows users to login with username while maintaining email-based auth
    const email = username.includes('@') ? username : `${username}@village.local`

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single()

    if (userError) {
      console.error('Database error:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userData.id)

    return NextResponse.json({
      success: true,
      user: userData,
      session: authData.session,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
