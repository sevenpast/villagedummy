import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verification_token, confirmation = false } = await request.json();

    if (!verification_token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Find the deletion request
    const { data: deletionRequest, error: fetchError } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_token', verification_token)
      .eq('status', 'pending')
      .single();

    if (fetchError || !deletionRequest) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 });
    }

    // Check if token is expired
    if (new Date() > new Date(deletionRequest.verification_expires_at)) {
      return NextResponse.json({ 
        error: 'Verification token has expired' 
      }, { status: 400 });
    }

    if (!confirmation) {
      // Return deletion request details for user confirmation
      return NextResponse.json({
        success: true,
        request_id: deletionRequest.id,
        deletion_type: deletionRequest.deletion_type,
        deletion_reason: deletionRequest.deletion_reason,
        created_at: deletionRequest.created_at,
        message: 'Please confirm the account deletion by setting confirmation=true'
      });
    }

    // User has confirmed - proceed with deletion
    try {
      // Update status to verified
      const { error: updateError } = await supabase
        .from('account_deletion_requests')
        .update({ 
          status: 'verified',
          processing_started_at: new Date().toISOString()
        })
        .eq('id', deletionRequest.id);

      if (updateError) {
        console.error('Error updating deletion request:', updateError);
        return NextResponse.json({ error: 'Failed to update deletion request' }, { status: 500 });
      }

      // Call the database function to delete/anonymize user data
      const { data: deletionResult, error: deletionError } = await supabase
        .rpc('soft_delete_user_data', { 
          user_uuid: user.id,
          deletion_type: deletionRequest.deletion_type
        });

      if (deletionError) {
        console.error('Error deleting user data:', deletionError);
        
        // Update request status to failed
        await supabase
          .from('account_deletion_requests')
          .update({ 
            status: 'failed',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', deletionRequest.id);

        return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 });
      }

      // Update request status to completed
      const { error: finalUpdateError } = await supabase
        .from('account_deletion_requests')
        .update({ 
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', deletionRequest.id);

      if (finalUpdateError) {
        console.error('Error updating final deletion status:', finalUpdateError);
      }

      // If full deletion, also delete the auth user
      if (deletionRequest.deletion_type === 'full_deletion') {
        // Note: In Supabase, you typically can't delete auth users via API
        // This would need to be done via Supabase Admin API or manually
        console.log('User data deleted. Auth user deletion requires admin action.');
      }

      return NextResponse.json({
        success: true,
        request_id: deletionRequest.id,
        status: 'completed',
        deletion_type: deletionRequest.deletion_type,
        message: 'Account deletion completed successfully',
        deletion_result: deletionResult
      });

    } catch (processingError) {
      console.error('Error processing deletion:', processingError);
      
      // Update request status to failed
      await supabase
        .from('account_deletion_requests')
        .update({ 
          status: 'failed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', deletionRequest.id);

      return NextResponse.json({ error: 'Failed to process account deletion' }, { status: 500 });
    }

  } catch (error) {
    console.error('Verify Deletion API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
