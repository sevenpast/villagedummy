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

    // Get user's privacy settings
    const { data: privacySettings, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching privacy settings:', error);
      return NextResponse.json({ error: 'Failed to fetch privacy settings' }, { status: 500 });
    }

    // If no settings exist, return defaults
    if (!privacySettings) {
      return NextResponse.json({
        success: true,
        privacy_settings: {
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
        is_default: true
      });
    }

    return NextResponse.json({
      success: true,
      privacy_settings: privacySettings,
      is_default: false
    });

  } catch (error) {
    console.error('Privacy Settings GET API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Validate the updates
    const validSettings = [
      'data_processing_consent',
      'email_marketing_consent',
      'analytics_consent',
      'document_processing_consent',
      'ai_processing_consent',
      'data_sharing_consent',
      'automated_decision_making_consent',
      'profiling_consent',
      'third_party_data_sharing',
      'data_retention_consent'
    ];

    const invalidSettings = Object.keys(updates).filter(key => !validSettings.includes(key));
    if (invalidSettings.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid privacy settings',
        invalid_settings: invalidSettings,
        valid_settings: validSettings
      }, { status: 400 });
    }

    // Check if privacy settings exist
    const { data: existingSettings } = await supabase
      .from('privacy_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('privacy_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating privacy settings:', error);
        return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('privacy_settings')
        .insert({
          user_id: user.id,
          ...updates
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating privacy settings:', error);
        return NextResponse.json({ error: 'Failed to create privacy settings' }, { status: 500 });
      }

      result = data;
    }

    // Log the consent changes
    for (const [setting, value] of Object.entries(updates)) {
      await supabase
        .from('user_consents')
        .insert({
          user_id: user.id,
          consent_type: setting,
          consent_given: value as boolean,
          consent_method: 'explicit',
          consent_version: '1.0',
          legal_basis: 'consent',
          purpose: 'User privacy preference update',
          data_categories: ['preference_data'],
          retention_period: '7_years'
        });
    }

    return NextResponse.json({
      success: true,
      privacy_settings: result,
      message: 'Privacy settings updated successfully'
    });

  } catch (error) {
    console.error('Privacy Settings PATCH API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
