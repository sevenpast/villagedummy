
import { NextRequest, NextResponse } from 'next/server';
import { documentAnalysisService } from '../../../../services/document-analysis-service';
import { fromBuffer } from 'pdf2pic';
import path from 'path';
import fs from 'fs/promises';

// Temporary directory for file operations
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Ensure temp directory exists
const ensureTempDir = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Could not create temp directory', error);
  }
};

export async function POST(request: NextRequest) {
  await ensureTempDir();
  let file: File | null = null;

  try {
    console.log('🚀 V2 API Route: Received document analysis request.');

    const formData = await request.formData();
    file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 File received: ${file.name} (${file.type})`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let imageBuffer: Buffer;

    // Check if the file is a PDF or an image
    if (file.type === 'application/pdf') {
      console.log('📄 PDF detected. Converting first page to image...');
      
      const options = {
        density: 300,
        format: 'png',
        width: 2000,
        height: 2800,
        savePath: TEMP_DIR,
      };

      // pdf2pic can be tricky with buffers, so we write to a temp file
      const tempFilePath = path.join(TEMP_DIR, `${Date.now()}_${file.name}`);
      await fs.writeFile(tempFilePath, fileBuffer);

      const convert = fromBuffer(fileBuffer, options);
      const pageToConvert = 1;
      const result = await convert(pageToConvert, { responseType: 'buffer' });

      if (!result || !result.buffer) {
        throw new Error('PDF to image conversion failed to return a buffer.');
      }
      
      imageBuffer = result.buffer as Buffer;
      console.log('✅ PDF page 1 converted to image buffer.');

      // Clean up temp file
      await fs.unlink(tempFilePath).catch(err => console.error('Failed to delete temp PDF file', err));

    } else if (file.type.startsWith('image/')) {
      console.log('🖼️ Image detected. Using buffer directly.');
      imageBuffer = fileBuffer;
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    // Step 3: Send to the unified analysis service
    const analysisResult = await documentAnalysisService.analyze(
      imageBuffer,
      file.name
    );

    // Step 4: Return the final result
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });

  } catch (error) {
    console.error('❌ V2 analysis route failed:', error);
    return NextResponse.json(
      { error: 'Document analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
