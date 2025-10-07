import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    console.log('📦 Temporary ZIP Download API called (fallback mode)');
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create a temporary ZIP with a message file
    const zip = new JSZip();
    
    // Add a README file explaining the situation
    const readmeContent = `# Document Vault - Temporary Mode

## Status: Database Configuration Required

The ZIP download functionality is currently in temporary mode because the Supabase database permissions need to be configured.

## What you need to do:

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Run the following SQL commands:

\`\`\`sql
-- Grant permissions to service_role for the public schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Specifically grant permissions on the documents table
GRANT ALL ON public.documents TO service_role;
GRANT USAGE ON SEQUENCE documents_id_seq TO service_role;
\`\`\`

4. Restart your development server: npm run dev

## After configuration:
- Upload documents will be stored in the database
- ZIP download will include all your actual documents
- Full functionality will be restored

---
Generated on: ${new Date().toISOString()}
User ID: ${userId}
`;

    zip.file('README_DATABASE_SETUP.txt', readmeContent);
    
    // Add a sample document structure
    const sampleDoc = `# Sample Document Structure

This is how your documents will be organized once the database is configured:

documents/
├── passport_2024.pdf
├── work_contract.pdf
├── rental_agreement.pdf
└── insurance_certificate.pdf

Each document will be properly named and organized by type.
`;

    zip.file('sample_document_structure.txt', sampleDoc);

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Return the ZIP file as a Blob
    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="database_setup_instructions_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });

  } catch (error) {
    console.error('❌ Temporary ZIP download failed:', error);
    return NextResponse.json({
      error: 'Failed to generate temporary ZIP file',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
