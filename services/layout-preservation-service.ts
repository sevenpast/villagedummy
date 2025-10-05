import { PDFDocument } from 'pdf-lib';

interface LayoutElement {
  type: 'text' | 'image' | 'table' | 'form_field' | 'line' | 'rectangle';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  properties?: Record<string, any>;
  page: number;
}

interface LayoutAnalysis {
  elements: LayoutElement[];
  pageDimensions: {
    width: number;
    height: number;
  };
  complexity: 'simple' | 'medium' | 'complex';
  hasTables: boolean;
  hasImages: boolean;
  hasFormFields: boolean;
}

export class LayoutPreservationService {
  
  async analyzePDFLayout(pdfBytes: Uint8Array): Promise<LayoutAnalysis> {
    try {
      console.log('📐 Analyzing PDF layout...');
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const elements: LayoutElement[] = [];
      
      let hasTables = false;
      let hasImages = false;
      let hasFormFields = false;
      
      // Analyze each page
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        
        // Get form fields
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        
        fields.forEach(field => {
          try {
            const widgets = (field as any).acroField?.getWidgets?.();
            if (widgets && widgets.length > 0) {
              const widget = widgets[0];
              const rect = widget.getRectangle();
              
              if (rect) {
                elements.push({
                  type: 'form_field',
                  position: {
                    x: rect.x,
                    y: height - rect.y - rect.height, // Convert to top-left origin
                    width: rect.width,
                    height: rect.height
                  },
                  content: field.getName(),
                  properties: {
                    fieldType: field.constructor.name,
                    fieldName: field.getName()
                  },
                  page: pageIndex
                });
                hasFormFields = true;
              }
            }
          } catch (error) {
            console.log(`Could not analyze field ${field.getName()}:`, error);
          }
        });
        
        // Detect text blocks (simplified - would need more sophisticated analysis)
        const textElements = this.detectTextBlocks(page, pageIndex, width, height);
        elements.push(...textElements);
        
        // Detect images (simplified)
        const imageElements = this.detectImages(page, pageIndex, width, height);
        elements.push(...imageElements);
        if (imageElements.length > 0) hasImages = true;
        
        // Detect tables (simplified - look for grid-like patterns)
        const tableElements = this.detectTables(page, pageIndex, width, height);
        elements.push(...tableElements);
        if (tableElements.length > 0) hasTables = true;
      }
      
      // Determine complexity
      const complexity = this.determineComplexity(elements, hasTables, hasImages, hasFormFields);
      
      console.log(`📐 Layout analysis complete: ${elements.length} elements, complexity: ${complexity}`);
      
      return {
        elements,
        pageDimensions: {
          width: pages[0]?.getSize().width || 595,
          height: pages[0]?.getSize().height || 842
        },
        complexity,
        hasTables,
        hasImages,
        hasFormFields
      };
      
    } catch (error) {
      console.error('❌ Layout analysis failed:', error);
      throw new Error(`Layout analysis failed: ${error.message}`);
    }
  }

  private detectTextBlocks(page: any, pageIndex: number, width: number, height: number): LayoutElement[] {
    // This is a simplified implementation
    // In a real scenario, you'd use more sophisticated text extraction
    const elements: LayoutElement[] = [];
    
    // Simulate text block detection based on common form layouts
    const commonTextPositions = [
      { x: 50, y: 750, width: 200, height: 20, content: 'PERSONALIEN KIND' },
      { x: 50, y: 720, width: 100, height: 15, content: 'Vorname:' },
      { x: 350, y: 720, width: 100, height: 15, content: 'Name:' },
      { x: 50, y: 680, width: 120, height: 15, content: 'Geburtsdatum:' },
      { x: 50, y: 640, width: 80, height: 15, content: 'Geschlecht:' },
      { x: 50, y: 600, width: 100, height: 15, content: 'Nationalität:' },
      { x: 50, y: 560, width: 80, height: 15, content: 'Adresse:' },
      { x: 50, y: 520, width: 80, height: 15, content: 'Telefon:' },
      { x: 50, y: 480, width: 60, height: 15, content: 'E-Mail:' }
    ];
    
    commonTextPositions.forEach(pos => {
      elements.push({
        type: 'text',
        position: pos,
        content: pos.content,
        page: pageIndex
      });
    });
    
    return elements;
  }

  private detectImages(page: any, pageIndex: number, width: number, height: number): LayoutElement[] {
    // Simplified image detection
    // In reality, you'd analyze the PDF's XObject resources
    return [];
  }

  private detectTables(page: any, pageIndex: number, width: number, height: number): LayoutElement[] {
    // Simplified table detection
    // Look for grid-like patterns in text positioning
    const elements: LayoutElement[] = [];
    
    // Example: Detect if there are multiple columns of text
    const textElements = this.detectTextBlocks(page, pageIndex, width, height);
    const xPositions = textElements.map(el => el.position.x).sort((a, b) => a - b);
    
    // If we have multiple distinct x-positions, it might be a table
    const uniqueXPositions = [...new Set(xPositions)];
    if (uniqueXPositions.length >= 3) {
      elements.push({
        type: 'table',
        position: {
          x: Math.min(...xPositions),
          y: Math.min(...textElements.map(el => el.position.y)),
          width: Math.max(...xPositions) - Math.min(...xPositions) + 200,
          height: Math.max(...textElements.map(el => el.position.y)) - Math.min(...textElements.map(el => el.position.y)) + 20
        },
        page: pageIndex,
        properties: {
          columns: uniqueXPositions.length,
          estimatedRows: textElements.length / uniqueXPositions.length
        }
      });
    }
    
    return elements;
  }

  private determineComplexity(
    elements: LayoutElement[], 
    hasTables: boolean, 
    hasImages: boolean, 
    hasFormFields: boolean
  ): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;
    
    // Base score from element count
    if (elements.length > 50) complexityScore += 2;
    else if (elements.length > 20) complexityScore += 1;
    
    // Additional complexity factors
    if (hasTables) complexityScore += 2;
    if (hasImages) complexityScore += 1;
    if (hasFormFields) complexityScore += 1;
    
    // Multiple pages add complexity
    const pageCount = new Set(elements.map(el => el.page)).size;
    if (pageCount > 3) complexityScore += 2;
    else if (pageCount > 1) complexityScore += 1;
    
    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  calculateOptimalOverlayPositions(
    layoutAnalysis: LayoutAnalysis,
    overlayElements: Array<{ x: number; y: number; width: number; height: number }>
  ): Array<{ x: number; y: number; width: number; height: number; adjusted: boolean }> {
    
    const adjustedPositions = overlayElements.map(element => {
      let adjusted = false;
      let newX = element.x;
      let newY = element.y;
      let newWidth = element.width;
      let newHeight = element.height;
      
      // Adjust based on layout complexity
      switch (layoutAnalysis.complexity) {
        case 'complex':
          // For complex layouts, be more conservative with positioning
          newX = Math.max(0, element.x - 5);
          newY = Math.max(0, element.y - 5);
          newWidth = Math.min(element.width + 10, layoutAnalysis.pageDimensions.width - newX);
          newHeight = Math.min(element.height + 10, layoutAnalysis.pageDimensions.height - newY);
          adjusted = true;
          break;
          
        case 'medium':
          // Moderate adjustments
          newX = Math.max(0, element.x - 2);
          newY = Math.max(0, element.y - 2);
          newWidth = Math.min(element.width + 4, layoutAnalysis.pageDimensions.width - newX);
          newHeight = Math.min(element.height + 4, layoutAnalysis.pageDimensions.height - newY);
          adjusted = true;
          break;
          
        case 'simple':
          // Minimal adjustments
          newX = Math.max(0, element.x);
          newY = Math.max(0, element.y);
          newWidth = Math.min(element.width, layoutAnalysis.pageDimensions.width - newX);
          newHeight = Math.min(element.height, layoutAnalysis.pageDimensions.height - newY);
          break;
      }
      
      // Check for overlaps with existing elements
      const overlapping = layoutAnalysis.elements.some(layoutEl => 
        this.elementsOverlap(
          { x: newX, y: newY, width: newWidth, height: newHeight },
          layoutEl.position
        )
      );
      
      if (overlapping) {
        // Adjust position to avoid overlap
        const adjustedPos = this.findNonOverlappingPosition(
          { x: newX, y: newY, width: newWidth, height: newHeight },
          layoutAnalysis.elements,
          layoutAnalysis.pageDimensions
        );
        
        newX = adjustedPos.x;
        newY = adjustedPos.y;
        adjusted = true;
      }
      
      return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        adjusted
      };
    });
    
    console.log(`📐 Adjusted ${adjustedPositions.filter(p => p.adjusted).length} overlay positions for layout preservation`);
    
    return adjustedPositions;
  }

  private elementsOverlap(
    element1: { x: number; y: number; width: number; height: number },
    element2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      element1.x + element1.width < element2.x ||
      element2.x + element2.width < element1.x ||
      element1.y + element1.height < element2.y ||
      element2.y + element2.height < element1.y
    );
  }

  private findNonOverlappingPosition(
    element: { x: number; y: number; width: number; height: number },
    existingElements: LayoutElement[],
    pageDimensions: { width: number; height: number }
  ): { x: number; y: number } {
    
    // Try moving the element to the right first
    let newX = element.x + 20;
    let newY = element.y;
    
    // If that goes off the page, try moving down
    if (newX + element.width > pageDimensions.width) {
      newX = element.x;
      newY = element.y + 20;
    }
    
    // If that goes off the page, try top-left
    if (newY + element.height > pageDimensions.height) {
      newX = 10;
      newY = 10;
    }
    
    return { x: newX, y: newY };
  }
}

// Singleton instance
export const layoutPreservationService = new LayoutPreservationService();


