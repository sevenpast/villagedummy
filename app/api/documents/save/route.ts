import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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
    const { 
      userId, 
      fileName, 
      originalName, 
      fileType, 
      fileSize, 
      fileData, 
      documentType, 
      tags, 
      confidence, 
      description 
    } = await request.json();

    if (!userId || !fileName || !fileData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, fileName, fileData' 
      }, { status: 400 });
    }

    console.log(`💾 Saving document: ${originalName} for user ${userId}`);

    // Convert base64 file data to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');

    // Insert document into database
    const { data, error } = await supabase
      .from('documents_vault')
      .insert([{
        user_id: userId,
        file_name: fileName,
        original_name: originalName || fileName,
        file_type: fileType || 'application/octet-stream',
        file_size: fileSize || fileBuffer.length,
        file_data: fileBuffer,
        document_type: documentType || 'other',
        tags: tags || ['document'],
        confidence: confidence || 0.5,
        description: description || 'Document uploaded to vault'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save document to database'
      }, { status: 500 });
    }

    console.log('✅ Document successfully saved to database');

    return NextResponse.json({
      success: true,
      message: 'Document saved successfully',
      documentId: data.id
    });

  } catch (error) {
    console.error('Save document error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error saving document'
    }, { status: 500 });
  }
}
