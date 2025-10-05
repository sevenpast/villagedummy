// ============================================
// API ROUTES FOR FEATURES
// ============================================

// app/api/pdf/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const userId = formData.get('userId') as string;

    if (!pdfFile) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    // Extract text from PDF
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Analyze with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze this Swiss government form text and extract:
1. Is this a fillable form? (yes/no)
2. Detect language (de, fr, it, or en)
3. Identify all form fields with their types (text, checkbox, date, signature)
4. For each field, provide: field_name, field_type, field_label (in original language), auto_fillable (can we auto-fill from user profile?)
5. Detect form type (school registration, municipality registration, etc.)
6. Confidence score (0-100)

Form text:
${fullText.substring(0, 5000)}

Return as JSON: { "is_fillable": boolean, "detected_language": string, "detected_fields": [...], "form_type": string, "confidence_score": number }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON from response (remove markdown if present)
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(jsonText);

    return NextResponse.json({
      is_fillable: analysis.is_fillable,
      detected_fields: analysis.detected_fields || [],
      detected_language: analysis.detected_language,
      form_type: analysis.form_type,
      municipality: analysis.municipality,
      confidence_score: analysis.confidence_score || 0
    });

  } catch (error) {
    console.error('PDF analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze PDF' },
      { status: 500 }
    );
  }
}

// app/api/pdf/auto-fill/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { documentId, userId } = await request.json();

    // Get document and user profile
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!document || !user) {
      return NextResponse.json({ error: 'Document or user not found' }, { status: 404 });
    }

    const analysisResult = document.analysis_result as any;
    const filledFields: Record<string, string> = {};

    // Auto-fill fields based on user profile
    for (const field of analysisResult.detected_fields) {
      if (!field.auto_fillable) continue;

      const fieldName = field.field_name.toLowerCase();

      // Map common field names to user profile
      if (fieldName.includes('name') || fieldName.includes('vorname')) {
        filledFields[field.field_name] = user.first_name || '';
      } else if (fieldName.includes('nachname') || fieldName.includes('surname')) {
        filledFields[field.field_name] = user.last_name || '';
      } else if (fieldName.includes('geburtsdatum') || fieldName.includes('birth')) {
        filledFields[field.field_name] = user.date_of_birth || '';
      } else if (fieldName.includes('adresse') || fieldName.includes('address')) {
        filledFields[field.field_name] = user.current_address || '';
      } else if (fieldName.includes('plz') || fieldName.includes('postal')) {
        filledFields[field.field_name] = user.postal_code || '';
      } else if (fieldName.includes('email')) {
        filledFields[field.field_name] = user.email || '';
      } else if (fieldName.includes('telefon') || fieldName.includes('phone')) {
        filledFields[field.field_name] = user.phone || '';
      } else if (fieldName.includes('municipality') || fieldName.includes('gemeinde')) {
        filledFields[field.field_name] = user.municipality || '';
      }
    }

    return NextResponse.json({ filledFields });

  } catch (error) {
    console.error('Auto-fill error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-fill PDF' },
      { status: 500 }
    );
  }
}

// ============================================
// EMAIL GENERATION API
// ============================================

// app/api/email/generate/route.ts
export async function POST(request: NextRequest) {
  try {
    const { taskId, category, recipientEmail, userId } = await request.json();

    // Get user and task data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: task } = await supabase
      .from('tasks')
      .select('*, task_variants(*)')
      .eq('id', taskId)
      .single();

    if (!user || !task) {
      return NextResponse.json({ error: 'User or task not found' }, { status: 404 });
    }

    // Determine language based on canton
    const language = getLanguageForCanton(user.canton || 'ZH');

    // Generate email with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate a professional email in ${language === 'de' ? 'German' : language === 'fr' ? 'French' : 'Italian'} for:

Task: ${task.title}
Category: ${category}
Recipient: ${category === 'municipality' ? `${user.municipality} Gemeinde/Commune` : 'School Office'}

User details:
- Name: ${user.first_name} ${user.last_name}
- Country of origin: ${user.country_of_origin}
- Municipality: ${user.municipality}
- Has children: ${user.has_kids ? 'Yes' : 'No'}

Email purpose: ${getEmailPurpose(category, task.title)}

Requirements:
1. Use formal "Sie" form
2. Professional but friendly tone
3. Clear subject line
4. Include all necessary details
5. Request confirmation or next steps

Return as JSON: { "subject": "...", "body": "...", "recipient": "...", "language": "${language}" }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const email = JSON.parse(jsonText);

    // Log AI operation
    await supabase.from('ai_operations').insert({
      user_id: userId,
      task_id: taskId,
      operation_type: 'generate_email',
      input_data: { category, taskId },
      output_data: email,
      status: 'success'
    });

    return NextResponse.json(email);

  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    );
  }
}

function getLanguageForCanton(canton: string): 'de' | 'fr' | 'it' | 'en' {
  const frenchCantons = ['GE', 'VD', 'NE', 'JU', 'FR'];
  const italianCantons = ['TI'];
  
  if (frenchCantons.includes(canton)) return 'fr';
  if (italianCantons.includes(canton)) return 'it';
  return 'de';
}

function getEmailPurpose(category: string, taskTitle: string): string {
  const purposes: Record<string, string> = {
    municipality: 'Inquire about registration requirements and schedule an appointment',
    school: 'Request information about school enrollment process for children',
    employer: 'Clarify employment contract details and work permit status',
    landlord: 'Request viewing appointment or rental information'
  };
  
  return purposes[category] || 'General inquiry';
}

