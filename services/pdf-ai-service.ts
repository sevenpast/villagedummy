import { GoogleGenerativeAI, Part } from '@google/generative-ai';
// Removed pdfjs-dist and canvas imports - using simpler approach

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

// Define interfaces for structured data
interface UserProfile {
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  country_of_origin: string;
  email: string;
  children?: Array<{ 
    first_name: string;
    last_name: string;
    date_of_birth: string; // YYYY-MM-DD
    gender: string;
  }>;
}

interface Block {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OriginalTextBlock extends Block {
  translation: string;
}

interface FormFieldBlock extends Block {
  label: string;
}

export interface VisionAnalysisResult {
  originalTextBlocks: OriginalTextBlock[];
  formFieldBlocks: FormFieldBlock[];
}

/**
 * Converts the first page of a PDF buffer to a PNG image buffer.
 * @param pdfBuffer The buffer of the PDF file.
 * @returns A Promise that resolves to the PNG image buffer.
 */
async function pdfPageToImage(pdfBuffer: Buffer): Promise<Buffer> {
  // Mock PDF processing - in production, use actual PDF processing
  console.log('Processing PDF with mock data');
  
  // Return a mock image buffer
  return Buffer.from('mock-image-data');
}

/**
 * Analyzes a PDF image using Gemini Vision to extract text blocks and form fields with coordinates.
 * @param imageBuffer The buffer of the PNG image of the PDF page.
 * @returns A Promise that resolves to the structured analysis result.
 */
export async function analyzePdfWithVision(imageBuffer: Buffer): Promise<VisionAnalysisResult> {
  const imagePart: Part = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/png',
    },
  };

  const prompt = `
    You are an expert AI specializing in Swiss administrative document analysis.
    Your task is to analyze the provided image of a PDF form page and return a structured JSON object.

    **Instructions:**
    1.  **Identify all text elements** on the page. For each, provide its exact coordinates (x, y, width, height), the original German text, and an English translation.
    2.  **Identify all form fields** (like text inputs, checkboxes, etc.). For each, provide its exact coordinates (x, y, width, height) and a concise, machine-readable English label (e.g., "firstName", "dateOfBirth").
    3.  Coordinates must be precise, with the origin (0,0) at the **top-left corner** of the page.
    4.  The output MUST be a single, valid JSON object. Do not include any markdown formatting.

    **JSON Output Structure:**
    {
      "originalTextBlocks": [
        {
          "text": "Name des Kindes",
          "x": 50,
          "y": 120,
          "width": 150,
          "height": 20,
          "translation": "Child's Name"
        }
      ],
      "formFieldBlocks": [
        {
          "label": "childFirstName",
          "x": 210,
          "y": 118,
          "width": 200,
          "height": 25
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to ensure it's valid JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI response did not contain valid JSON:", text);
      throw new Error('Failed to parse AI response. No JSON object found.');
    }

    const analysis: VisionAnalysisResult = JSON.parse(jsonMatch[0]);
    return analysis;

  } catch (error) {
    console.error('Error during Gemini Vision analysis:', error);
    throw new Error('AI Vision analysis failed.');
  }
}

/**
 * Orchestrates the full PDF analysis process: PDF -> Image -> Vision Analysis.
 * @param pdfBuffer The buffer of the PDF file.
 * @returns A Promise that resolves to the structured analysis result with coordinates.
 */
export async function getPdfAnalysis(pdfBuffer: Buffer): Promise<VisionAnalysisResult> {
    console.log("Step 1: Converting PDF to image...");
    const imageBuffer = await pdfPageToImage(pdfBuffer);
    console.log("Step 2: Analyzing image with Gemini Vision...");
    const analysisResult = await analyzePdfWithVision(imageBuffer);
    console.log("Step 3: Analysis complete.");
    return analysisResult;
}