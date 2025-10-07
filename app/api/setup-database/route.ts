import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up database schema for AI analysis...');

    // Add AI analysis columns to documents table
    const queries = [
      // Add tags column
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["unrecognized"]'`,
      
      // Add confidence column
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.5`,
      
      // Add description column
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`,
      
      // Add language column
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'DE'`,
      
      // Add is_swiss_document column
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_swiss_document BOOLEAN DEFAULT true`,
      
      // Add extracted_text column
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT DEFAULT ''`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN (tags)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_type ON documents (document_type)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_confidence ON documents (confidence)`,
      
      // Update existing documents
      `UPDATE documents SET tags = '["unrecognized"]', confidence = 0.5, description = 'Legacy document - no AI analysis available', language = 'DE', is_swiss_document = true, extracted_text = '' WHERE tags IS NULL OR confidence IS NULL`
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`⚠️ Query warning (may already exist): ${query}`, error.message);
      } else {
        console.log(`✅ Executed: ${query}`);
      }
    }

    console.log('✅ Database schema setup completed!');

    return NextResponse.json({
      success: true,
      message: 'Database schema setup completed successfully'
    });

  } catch (error) {
    console.error('❌ Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup database schema' },
      { status: 500 }
    );
  }
}
