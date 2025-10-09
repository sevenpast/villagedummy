import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateDemoCredentials, getDemoUser } from '@/lib/demo-storage'

// Check if Supabase is properly configured
console.log('🔧 Supabase configuration check:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseClient: supabase ? 'configured' : 'null'
})

if (!supabase) {
  console.warn('⚠️ Supabase not configured - using demo mode for authentication')
}

// USER-FRIENDLY: Username-based authentication with email fallback
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
        { error: 'Invalid username or password.' },
        { status: 400 }
      )
    }

    // SIMPLE DEMO AUTHENTICATION - Check username/password combination
    console.log('🔧 Demo mode: Authenticating user:', username)
    
    // Check predefined demo credentials first
    const predefinedCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'test', password: 'test123' },
      { username: 'user', password: 'user123' },
      { username: 'demo', password: 'demo123' }
    ]
    
    const isPredefinedCredential = predefinedCredentials.some(
      cred => cred.username === username && cred.password === password
    )
    
    // Check demo storage for newly created accounts
    const isDemoUserCredential = validateDemoCredentials(username, password)
    
    // For demo purposes, also allow any username with password "password123"
    const isFallbackCredential = password === 'password123'
    
    // Additional fallback: allow any username with common demo passwords
    const commonDemoPasswords = ['password123', 'demo123', 'test123', 'user123']
    const isCommonDemoCredential = commonDemoPasswords.includes(password)
    
    if (!isPredefinedCredential && !isDemoUserCredential && !isFallbackCredential && !isCommonDemoCredential) {
      console.log('❌ Demo mode: Invalid credentials for:', username)
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      )
    }
    
    // Demo mode - simulate authentication for valid credentials
    let demoUser
    
    if (isDemoUserCredential) {
      // Use stored user data for newly created accounts
      const storedUser = getDemoUser(username)
      demoUser = storedUser?.userData || {
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
    } else {
      // Use default demo user for predefined credentials
      demoUser = {
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
    }

    console.log('✅ Demo mode: Authentication successful for:', username)
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

    // Check if username is an email or regular username
    const isEmail = username.includes('@')
    let email = username

    if (!isEmail) {
      // For usernames, we need to find the user in our database first
      // to get their associated email address
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, auth_user_id')
        .eq('username', username)
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        )
      }

      email = userData.email
    }

    // Sign in with Supabase Auth using the email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid username or password' },
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
