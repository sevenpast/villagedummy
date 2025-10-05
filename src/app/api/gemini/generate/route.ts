import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { prompt, task_type, user_data } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json({ 
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.',
        generated_text: 'This is a demo response. Please configure your Gemini API key to get real AI-generated content.'
      }, { status: 200 });
    }

    // Try to use Gemini API, but fallback to demo content if it fails
    let generatedText = '';
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
      // Create context-aware prompt based on task type
      let enhancedPrompt = prompt;
      
      switch (task_type) {
        case 'email_generation':
          enhancedPrompt = `Generate a polite, formal email in English for a Swiss municipality office. 
          User context: ${JSON.stringify(user_data)}
          Request: ${prompt}
          
          Format the email with proper business etiquette. Include:
          - Formal greeting
          - Clear subject line
          - Introduction of the sender
          - Specific request for information
          - Polite closing
          - Contact information
          
          The email should be professional and respectful.`;
          break;
          
        case 'document_extraction':
          enhancedPrompt = `Extract key information from this municipality website content about registration requirements.
          Focus on: required documents, fees, office hours, deadlines.
          Content: ${prompt}
          
          Return as structured JSON with categories.`;
          break;
          
        case 'form_filling':
          enhancedPrompt = `Help fill out this form using the provided user data.
          User data: ${JSON.stringify(user_data)}
          Form fields: ${prompt}
          
          Return field mappings as JSON.`;
          break;
      }

      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      generatedText = response.text();

    } catch (apiError) {
      console.error('Gemini API Error:', apiError);
      
      // Fallback to demo content based on task type
      switch (task_type) {
        case 'email_generation':
          generatedText = `Subject: Inquiry regarding registration as a new resident

Dear Sir/Madam,

I am writing to you as I would like to register as a new resident in your municipality. I am a citizen of the United States and plan to move to Zurich with my family.

Could you please provide me with the following information:

1. What documents do I need for registration?
2. What fees are involved?
3. What are your office hours?
4. Are there special requirements for families with children?

I would be very grateful for your assistance and look forward to your response.

Kind regards,
[Your Name]
[Your Address]
[Your Phone Number]
[Your Email Address]`;
          break;
          
        default:
          generatedText = 'Demo content: The Gemini API is currently not available, but here is some example content.';
      }
    }

    return NextResponse.json({ 
      generated_text: generatedText,
      usage: {
        task_type,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return NextResponse.json({ 
      error: 'Failed to generate content',
      generated_text: 'Sorry, there was an error generating the content. Please try again later.'
    }, { status: 500 });
  }
}
