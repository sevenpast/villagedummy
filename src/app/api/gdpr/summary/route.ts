import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile summary
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    // Get document count (if table exists)
    let documentCount = 0;
    try {
      const { count } = await supabase
        .from('uploaded_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      documentCount = count || 0;
    } catch (error) {
      // Table doesn't exist yet, set to 0
      documentCount = 0;
    }

    // Get task progress count
    const { count: taskCount } = await supabase
      .from('user_task_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get consent count
    const { count: consentCount } = await supabase
      .from('user_consents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get access log count (last 30 days) - if table exists
    let accessLogCount = 0;
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('document_access_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo);
      accessLogCount = count || 0;
    } catch (error) {
      // Table doesn't exist yet, set to 0
      accessLogCount = 0;
    }

    // Get privacy settings
    const { data: privacySettings } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get active export requests
    const { data: activeExports } = await supabase
      .from('data_export_requests')
      .select('id, status, created_at, expires_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing', 'ready']);

    // Get active deletion requests
    const { data: activeDeletions } = await supabase
      .from('account_deletion_requests')
      .select('id, status, deletion_type, created_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'verified', 'processing']);

    // Get data processing activities (public information)
    const { data: processingActivities } = await supabase
      .from('data_processing_activities')
      .select('activity_name, purpose, legal_basis, data_categories, retention_period')
      .order('activity_name');

    // Calculate data categories
    const dataCategories = new Set<string>();
    if (profile) dataCategories.add('personal_data');
    if (documentCount && documentCount > 0) {
      dataCategories.add('document_data');
      dataCategories.add('biometric_data'); // If documents contain photos
    }
    if (taskCount && taskCount > 0) dataCategories.add('task_progress_data');
    if (consentCount && consentCount > 0) dataCategories.add('consent_data');
    if (accessLogCount && accessLogCount > 0) dataCategories.add('access_log_data');

    // Calculate storage size estimate (rough)
    const estimatedStorageBytes = 
      (profile ? JSON.stringify(profile).length : 0) +
      (documentCount ? documentCount * 2 * 1024 * 1024 : 0) + // Assume 2MB per document
      (taskCount ? taskCount * 500 : 0) + // Assume 500 bytes per task record
      (consentCount ? consentCount * 300 : 0) + // Assume 300 bytes per consent record
      (accessLogCount ? accessLogCount * 200 : 0); // Assume 200 bytes per log entry

    const summary = {
      user_info: {
        user_id: user.id,
        name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        email: profile?.email || user.email,
        account_created: profile?.created_at || user.created_at,
        last_updated: profile?.updated_at
      },
      data_summary: {
        total_documents: documentCount || 0,
        total_tasks: taskCount || 0,
        total_consents: consentCount || 0,
        recent_access_logs: accessLogCount || 0,
        data_categories: Array.from(dataCategories),
        estimated_storage_bytes: estimatedStorageBytes,
        estimated_storage_mb: Math.round(estimatedStorageBytes / (1024 * 1024) * 100) / 100
      },
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
      },
      active_requests: {
        export_requests: activeExports || [],
        deletion_requests: activeDeletions || []
      },
      data_processing_activities: processingActivities || [],
      gdpr_rights: {
        right_to_access: {
          description: 'You can request a copy of all your personal data',
          available: true,
          endpoint: '/api/gdpr/export'
        },
        right_to_rectification: {
          description: 'You can correct inaccurate personal data',
          available: true,
          endpoint: '/profile'
        },
        right_to_erasure: {
          description: 'You can request deletion of your personal data',
          available: true,
          endpoint: '/api/gdpr/delete-account'
        },
        right_to_portability: {
          description: 'You can receive your data in a structured format',
          available: true,
          endpoint: '/api/gdpr/export'
        },
        right_to_object: {
          description: 'You can object to certain types of data processing',
          available: true,
          endpoint: '/api/gdpr/settings'
        },
        right_to_restrict_processing: {
          description: 'You can request restriction of data processing',
          available: true,
          endpoint: '/api/gdpr/settings'
        }
      },
      contact_info: {
        data_protection_officer: 'privacy@village.ch',
        support_email: 'support@village.ch',
        postal_address: 'Village AG, Data Protection, Switzerland'
      }
    };

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('GDPR Summary API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
