import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name, country_of_origin, municipality, canton, postal_code, has_kids, num_children } = body

    // Validate required fields
    if (!email || !password || !first_name || !country_of_origin || !municipality || !canton || !postal_code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user profile in database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        email,
        first_name,
        last_name: last_name || null,
        country_of_origin,
        municipality,
        canton,
        postal_code,
        has_kids: has_kids || false,
        num_children: num_children || 0,
        onboarding_completed: false,
        is_verified: false,
        is_premium: false,
      })
      .select()
      .single()

    if (userError) {
      console.error('Database error:', userError)
      // If user creation in database fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
