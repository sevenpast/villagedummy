import { createCanvas, loadImage } from 'canvas';

export interface PreprocessingResult {
  processedImageBuffer: Buffer;
  metadata: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    deskewAngle: number;
    binarizationThreshold: number;
    noiseRemoved: boolean;
    scalingFactor: number;
  };
}

export class OCRPreprocessingService {
  private readonly TARGET_DPI = 300;
  private readonly MIN_WIDTH = 1000;
  private readonly MIN_HEIGHT = 1000;

  /**
   * Complete preprocessing pipeline for OCR optimization
   */
  async preprocessImage(imageBuffer: Buffer): Promise<PreprocessingResult> {
    console.log('🔧 Starting OCR preprocessing pipeline...');
    
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw original image
    ctx.drawImage(image, 0, 0);
    
    let processedCanvas = canvas;
    let metadata = {
      originalSize: { width: image.width, height: image.height },
      processedSize: { width: image.width, height: image.height },
      deskewAngle: 0,
      binarizationThreshold: 128,
      noiseRemoved: false,
      scalingFactor: 1
    };

    // Step 1: Deskew (Geraderichten)
    console.log('📐 Step 1: Deskewing image...');
    const deskewResult = await this.deskewImage(processedCanvas);
    processedCanvas = deskewResult.canvas;
    metadata.deskewAngle = deskewResult.angle;

    // Step 2: Scaling (Skalierung auf optimale DPI)
    console.log('📏 Step 2: Scaling to optimal DPI...');
    const scaleResult = await this.scaleToOptimalDPI(processedCanvas);
    processedCanvas = scaleResult.canvas;
    metadata.scalingFactor = scaleResult.factor;
    metadata.processedSize = { width: processedCanvas.width, height: processedCanvas.height };

    // Step 3: Binarization (Schwarz-Weiss-Konvertierung)
    console.log('🎨 Step 3: Binarization...');
    const binarizedCanvas = await this.binarizeImage(processedCanvas);
    metadata.binarizationThreshold = binarizedCanvas.threshold;

    // Step 4: Noise Removal (Rauschunterdrückung)
    console.log('🧹 Step 4: Noise removal...');
    const denoisedCanvas = await this.removeNoise(binarizedCanvas.canvas);
    metadata.noiseRemoved = true;

    console.log('✅ OCR preprocessing completed');
    console.log(`📊 Metadata:`, metadata);

    return {
      processedImageBuffer: denoisedCanvas.toBuffer('image/png'),
      metadata
    };
  }

  /**
   * Step 1: Deskew - Geraderichten des Bildes
   */
  private async deskewImage(canvas: any): Promise<{ canvas: any; angle: number }> {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple deskew algorithm - detect text lines and calculate angle
    const angle = this.detectTextAngle(imageData);
    
    if (Math.abs(angle) > 0.5) { // Only deskew if angle is significant
      console.log(`📐 Detected skew angle: ${angle.toFixed(2)}°`);
      
      const newCanvas = createCanvas(canvas.width, canvas.height);
      const newCtx = newCanvas.getContext('2d');
      
      // Apply rotation
      newCtx.translate(canvas.width / 2, canvas.height / 2);
      newCtx.rotate((angle * Math.PI) / 180);
      newCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      
      return { canvas: newCanvas, angle };
    }
    
    return { canvas, angle: 0 };
  }

  /**
   * Detect text angle using Hough transform approximation
   */
  private detectTextAngle(imageData: ImageData): number {
    const { data, width, height } = imageData;
    const angles: number[] = [];
    
    // Sample horizontal lines and detect text edges
    for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += 10) {
      const lineAngles = this.detectLineAngles(data, width, height, y);
      angles.push(...lineAngles);
    }
    
    // Return most common angle
    if (angles.length === 0) return 0;
    
    const angleCounts = new Map<number, number>();
    angles.forEach(angle => {
      const rounded = Math.round(angle * 2) / 2; // Round to 0.5 degree precision
      angleCounts.set(rounded, (angleCounts.get(rounded) || 0) + 1);
    });
    
    let maxCount = 0;
    let dominantAngle = 0;
    angleCounts.forEach((count, angle) => {
      if (count > maxCount) {
        maxCount = count;
        dominantAngle = angle;
      }
    });
    
