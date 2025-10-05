interface BatchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  files: BatchFile[];
  createdAt: Date;
  completedAt?: Date;
  progress: number;
  results: BatchResult[];
  error?: string;
}

interface BatchFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface BatchResult {
  fileId: string;
  fileName: string;
  success: boolean;
  detectedFields: any[];
  translatedTexts: any[];
  processingTime: number;
  confidence: number;
  error?: string;
}

interface BatchProcessingOptions {
  enableOCR: boolean;
  enableTranslation: boolean;
  enableLayoutPreservation: boolean;
  translationProvider: string;
  targetLanguage: string;
  maxConcurrentFiles: number;
}

export class BatchProcessingService {
  private jobs: Map<string, BatchJob> = new Map();
  private processingQueue: string[] = [];
  private isProcessing = false;
  private maxConcurrentFiles = 3;

  async createBatchJob(
    files: File[], 
    options: BatchProcessingOptions
  ): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const batchFiles: BatchFile[] = files.map((file, index) => ({
      id: `file_${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      status: 'pending'
    }));

    const job: BatchJob = {
      id: jobId,
      status: 'pending',
      files: batchFiles,
      createdAt: new Date(),
      progress: 0,
      results: []
    };

    this.jobs.set(jobId, job);
    this.processingQueue.push(jobId);

    console.log(`📦 Created batch job ${jobId} with ${files.length} files`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing(options);
    }

    return jobId;
  }

  private async startProcessing(options: BatchProcessingOptions) {
    this.isProcessing = true;
    this.maxConcurrentFiles = options.maxConcurrentFiles;

    console.log(`⚡ Starting batch processing with max ${this.maxConcurrentFiles} concurrent files`);

    while (this.processingQueue.length > 0) {
      const activeJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'processing')
        .length;

      if (activeJobs >= this.maxConcurrentFiles) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const jobId = this.processingQueue.shift();
      if (jobId) {
        this.processJob(jobId, options);
      }
    }

    this.isProcessing = false;
    console.log('✅ Batch processing completed');
  }

  private async processJob(jobId: string, options: BatchProcessingOptions) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    console.log(`🔄 Processing batch job ${jobId}`);

    try {
      const pendingFiles = job.files.filter(file => file.status === 'pending');
      
      for (const file of pendingFiles) {
        file.status = 'processing';
        
        try {
          const result = await this.processFile(file, options);
          file.status = 'completed';
          file.result = result;
          
          job.results.push({
            fileId: file.id,
            fileName: file.name,
            success: true,
            detectedFields: result.detectedFields || [],
            translatedTexts: result.translatedTexts || [],
            processingTime: result.processingTime || 0,
            confidence: result.confidence || 0
          });
          
        } catch (error) {
          file.status = 'failed';
          file.error = error.message;
          
          job.results.push({
            fileId: file.id,
            fileName: file.name,
            success: false,
            detectedFields: [],
            translatedTexts: [],
            processingTime: 0,
            confidence: 0,
            error: error.message
          });
        }
        
        // Update progress
        const completedFiles = job.files.filter(f => f.status === 'completed' || f.status === 'failed').length;
        job.progress = (completedFiles / job.files.length) * 100;
      }
      
      job.status = 'completed';
      job.completedAt = new Date();
      
      console.log(`✅ Batch job ${jobId} completed: ${job.results.filter(r => r.success).length}/${job.results.length} successful`);
      
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      console.error(`❌ Batch job ${jobId} failed:`, error);
    }
  }

  private async processFile(file: BatchFile, options: BatchProcessingOptions): Promise<any> {
    const startTime = Date.now();
    
    console.log(`📄 Processing file: ${file.name}`);
    
    // Convert file to bytes
    const pdfBytes = new Uint8Array(await file.file.arrayBuffer());
    
    let detectedFields: any[] = [];
    let translatedTexts: any[] = [];
    let confidence = 0;
    
    try {
      // Import services dynamically to avoid circular dependencies
      const { advancedOCRService } = await import('./advanced-ocr-service');
      const { translationAPIService } = await import('./translation-api-service');
      const { layoutPreservationService } = await import('./layout-preservation-service');
      
      // Step 1: OCR Processing (if enabled)
      if (options.enableOCR) {
        console.log(`🔍 Running OCR on ${file.name}...`);
        const ocrResult = await advancedOCRService.processPDFWithOCR(pdfBytes);
        const ocrFields = await advancedOCRService.detectFormFieldsFromOCR(ocrResult);
        
        detectedFields.push(...ocrFields);
        confidence = Math.max(confidence, ocrResult.confidence);
      }
      
      // Step 2: Layout Analysis (if enabled)
      if (options.enableLayoutPreservation) {
        console.log(`📐 Analyzing layout for ${file.name}...`);
        const layoutAnalysis = await layoutPreservationService.analyzePDFLayout(pdfBytes);
        
        // Adjust overlay positions based on layout
        if (detectedFields.length > 0) {
          const adjustedPositions = layoutPreservationService.calculateOptimalOverlayPositions(
            layoutAnalysis,
            detectedFields.map(field => field.position)
          );
          
          detectedFields = detectedFields.map((field, index) => ({
            ...field,
            position: adjustedPositions[index]
          }));
        }
      }
      
      // Step 3: Translation (if enabled)
      if (options.enableTranslation && detectedFields.length > 0) {
        console.log(`🌐 Translating fields for ${file.name}...`);
        
        // Switch to specified translation provider
        translationAPIService.switchProvider(options.translationProvider);
        
        const translations = await Promise.all(
          detectedFields.map(async (field) => {
            const translation = await translationAPIService.translateText(
              field.originalText || field.name,
              'auto',
              options.targetLanguage
            );
            
            return {
              text: translation,
              x: field.position.x - 100,
              y: field.position.y + 5,
              width: 90,
              height: 15,
              originalText: field.originalText || field.name,
              confidence: field.confidence
            };
          })
        );
        
        translatedTexts = translations;
      }
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ File ${file.name} processed in ${processingTime}ms`);
      
      return {
        detectedFields,
        translatedTexts,
        processingTime,
        confidence
      };
      
    } catch (error) {
      console.error(`❌ Error processing file ${file.name}:`, error);
      throw error;
    }
  }

  getJobStatus(jobId: string): BatchJob | null {
    return this.jobs.get(jobId) || null;
  }

  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getJobResults(jobId: string): BatchResult[] {
    const job = this.jobs.get(jobId);
    return job ? job.results : [];
  }

  async downloadJobResults(jobId: string): Promise<Blob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const results = {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      totalFiles: job.files.length,
      successfulFiles: job.results.filter(r => r.success).length,
      results: job.results
    };

    const jsonString = JSON.stringify(results, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  getProcessingStats(): {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalFiles: number;
    successfulFiles: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'processing').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const failedJobs = jobs.filter(job => job.status === 'failed').length;
    
    const totalFiles = jobs.reduce((sum, job) => sum + job.files.length, 0);
    const successfulFiles = jobs.reduce((sum, job) => 
      sum + job.results.filter(r => r.success).length, 0
    );

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      failedJobs,
      totalFiles,
      successfulFiles
    };
  }
}

// Singleton instance
export const batchProcessingService = new BatchProcessingService();


