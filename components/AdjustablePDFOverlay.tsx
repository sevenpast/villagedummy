'use client';

import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// CSS imports removed - using inline styles instead
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

// Set up the worker for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Add CSS styles for react-pdf components
const pdfStyles = `
  .react-pdf__Page__textContent {
    display: none !important;
  }
  .react-pdf__Page__annotations {
    display: none !important;
  }
  .react-pdf__Page__canvas {
    display: block !important;
  }
`;

interface PDFOverlayProps {
  pdfUrl: string;
}

const AdjustablePDFOverlay = forwardRef((props: PDFOverlayProps, ref) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useImperativeHandle(ref, () => ({
    async getFieldValues(): Promise<Record<string, string>> {
      if (!pdfDoc) {
        console.error("PDF document is not loaded yet.");
        return {};
      }

      const fieldValues: Record<string, string> = {};
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const annotations = await page.getAnnotations();

        annotations
          .filter((anno: any) => anno.subtype === 'Widget') // Filter for form fields
          .forEach((anno: any) => {
            // The field name is in fieldName, value is in fieldValue
            if (anno.fieldName) {
              fieldValues[anno.fieldName] = anno.fieldValue || '';
            }
          });
      }
      return fieldValues;
    },
  }));

  function onDocumentLoadSuccess({ numPages, ...doc }: { numPages: number }) {
    setNumPages(numPages);
    setPdfDoc(doc);
  }

  const goToPrevPage = () => setPageNumber(pageNumber - 1 > 0 ? pageNumber - 1 : 1);
  const goToNextPage = () => setPageNumber(pageNumber + 1 <= (numPages || 0) ? pageNumber + 1 : pageNumber);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />
      <div className="w-full h-full flex flex-col bg-gray-100">
        {/* Toolbar */}
        <div className="flex items-center justify-center gap-4 p-2 bg-gray-800 text-white shadow-md z-10">
        <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="disabled:opacity-50" title="Previous page">
          <ChevronLeft />
        </button>
        <span>
          Page {pageNumber} of {numPages || '--'}
        </span>
        <button onClick={goToNextPage} disabled={pageNumber >= (numPages || 0)} className="disabled:opacity-50" title="Next page">
          <ChevronRight />
        </button>
        <div className="w-px h-5 bg-gray-500 mx-2"></div>
        <button onClick={() => setScale(s => s - 0.1)} title="Zoom out"><ZoomOut /></button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => s + 0.1)} title="Zoom in"><ZoomIn /></button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto text-center p-4">
          <Document
            file={props.pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mt-10" />}
            error={<p>Failed to load PDF.</p>}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              renderAnnotationLayer={true} // This is crucial for interactive forms
              renderTextLayer={true}
            />
          </Document>
        </div>
      </div>
    </>
  );
});

AdjustablePDFOverlay.displayName = 'AdjustablePDFOverlay';

export default AdjustablePDFOverlay;