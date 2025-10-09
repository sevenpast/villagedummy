import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tags = searchParams.get('tags');
    const documentType = searchParams.get('documentType');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Filtering documents by tags:', { userId, tags, documentType, sortBy, sortOrder });

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    // Filter by document type
    if (documentType && documentType !== 'all') {
      query = query.eq('document_type', documentType);
    }

    // Filter by tags (if provided)
    if (tags && tags !== 'all') {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.contains('tags', tagArray);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: documents, error } = await query;

    if (error) {
      console.error('❌ Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Get unique document types and tags for filter options
    const documentTypes = [...new Set(documents?.map(doc => doc.document_type).filter(Boolean) || [])];
    const allTags = [...new Set(documents?.flatMap(doc => doc.tags || []) || [])];

    console.log('✅ Filtered documents:', documents?.length || 0);

    return NextResponse.json({
      success: true,
      documents: documents || [],
      filterOptions: {
        documentTypes: ['all', ...documentTypes],
        tags: ['all', ...allTags]
      },
      total: documents?.length || 0
    });

  } catch (error) {
    console.error('❌ Filter documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
