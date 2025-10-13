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

    // Get user profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user task progress
    const { data: tasks } = await supabase
      .from('user_task_progress')
      .select('*')
      .eq('user_id', user.id);

    // Get privacy settings
    const { data: privacySettings } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Build export data
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        data_categories: ['personal_data', 'task_progress', 'privacy_settings'],
        legal_basis: 'consent',
        purpose: 'data_portability_request',
        retention_period: '30_days'
      },
      user_profile: profile,
      task_progress: tasks || [],
      privacy_settings: privacySettings || {
        data_processing_consent: true,
        email_marketing_consent: false,
        analytics_consent: true,
        document_processing_consent: true,
        ai_processing_consent: true,
        data_sharing_consent: false,
        automated_decision_making_consent: false,
        profiling_consent: false,
        third_party_data_sharing: false,
        data_retention_consent: true
      }
    };

    return NextResponse.json({
      success: true,
      request_id: `export-${Date.now()}`,
      status: 'ready',
      message: 'Data export completed successfully - ready for download!',
      instant_download: true,
      data_preview: {
        export_info: exportData.export_info,
        data_categories: Object.keys(exportData).filter(key => key !== 'export_info'),
        total_size_bytes: JSON.stringify(exportData).length
      },
      download_data: exportData
    });

  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
