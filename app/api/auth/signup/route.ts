import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      country_of_origin,
      gender,
      nationality,
      birth_place,
      german_skills,
      first_language,
      family_language,
      municipality,
      canton,
      postal_code,
      has_kids,
      num_children
    } = body;

    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields: username, email, password, first_name, and last_name' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already in use' },
        { status: 400 }
      );
    }

    console.log('🔧 Creating new user account:', { username, email, first_name, last_name });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Supabase auth error:', authError.message);
      
      // Handle specific Supabase auth errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email address is already registered' },
          { status: 400 }
        );
      } else if (authError.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to create account. Please try again.' },
          { status: 400 }
        );
      }
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user profile in public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        username,
        email,
        first_name,
        last_name,
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
        last_login_at: null
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Database profile creation error:', profileError.message);
      console.error('❌ Profile error details:', profileError);
      
      // Clean up auth user if profile creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }
      
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ User account created successfully:', userProfile.username);

    return NextResponse.json({
      success: true,
      user: userProfile,
      session: authData.session,
      message: 'Account created successfully! You can now sign in.'
    });

  } catch (error) {
    console.error('❌ Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}