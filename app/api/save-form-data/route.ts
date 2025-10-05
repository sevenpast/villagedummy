import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is not configured in environment variables.');
    return NextResponse.json({
      success: false,
      error: 'Datenbankverbindung ist nicht konfiguriert. Bitte überprüfen Sie die Server-Einstellungen.',
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { fields, notes } = await request.json();

    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json({ success: false, error: 'No form fields provided.' }, { status: 400 });
    }

    const formFields = JSON.parse(fields);

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
