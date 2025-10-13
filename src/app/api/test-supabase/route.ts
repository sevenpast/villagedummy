import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing',
          SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'Set' : 'Missing'
        }
      }, { status: 500 })
    }

    // Create a simple Supabase client (without cookies)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test basic connection
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'Supabase connection test successful',
      data: {
        connection: 'OK',
        profilesCount: data ? 'Accessible' : 'Not accessible',
        error: error?.message || null
      }
    })

  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
