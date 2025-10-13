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

    // Try to get privacy settings
    let privacySettings = null;
    try {
      const { data: settings } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      privacySettings = settings;
    } catch (error) {
      privacySettings = {
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
      };
    }

    // Create human-readable text report
    const readableReport = generateReadableReport({
      user,
      profile,
      tasks,
      privacySettings
    });

    return NextResponse.json({
      success: true,
      request_id: `export-${Date.now()}`,
      status: 'ready',
      message: 'Data export completed successfully - ready for download!',
      instant_download: true,
      file_format: 'txt',
      data_preview: {
        total_size_bytes: readableReport.length,
        sections: ['Personal Information', 'Task Progress', 'Privacy Settings', 'Account Information']
      },
      download_data: readableReport
    });

  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateReadableReport({ user, profile, tasks, privacySettings }: any) {
  const now = new Date().toLocaleString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich'
  });

  let report = '';
  
  // Header
  report += '='.repeat(80) + '\n';
  report += '                    MY DATA - EXPAT VILLAGE                        \n';
  report += '='.repeat(80) + '\n';
  report += `Exported on: ${now}\n`;
  report += `Your Email: ${user.email}\n`;
  report += `User ID: ${user.id}\n`;
  report += '\n';
  report += 'This file contains all data we have stored about you.\n';
  report += 'You have the right to receive this data (GDPR Article 20).\n';
  report += '\n';

  // Personal Information
  report += 'PERSONAL INFORMATION\n';
  report += '-'.repeat(50) + '\n';
  if (profile) {
    report += `Name: ${profile.first_name || 'Not provided'} ${profile.last_name || 'Not provided'}\n`;
    report += `Email: ${profile.email || 'Not provided'}\n`;
    report += `Phone: ${profile.phone || 'Not provided'}\n`;
    report += `Gender: ${profile.gender || 'Not provided'}\n`;
    report += `Date of Birth: ${profile.date_of_birth || 'Not provided'}\n`;
    report += `Country of Origin: ${profile.country_of_origin || 'Not provided'}\n`;
    report += `Last Residence Country: ${profile.last_residence_country || 'Not provided'}\n`;
    report += `Living Situation: ${profile.living_with || 'Not provided'}\n`;
    report += `Family Status: ${profile.family_status || 'Not provided'}\n`;
    report += `Arrival Date: ${profile.arrival_date || 'Not provided'}\n`;
    report += `Work Permit Type: ${profile.work_permit_type || 'Not provided'}\n`;
    report += `Language Preference: ${profile.language_preference || 'Not provided'}\n`;
    report += `Has Children: ${profile.has_children ? 'Yes' : 'No'}\n`;
    if (profile.children_ages) {
      report += `Children Ages: ${profile.children_ages}\n`;
    }
    report += `Postal Code: ${profile.postal_code || 'Not provided'}\n`;
    report += `Municipality: ${profile.municipality || 'Not provided'}\n`;
    report += `Canton: ${profile.canton || 'Not provided'}\n`;
    report += `Home Address: ${profile.home_address || 'Not provided'}\n`;
    report += `Work Address: ${profile.work_address || 'Not provided'}\n`;
    report += `About Me: ${profile.about_me || 'Not provided'}\n`;
    report += `Interests: ${profile.interests || 'Not provided'}\n`;
    report += `Current Situation: ${profile.current_situation || 'Not provided'}\n`;
    report += `Profile Created: ${profile.created_at ? new Date(profile.created_at).toLocaleString('en-US') : 'Not available'}\n`;
    report += `Last Updated: ${profile.updated_at ? new Date(profile.updated_at).toLocaleString('en-US') : 'Not available'}\n`;
  } else {
    report += 'No profile data found.\n';
  }
  report += '\n';

  // Task Progress
  report += 'TASK PROGRESS\n';
  report += '-'.repeat(50) + '\n';
  if (tasks && tasks.length > 0) {
    tasks.forEach((task: any, index: number) => {
      report += `${index + 1}. Task: ${task.task_id || 'Unknown'}\n`;
      report += `   Status: ${task.status || 'Unknown'}\n`;
      report += `   Completed: ${task.completed_at ? new Date(task.completed_at).toLocaleString('en-US') : 'Not completed'}\n`;
      if (task.notes) {
        report += `   Notes: ${task.notes}\n`;
      }
      report += '\n';
    });
  } else {
    report += 'No tasks found.\n';
  }
  report += '\n';

  // Privacy Settings
  report += 'PRIVACY SETTINGS\n';
  report += '-'.repeat(50) + '\n';
  if (privacySettings) {
    report += `Data Processing: ${privacySettings.data_processing_consent ? 'Consented' : 'Not consented'}\n`;
    report += `Email Marketing: ${privacySettings.email_marketing_consent ? 'Consented' : 'Not consented'}\n`;
    report += `Analytics: ${privacySettings.analytics_consent ? 'Consented' : 'Not consented'}\n`;
    report += `Document Processing: ${privacySettings.document_processing_consent ? 'Consented' : 'Not consented'}\n`;
    report += `AI Processing: ${privacySettings.ai_processing_consent ? 'Consented' : 'Not consented'}\n`;
    report += `Data Sharing: ${privacySettings.data_sharing_consent ? 'Consented' : 'Not consented'}\n`;
    report += `Automated Decision Making: ${privacySettings.automated_decision_making_consent ? 'Consented' : 'Not consented'}\n`;
    report += `Profiling: ${privacySettings.profiling_consent ? 'Consented' : 'Not consented'}\n`;
    report += `Third Party Data Sharing: ${privacySettings.third_party_data_sharing ? 'Consented' : 'Not consented'}\n`;
    report += `Data Retention: ${privacySettings.data_retention_consent ? 'Consented' : 'Not consented'}\n`;
  } else {
    report += 'Default privacy settings used.\n';
  }
  report += '\n';

  // Account Information
  report += 'ACCOUNT INFORMATION\n';
  report += '-'.repeat(50) + '\n';
  report += `Account Created: ${user.created_at ? new Date(user.created_at).toLocaleString('en-US') : 'Not available'}\n`;
  report += `Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-US') : 'Not available'}\n`;
  report += `Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}\n`;
  report += `Phone Confirmed: ${user.phone_confirmed_at ? 'Yes' : 'No'}\n`;
  report += '\n';

  // Footer
  report += '='.repeat(80) + '\n';
  report += 'PRIVACY NOTICES\n';
  report += '='.repeat(80) + '\n';
  report += '• This data was exported according to GDPR Article 20 (Right to Data Portability)\n';
  report += '• You have the right to receive, correct, or delete this data\n';
  report += '• For questions, contact: privacy@expatvillage.ch\n';
  report += '• This file contains sensitive information - please store securely\n';
  report += '• Export created on: ' + now + '\n';
  report += '='.repeat(80) + '\n';

  return report;
}