    return dominantAngle;
  }

  /**
   * Detect angles of text lines in a horizontal scan line
   */
  private detectLineAngles(data: Uint8ClampedArray, width: number, height: number, y: number): number[] {
    const angles: number[] = [];
    const threshold = 128;
    
    // Find text edges in the line
    const edges: number[] = [];
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const next = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
      
      if (Math.abs(current - next) > 50) { // Significant edge
        edges.push(x);
      }
    }
    
    // Group edges into text lines and calculate angles
    if (edges.length > 10) {
      const lineGroups = this.groupEdgesIntoLines(edges);
      lineGroups.forEach(group => {
        if (group.length > 5) {
          const angle = this.calculateLineAngle(group, y);
          if (Math.abs(angle) < 45) { // Reasonable text angle
            angles.push(angle);
          }
        }
      });
    }
    
    return angles;
  }

  /**
   * Group edges into text lines
   */
  private groupEdgesIntoLines(edges: number[]): number[][] {
    const groups: number[][] = [];
    let currentGroup: number[] = [edges[0]];
    
    for (let i = 1; i < edges.length; i++) {
      if (edges[i] - edges[i - 1] < 20) { // Close edges belong to same line
        currentGroup.push(edges[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [edges[i]];
      }
    }
    groups.push(currentGroup);
    
    return groups;
  }

  /**
   * Calculate angle of a text line
   */
  private calculateLineAngle(edgeGroup: number[], y: number): number {
    if (edgeGroup.length < 2) return 0;
    
    const startX = edgeGroup[0];
    const endX = edgeGroup[edgeGroup.length - 1];
    const deltaX = endX - startX;
    const deltaY = 0; // Horizontal line
    
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  }

  /**
   * Step 2: Scale to optimal DPI
   */
  private async scaleToOptimalDPI(canvas: any): Promise<{ canvas: any; factor: number }> {
    const currentWidth = canvas.width;
    const currentHeight = canvas.height;
    
    // Calculate scaling factor to reach minimum dimensions
    const scaleX = Math.max(1, this.MIN_WIDTH / currentWidth);
    const scaleY = Math.max(1, this.MIN_HEIGHT / currentHeight);
    const scaleFactor = Math.max(scaleX, scaleY);
    
    if (scaleFactor > 1.1) { // Only scale if significant improvement
      console.log(`📏 Scaling by factor: ${scaleFactor.toFixed(2)}`);
      
      const newWidth = Math.round(currentWidth * scaleFactor);
      const newHeight = Math.round(currentHeight * scaleFactor);
      
      const newCanvas = createCanvas(newWidth, newHeight);
      const newCtx = newCanvas.getContext('2d');
      
      // Use high-quality scaling
      newCtx.imageSmoothingEnabled = true;
      newCtx.imageSmoothingQuality = 'high';
      newCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
      
      return { canvas: newCanvas, factor: scaleFactor };
    }
    
    return { canvas, factor: 1 };
  }

  /**
   * Step 3: Binarization - Convert to black and white
   */
  private async binarizeImage(canvas: any): Promise<{ canvas: any; threshold: number }> {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    
    // Calculate Otsu's threshold
    const threshold = this.calculateOtsuThreshold(data);
    console.log(`🎨 Binarization threshold: ${threshold}`);
    
    // Apply binarization
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const binary = gray > threshold ? 255 : 0;
      
      data[i] = binary;     // R
      data[i + 1] = binary; // G
      data[i + 2] = binary; // B
      // data[i + 3] remains unchanged (alpha)
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return { canvas, threshold };
  }

  /**
   * Calculate Otsu's threshold for optimal binarization
   */
  private calculateOtsuThreshold(data: Uint8ClampedArray): number {
    const histogram = new Array(256).fill(0);
    
    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
      histogram[gray]++;
    }
    
    const totalPixels = data.length / 4;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 0;
    
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      
      wF = totalPixels - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }
    
    return threshold;
  }

  /**
   * Step 4: Noise removal
   */
  private async removeNoise(canvas: any): Promise<any> {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    
    // Apply median filter for noise removal
    const filteredData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Collect 3x3 neighborhood
        const neighborhood: number[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            neighborhood.push((data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3);
          }
        }
        
        // Apply median filter
        neighborhood.sort((a, b) => a - b);
        const median = neighborhood[4]; // Middle value of 9 elements
        
        filteredData[idx] = median;     // R
        filteredData[idx + 1] = median; // G
        filteredData[idx + 2] = median; // B
        // Alpha remains unchanged
      }
    }
    
    const filteredImageData = new ImageData(filteredData, width, height);
    ctx.putImageData(filteredImageData, 0, 0);
    
    console.log('🧹 Noise removal completed');
    
    return canvas;
  }
}

export const ocrPreprocessingService = new OCRPreprocessingService();
