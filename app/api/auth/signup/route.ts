import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username, email, password, first_name, last_name,
      country_of_origin, gender, nationality, birth_place,
      german_skills, first_language, family_language,
      has_kids, num_children, municipality, canton, postal_code
    } = body;

    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Username, email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    console.log('🔧 Creating user:', { username, email, first_name, last_name });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return NextResponse.json(
        { error: 'Failed to create account. Email might already be in use.' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile with all fields
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        username,
        email,
        first_name,
        last_name,
        country_of_origin: country_of_origin || null,
        gender: gender || null,
        nationality: nationality || null,
        birth_place: birth_place || null,
        german_skills: german_skills || null,
        first_language: first_language || null,
        family_language: family_language || null,
        has_kids: has_kids || false,
        num_children: has_kids ? (num_children || 0) : 0,
        municipality: municipality || null,
        canton: canton || null,
        postal_code: postal_code || null,
        onboarding_completed: false,
        is_verified: false,
        is_premium: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    console.log('✅ User created successfully:', userProfile.username);

    return NextResponse.json({
      success: true,
      user: userProfile,
      session: authData.session,
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}