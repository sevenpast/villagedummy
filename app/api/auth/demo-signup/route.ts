import { NextRequest, NextResponse } from 'next/server'

// Demo version that simulates database storage
// This will be replaced by real Supabase integration

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, password, first_name, last_name, country_of_origin, 
      gender, nationality, birth_place, german_skills, first_language, family_language,
      municipality, canton, postal_code, has_kids, num_children 
    } = body

    // Validate required fields - only email, password and first_name are required
    if (!email || !password || !first_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, and name' },
        { status: 400 }
      )
    }

    // Simulate database storage
    const user = {
      id: `user_${Date.now()}`,
      auth_user_id: `auth_${Date.now()}`,
      email,
      first_name,
      last_name: last_name || null,
      country_of_origin: country_of_origin || '',
      gender: gender || '',
      nationality: nationality || '',
      birth_place: birth_place || '',
      german_skills: german_skills || '',
      first_language: first_language || '',
      family_language: family_language || '',
      municipality: municipality || '',
      canton: canton || '',
      postal_code: postal_code || '',
      has_kids: has_kids || false,
      num_children: num_children || 0,
      onboarding_completed: false,
      is_verified: false,
      is_premium: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: null,
      profile_completeness: {
        basic_info: true,
        country_info: !!country_of_origin,
        family_info: true,
        location_info: !!(municipality && canton && postal_code),
        completeness_percentage: 100
      }
    }

    // In a real app, this would be saved to database
    console.log('DEMO: User would be saved to database:', user)

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
      message: 'User created successfully (DEMO MODE)'
    })

  } catch (error) {
    console.error('Demo signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
