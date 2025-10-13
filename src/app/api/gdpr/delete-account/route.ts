import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deletion_reason, deletion_type = 'full_deletion' } = await request.json();

    // Validate deletion type
    if (!['full_deletion', 'anonymization'].includes(deletion_type)) {
      return NextResponse.json({ 
        error: 'Invalid deletion type',
        valid_types: ['full_deletion', 'anonymization']
      }, { status: 400 });
    }

    // Check for existing deletion request
    const { data: existingRequest } = await supabase
      .from('account_deletion_requests')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'verified', 'processing'])
      .single();

    if (existingRequest) {
      return NextResponse.json({
        error: 'Deletion request already exists',
        request_id: existingRequest.id,
        status: existingRequest.status,
        created_at: existingRequest.created_at
      }, { status: 409 });
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Create deletion request
    const { data: deletionRequest, error: createError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        deletion_reason,
        deletion_type,
        verification_token: verificationToken,
        verification_expires_at: verificationExpiresAt,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating deletion request:', createError);
      return NextResponse.json({ error: 'Failed to create deletion request' }, { status: 500 });
    }

    // Send verification email (in real implementation)
    // For now, we'll return the token for testing
    console.log('Verification token for testing:', verificationToken);

    return NextResponse.json({
      success: true,
      request_id: deletionRequest.id,
      status: 'pending',
      message: 'Account deletion request created. Please check your email for verification.',
      verification_required: true,
      expires_at: verificationExpiresAt,
      // Remove this in production - only for testing
      verification_token: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });

  } catch (error) {
    console.error('Delete Account API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's deletion requests
    const { data: deletionRequests, error } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deletion requests:', error);
      return NextResponse.json({ error: 'Failed to fetch deletion requests' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletion_requests: deletionRequests
    });

  } catch (error) {
    console.error('Delete Account GET API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
