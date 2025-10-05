import { NextRequest, NextResponse } from 'next/server';
import { translateToEnglish, batchTranslateToEnglish } from '@/services/translation-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts } = body;

    if (texts && Array.isArray(texts)) {
      // Batch translation
      const translations = await batchTranslateToEnglish(texts);
      return NextResponse.json({ translations });
    } else if (text && typeof text === 'string') {
      // Single translation
      const translation = await translateToEnglish(text);
      return NextResponse.json({ translation });
    } else {
      return NextResponse.json(
        { error: 'Please provide either "text" (string) or "texts" (array)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}