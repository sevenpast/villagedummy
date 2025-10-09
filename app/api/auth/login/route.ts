import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Convert username to email format for Supabase
    const email = username.includes('@') ? username : `${username}@village.local`;

    console.log('🔧 Logging in user:', username);

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error.message);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Login successful:', userProfile.username);

    return NextResponse.json({
      success: true,
      user: userProfile,
      session: data.session,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}