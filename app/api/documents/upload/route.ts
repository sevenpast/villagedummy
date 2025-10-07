import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Document upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const documentType = formData.get('documentType') as string;
    const tags = formData.get('tags') as string;
    const confidence = formData.get('confidence') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate unique filename with safe characters
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    
    // Clean filename: remove special characters and spaces
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')  // Replace special chars with underscore
      .replace(/_+/g, '_')              // Replace multiple underscores with single
      .replace(/^_|_$/g, '');           // Remove leading/trailing underscores
    
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    
    // Clean userId for storage path
    const cleanUserId = userId.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${cleanUserId}/${uniqueFileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // Use provided document type or run hybrid OCR + AI analysis
    let finalDocumentType = documentType;
    let finalTags = ['unrecognized'];
    let finalConfidence = 0.5;
    let finalDescription = '';
    let finalLanguage = 'DE';
    let finalIsSwissDocument = true;
    let finalExtractedText = '';
    
    if (!finalDocumentType) {
      try {
        // Call enhanced hybrid OCR + AI analysis API
        const analysisFormData = new FormData();
        analysisFormData.append('file', file);
        analysisFormData.append('userId', userId);
        analysisFormData.append('method', 'auto'); // Use auto method to try all approaches

        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/enhanced-hybrid-analysis`, {
          method: 'POST',
          body: analysisFormData,
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (analysisData.success && analysisData.analysis) {
            const analysis = analysisData.analysis;
            finalDocumentType = analysis.documentType;
            finalTags = analysis.tags || [];
            finalConfidence = analysis.confidence || 0.5;
            finalDescription = analysis.description || '';
            finalLanguage = analysis.language || 'DE';
            finalIsSwissDocument = analysis.isSwissDocument || true;
            finalExtractedText = analysis.extractedText || '';
            
            console.log(`✅ Hybrid OCR + AI Analysis completed: ${finalDocumentType} (confidence: ${finalConfidence})`);
            console.log(`🏷️ Tags: ${finalTags.join(', ')}`);
            console.log(`📝 Description: ${finalDescription}`);
          }
        } else {
          throw new Error('Hybrid analysis failed');
        }
      } catch (error) {
        console.log('⚠️ Hybrid analysis error, using fallback detection:', error);
        
        // Fallback to enhanced filename-based detection
        const fileName = file.name.toLowerCase();
        console.log(`🔍 Fallback filename analysis: ${fileName}`);
        
        if (fileName.includes('passport') || fileName.includes('pass') || fileName.includes('reisepass')) {
          finalDocumentType = 'Reisepass/ID';
          finalTags = ['passport', 'identity', 'travel'];
          finalConfidence = 0.8;
        } else if (fileName.includes('id') || fileName.includes('identity') || fileName.includes('ausweis')) {
          finalDocumentType = 'Reisepass/ID';
          finalTags = ['id', 'identity'];
          finalConfidence = 0.8;
        } else if (fileName.includes('cv') || fileName.includes('resume') || fileName.includes('lebenslauf')) {
          finalDocumentType = 'Diplome & Zertifikate';
          finalTags = ['cv', 'resume', 'career'];
          finalConfidence = 0.8;
        } else if (fileName.includes('diploma') || fileName.includes('degree') || fileName.includes('zeugnis') || fileName.includes('zertifikat') || fileName.includes('schuldiplom')) {
          finalDocumentType = 'Diplome & Zertifikate';
          finalTags = ['education', 'certificate', 'diploma'];
          finalConfidence = 0.8;
        } else if (fileName.includes('contract') || fileName.includes('employment') || fileName.includes('arbeitsvertrag')) {
          finalDocumentType = 'Arbeitsvertrag';
          finalTags = ['employment', 'contract', 'work'];
          finalConfidence = 0.8;
        } else if (fileName.includes('rental') || fileName.includes('miete') || fileName.includes('wohnung')) {
          finalDocumentType = 'Mietvertrag';
          finalTags = ['rental', 'housing', 'contract'];
          finalConfidence = 0.8;
        } else if (fileName.includes('birth') || fileName.includes('geburt') || fileName.includes('geburtsurkunde')) {
          finalDocumentType = 'Geburtsurkunde';
          finalTags = ['birth', 'certificate', 'personal'];
          finalConfidence = 0.8;
        } else if (fileName.includes('marriage') || fileName.includes('heirat') || fileName.includes('heiratsurkunde')) {
          finalDocumentType = 'Heiratsurkunde';
          finalTags = ['marriage', 'certificate', 'personal'];
          finalConfidence = 0.8;
        } else if (fileName.includes('insurance') || fileName.includes('versicherung')) {
          finalDocumentType = 'Versicherungsunterlagen';
          finalTags = ['insurance', 'health', 'coverage'];
          finalConfidence = 0.8;
        } else if (fileName.includes('salary') || fileName.includes('lohn') || fileName.includes('gehalt')) {
          finalDocumentType = 'Lohnabrechnung';
          finalTags = ['payroll', 'salary', 'employment'];
          finalConfidence = 0.8;
        } else if (fileName.includes('invoice') || fileName.includes('rechnung') || fileName.includes('bill')) {
          finalDocumentType = 'Rechnungen';
          finalTags = ['invoice', 'billing', 'payment'];
          finalConfidence = 0.8;
        } else if (fileName.includes('bank') || fileName.includes('konto') || fileName.includes('account')) {
          finalDocumentType = 'Bankdokumente';
          finalTags = ['banking', 'financial', 'account'];
          finalConfidence = 0.8;
        } else if (fileName.includes('tax') || fileName.includes('steuer') || fileName.includes('fiscal')) {
          finalDocumentType = 'Steuerdokumente';
          finalTags = ['tax', 'fiscal', 'government'];
          finalConfidence = 0.8;
        } else if (fileName.includes('medical') || fileName.includes('medizin') || fileName.includes('health')) {
          finalDocumentType = 'Medizinische Dokumente';
          finalTags = ['medical', 'health', 'doctor'];
          finalConfidence = 0.8;
        } else if (fileName.includes('permit') || fileName.includes('bewilligung') || fileName.includes('visa')) {
          finalDocumentType = 'Aufenthaltsbewilligung';
          finalTags = ['residence', 'permit', 'immigration'];
          finalConfidence = 0.8;
        } else {
          finalDocumentType = 'Unbekanntes Dokument';
          finalTags = ['unrecognized'];
          finalConfidence = 0.3;
        }
        
        finalDescription = `Fallback filename analysis: ${finalDocumentType}`;
        finalExtractedText = `Filename: ${file.name}`;
        
        console.log(`✅ Fallback detection: ${finalDocumentType} (confidence: ${finalConfidence})`);
        console.log(`🏷️ Tags: ${finalTags.join(', ')}`);
      }
    }

    // Use tags and confidence from intelligent analysis or provided values
    let parsedTags = finalTags;
    let parsedConfidence = finalConfidence;
    
    try {
      if (tags) {
        parsedTags = JSON.parse(tags);
      }
      if (confidence) {
        parsedConfidence = parseFloat(confidence);
      }
    } catch (error) {
      console.warn('Failed to parse provided tags or confidence, using AI analysis results');
    }

    // Save document metadata to database with hybrid OCR + AI analysis results
    // Handle non-UUID user IDs by using null for user_id
    const insertData = {
      user_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ? userId : null,
      file_name: file.name,
      file_type: file.type || `application/${fileExtension}`,
      file_size: file.size,
      storage_path: storagePath,
      document_type: finalDocumentType,
      tags: parsedTags,
      confidence: parsedConfidence,
      description: finalDescription || `Hybrid OCR + AI analysis: ${finalDocumentType}`,
      language: finalLanguage,
      is_swiss_document: finalIsSwissDocument,
      extracted_text: finalExtractedText,
      uploaded_at: new Date().toISOString()
    };

    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
    }

    console.log(`✅ Document uploaded successfully: ${file.name}`);

    return NextResponse.json({
      success: true,
      document: {
        id: dbData.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType: documentType,
        uploadedAt: dbData.uploaded_at,
        storagePath: storagePath
      }
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}