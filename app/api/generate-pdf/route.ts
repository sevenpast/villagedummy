import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface FormField {
  label: string;
  key: string;
  value: string | boolean;
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea';
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface TranslatedText {
  originalText: string;
  translatedText: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { originalPdfBase64, translatedTexts, formFields } = await request.json();

    if (!originalPdfBase64 || !translatedTexts || !formFields) {
      return NextResponse.json({ success: false, error: 'Missing data for PDF generation.' }, { status: 400 });
    }

    console.log(`📄 Generating PDF with ${translatedTexts.length} translations and ${formFields.length} fields`);

    const pdfDoc = await PDFDocument.load(Buffer.from(originalPdfBase64, 'base64'));
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // This logic assumes coordinates are global across all pages.
    // The analysis API provides them in this way.
    let cumulativeHeight = 0;
    for (let i = pages.length - 1; i >= 0; i--) {
        cumulativeHeight += pages[i].getHeight();
    }


    pages.forEach((page, pageIndex) => {
        const { height: pageHeight } = page.getSize();
        
        let pageBottomY = 0;
        for(let i = pageIndex + 1; i < pages.length; i++) {
            pageBottomY += pages[i].getHeight();
        }
        const pageTopY = pageBottomY + pageHeight;

        // 1. Overlay original text with white boxes and draw translated text
        translatedTexts.forEach((text: TranslatedText) => {
          if (text.coordinates && text.coordinates.y >= pageBottomY && text.coordinates.y < pageTopY) {
            const y_on_page = pageHeight - (text.coordinates.y - pageBottomY) - text.coordinates.height;

            page.drawRectangle({
              x: text.coordinates.x,
              y: y_on_page,
              width: text.coordinates.width + 2, // a bit wider to ensure full coverage
              height: text.coordinates.height + 2,
              color: rgb(1, 1, 1), // White
            });

            page.drawText(text.translatedText, {
              x: text.coordinates.x,
              y: y_on_page,
              size: 8, // Smaller font size for translations
              font,
              color: rgb(0, 0, 0),
            });
          }
        });

        // 2. Fill in the verified form field values
        formFields.forEach((field: FormField) => {
          if (field.value && field.coordinates && field.coordinates.y >= pageBottomY && field.coordinates.y < pageTopY) {
            const y_on_page = pageHeight - (field.coordinates.y - pageBottomY) - field.coordinates.height;
            const x = field.coordinates.x;

            if ((field.type === 'checkbox' || field.type === 'radio') && (field.value === true || field.value === 'on' || String(field.value).toLowerCase() === 'true')) {
                 page.drawText('X', { x: x + 2, y: y_on_page + 2, size: 12, font, color: rgb(0,0,0) });
            } else if (typeof field.value === 'string') {
                 page.drawText(field.value, {
                    x: x + 2,
                    y: y_on_page + 2,
                    size: 10,
                    font,
                    color: rgb(0, 0, 0),
                 });
            }
          }
        });
    });

    const pdfBytes = await pdfDoc.save();

    console.log('✅ PDF successfully generated');

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="translated-form.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate PDF'
    }, { status: 500 });
  }
}
