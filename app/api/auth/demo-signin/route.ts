import { NextRequest, NextResponse } from 'next/server'

// Demo version that simulates database authentication
// This will be replaced by real Supabase integration

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Simulate user lookup and authentication
    // In a real app, this would query the database
    const user = {
      id: `user_${Date.now()}`,
      auth_user_id: `auth_${Date.now()}`,
      email,
      first_name: email.split('@')[0].split('.')[0],
      last_name: email.split('@')[0].split('.').slice(1).join(' ') || '',
      country_of_origin: 'DE',
      municipality: 'Zurich',
      canton: 'ZH',
      postal_code: '8001',
      has_kids: false,
      num_children: 0,
      onboarding_completed: false,
      is_verified: false,
      is_premium: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      profile_completeness: {
        basic_info: true,
        country_info: true,
        family_info: true,
        location_info: true,
        completeness_percentage: 100
      }
    }

    // In a real app, this would verify password against database
    console.log('DEMO: User would be authenticated:', user)

    return NextResponse.json({
      success: true,
      user: user,
      session: {
        access_token: `demo_token_${Date.now()}`,
        refresh_token: `demo_refresh_${Date.now()}`,
        expires_at: Date.now() + 3600000, // 1 hour
        user: {
          id: user.auth_user_id,
          email: user.email
        }
      },
      message: 'Login successful (DEMO MODE)'
    })

  } catch (error) {
    console.error('Demo signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
