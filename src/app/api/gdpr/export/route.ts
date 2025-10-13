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

    const { requested_data_types, file_format = 'json' } = await request.json();

    // Validate requested data types
    const validDataTypes = ['profile', 'documents', 'tasks', 'emails', 'consents', 'settings', 'logs'];
    const invalidTypes = requested_data_types?.filter((type: string) => !validDataTypes.includes(type));
    
    if (invalidTypes && invalidTypes.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid data types requested',
        invalid_types: invalidTypes,
        valid_types: validDataTypes
      }, { status: 400 });
    }

    // Check for existing pending/processing requests
    const { data: existingRequest } = await supabase
      .from('data_export_requests')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .single();

    if (existingRequest) {
      return NextResponse.json({
        error: 'Export request already in progress',
        request_id: existingRequest.id,
        status: existingRequest.status,
        created_at: existingRequest.created_at
      }, { status: 409 });
    }

    // Create new export request
    const { data: exportRequest, error: createError } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: user.id,
        requested_data_types: requested_data_types || validDataTypes,
        file_format,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating export request:', createError);
      return NextResponse.json({ error: 'Failed to create export request' }, { status: 500 });
    }

    // Trigger background processing (in real implementation, this would be a queue job)
    // For now, we'll process immediately
    try {
      // Call the database function to get all user data
      const { data: userData, error: dataError } = await supabase
        .rpc('get_all_user_data', { user_uuid: user.id });

      if (dataError) {
        console.error('Error fetching user data:', dataError);
        
        // Update request status to failed
        await supabase
          .from('data_export_requests')
          .update({ 
            status: 'failed',
            error_message: dataError.message,
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', exportRequest.id);

        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
      }

      // Update request status to ready
      const { error: updateError } = await supabase
        .from('data_export_requests')
        .update({
          status: 'ready',
          processing_completed_at: new Date().toISOString(),
          file_size_bytes: JSON.stringify(userData).length
        })
        .eq('id', exportRequest.id);

      if (updateError) {
        console.error('Error updating export request:', updateError);
      }

      // In a real implementation, you would:
      // 1. Store the file in Supabase Storage
      // 2. Generate a secure download link
      // 3. Send email notification to user
      
      return NextResponse.json({
        success: true,
        request_id: exportRequest.id,
        status: 'ready',
        message: 'Data export completed successfully - ready for download!',
        instant_download: true,
        data_preview: {
          export_info: userData.export_info,
          data_categories: Object.keys(userData).filter(key => key !== 'export_info'),
          total_size_bytes: JSON.stringify(userData).length
        },
        download_data: userData // Include the actual data for immediate download
      });

    } catch (processingError) {
      console.error('Error processing export:', processingError);
      
      // Update request status to failed
      await supabase
        .from('data_export_requests')
        .update({ 
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Unknown error',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', exportRequest.id);

      return NextResponse.json({ error: 'Failed to process export request' }, { status: 500 });
    }

  } catch (error) {
    console.error('Export API Error:', error);
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

    // Get user's export requests
    const { data: exportRequests, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching export requests:', error);
      return NextResponse.json({ error: 'Failed to fetch export requests' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      export_requests: exportRequests
    });

  } catch (error) {
    console.error('Export GET API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
