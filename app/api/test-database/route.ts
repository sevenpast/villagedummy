import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database schema...');

    // Test if AI analysis columns exist by trying to select them
    const { data, error } = await supabase
      .from('documents')
      .select('id, file_name, document_type, tags, confidence, description, language, is_swiss_document, extracted_text')
      .limit(1);

    if (error) {
      console.log('❌ Database schema test failed:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        columns_exist: false
      });
    }

    console.log('✅ Database schema test passed - all AI analysis columns exist!');
    console.log('📊 Sample data:', data);

    return NextResponse.json({
      success: true,
      columns_exist: true,
      sample_data: data
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test database schema',
        columns_exist: false
      },
      { status: 500 }
    );
  }
}