// app/api/email/send/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { subject, body, recipient, cc, userId } = await request.json();

    // Get user email for CC
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const { data, error } = await resend.emails.send({
      from: 'Village <noreply@village.app>',
      to: recipient,
      cc: cc || user?.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px;">
            ${body.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #edf2f7; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; color: #718096;">
              This email was sent via Village - Your Swiss Relocation Assistant<br>
              Need help? Reply to this email or contact support@village.app
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, messageId: data?.id });

  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// ============================================
// REMINDER API
// ============================================

// app/api/reminders/set/route.ts
export async function POST(request: NextRequest) {
  try {
    const { taskId, reminderDate, reminderType = 'email' } = await request.json();
    
    // Get user from auth
    const userId = 'current-user-id'; // Get from auth context

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        task_id: taskId,
        reminder_date: reminderDate,
        reminder_type: reminderType,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(reminder);

  } catch (error) {
    console.error('Set reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to set reminder' },
      { status: 500 }
    );
  }
}

// app/api/reminders/cancel/route.ts
export async function POST(request: NextRequest) {
  try {
    const { reminderId } = await request.json();

    const { error } = await supabase
      .from('reminders')
      .update({ status: 'cancelled' })
      .eq('id', reminderId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cancel reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reminder' },
      { status: 500 }
    );
  }
}

// ============================================
// DOCUMENT MANAGEMENT API
// ============================================

// app/api/documents/[id]/download/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Get document metadata
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError) throw downloadError;

    // Return file
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': document.file_type,
        'Content-Disposition': `attachment; filename="${document.file_name}"`
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}

// ============================================
// MUNICIPALITY DATA API (Scraping)
// ============================================

// app/api/municipality/requirements/route.ts
export async function POST(request: NextRequest) {
  try {
    const { municipality, canton } = await request.json();

    // Check if we have cached data
    const { data: cachedData } = await supabase
      .from('municipality_data')
      .select('*')
      .eq('municipality', municipality)
      .eq('canton', canton)
      .gte('scraped_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // Last 14 days
      .single();

    if (cachedData) {
      return NextResponse.json({
        documents: cachedData.gemeinde_registration_requirements?.documents || [],
        fees: `CHF ${cachedData.registration_fee_chf || 'Unknown'}`,
        office_hours: cachedData.office_hours || {},
        cached: true
      });
    }

    // If no cached data, scrape website
    const websiteUrl = `https://www.${municipality.toLowerCase()}.ch`;
    
    // Use Gemini to scrape and summarize
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Visit ${websiteUrl} and extract information about:
1. Required documents for foreigner registration (Anmeldung)
2. Registration fees in CHF
3. Office hours
4. Contact information

Return as JSON: { "documents": [...], "fees": "CHF X", "office_hours": {...}, "contact_email": "...", "contact_phone": "..." }`;

    // Note: Gemini cannot actually visit URLs, so this is a placeholder
    // In production, you'd use a web scraping service or API
    
    return NextResponse.json({
      documents: [
        'Passport or ID',
        'Employment contract',
        'Rental agreement',
        'Passport photos',
        'Proof of health insurance'
      ],
      fees: 'CHF 50-120',
      office_hours: {
        monday: '08:00-12:00, 13:30-17:00',
        tuesday: '08:00-12:00, 13:30-17:00',
        wednesday: '08:00-12:00, 13:30-17:00',
        thursday: '08:00-12:00, 13:30-18:00',
        friday: '08:00-12:00, 13:30-16:00'
      },
      cached: false,
      note: 'Please verify this information on the official website'
    });

  } catch (error) {
    console.error('Municipality requirements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch municipality requirements' },
      { status: 500 }
    );
  }
}

// ============================================
// CRON JOB FOR REMINDERS (Supabase Edge Function)
// ============================================

// supabase/functions/send-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending reminders for today
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*, users(email, first_name), tasks(title)')
      .eq('status', 'pending')
      .lte('reminder_date', new Date().toISOString())
      .is('sent_at', null);

    if (error) throw error;

    const results = [];

    for (const reminder of reminders || []) {
      try {
        // Send email via Resend
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Village <reminders@village.app>',
            to: reminder.users.email,
            subject: `⏰ Reminder: ${reminder.tasks.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Hi ${reminder.users.first_name}! 👋</h2>
                <p>This is a friendly reminder about your task:</p>
                <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0; color: #1e40af;">${reminder.tasks.title}</h3>
                </div>
                <p>
                  <a href="https://village.app/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                    View Task →
                  </a>
                </p>
                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                  You set this reminder on Village. To manage your reminders, visit your dashboard.
                </p>
              </div>
            `
          })
        });

        if (response.ok) {
          // Mark as sent
          await supabase
            .from('reminders')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          results.push({ id: reminder.id, status: 'sent' });
        } else {
          results.push({ id: reminder.id, status: 'failed' });
        }
      } catch (err) {
        results.push({ id: reminder.id, status: 'error', error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: reminders?.length || 0,
        results 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// PACKAGE.JSON DEPENDENCIES
// ============================================

/*
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@supabase/supabase-js": "^2.45.0",
    "pdfjs-dist": "^4.0.379",
    "resend": "^4.0.0",
    "pdf-lib": "^1.17.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
*/