import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is not configured in environment variables.');
    return NextResponse.json({
      success: false,
      error: 'Datenbankverbindung ist nicht konfiguriert. Bitte überprüfen Sie die Server-Einstellungen.',
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId parameter' 
      }, { status: 400 });
    }

    console.log(`📁 Loading documents for user: ${userId}`);

    // Handle non-UUID user IDs (like 'default')
    let query = supabase
      .from('documents')
      .select('id, file_name, file_type, file_size, document_type, uploaded_at')
      .order('uploaded_at', { ascending: false });
    
    // Only filter by user_id if it's a valid UUID, otherwise get all documents
    if (userId && userId !== 'default' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to load documents from database'
      }, { status: 500 });
    }

    console.log(`✅ Loaded ${data?.length || 0} documents for user ${userId}`);

    return NextResponse.json({
      success: true,
      documents: data || []
    });

  } catch (error) {
    console.error('Load documents error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error loading documents'
    }, { status: 500 });
  }
}
