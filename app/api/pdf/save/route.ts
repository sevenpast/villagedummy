import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const formFieldsString = formData.get('formFields') as string | null;
    const notes = formData.get('notes') as string | null;
    
    if (!formFieldsString) {
      return NextResponse.json({ success: false, error: 'No form fields provided.' }, { status: 400 });
    }

    const formFields = JSON.parse(formFieldsString);

    // Create a dynamic object to hold the data for Supabase
    const dataToSave: { [key: string]: any } = {};
    formFields.forEach((field: { key: string; value: any; }) => {
      // Simple mapping: use the field 'key' as the column name
      // This requires your Supabase table columns to match the 'key' from the AI
      dataToSave[field.key] = field.value;
    });

    if (notes) {
      dataToSave.notes = notes;
    }

    // --- IMPORTANT ---
    // This assumes you have a table named 'form_submissions'
    // You MUST adapt 'form_submissions' and the column names (field.key) to your actual database schema.
    const { data, error } = await supabase
      .from('form_submissions')
      .insert([dataToSave])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to save data to the database.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Data saved successfully.', data: data });

  } catch (error) {
    console.error('Error in save API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}


