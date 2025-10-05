import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const EXCEL_PATH = './Module1_Welcome to Switzerland.xlsx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Segment mapping
const EU_EFTA_COUNTRIES = ['Germany', 'France', 'Italy', 'Austria', 'Netherlands', 'Belgium', 'Spain', 'Portugal', 'Sweden', 'Denmark', 'Norway', 'Iceland', 'Switzerland'];
const VISA_EXEMPT_COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'New Zealand', 'Japan', 'Singapore', 'South Korea'];

function parseTargetAudience(text: string): string[] {
  if (!text) return ['all'];
  const lower = text.toLowerCase();
  
  if (lower.includes('eu/efta')) return ['EU/EFTA'];
  if (lower.includes('visa-exempt')) return ['Non-EU/EFTA', 'visa-exempt'];
  if (lower.includes('visa-required')) return ['Non-EU/EFTA', 'visa-required'];
  if (lower.includes('with kids') || lower.includes('with_kids')) return ['with_kids'];
  if (lower.includes('default') || lower.includes('if none')) return ['default'];
  if (lower === 'all') return ['all'];
  
  return ['all'];
}

function parseActions(actionsText: string): any {
  if (!actionsText) return null;
  
  try {
    // Try to parse as JSON first
    return JSON.parse(actionsText);
  } catch {
    // Fallback: basic string-based parsing
    if (actionsText.includes('"yes"') || actionsText.includes('Yes')) {
      return {
        yes: { action: 'mark_complete' },
        not_yet: { action: 'set_reminder', days: 7 }
      };
    }
    return { raw: actionsText };
  }
}

async function seedModule() {
  console.log('🚀 Starting migration...\n');

  // Read Excel
  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log(`✅ Loaded workbook with sheets: ${workbook.SheetNames.join(', ')}\n`);

  // 1. Insert Module
  console.log('📦 Inserting Module...');
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .upsert({
      id: 1,
      title: 'Welcome to Switzerland: Your first 90 days',
      description: 'Essential tasks to complete during your first three months in Switzerland',
      display_order: 1
    }, { onConflict: 'id' })
    .select()
    .single();

  if (moduleError) {
    console.error('❌ Module error:', moduleError);
    return;
  }
  console.log('✅ Module inserted\n');

  // 2. Insert Tasks from Overview
  const overviewSheet = workbook.Sheets['Overview'];
  const overviewData = XLSX.utils.sheet_to_json(overviewSheet, { header: 1 }) as any[][];
  
  console.log('📋 Inserting Tasks...');
  
  const tasksToInsert = [
    { task_number: 1, title: 'Secure residence permit / visa', category: 'legal', priority: 100, deadline_days: null, is_urgent: false },
    { task_number: 2, title: 'Find housing', category: 'housing', priority: 90, deadline_days: null, is_urgent: false },
    { task_number: 3, title: 'Register at your Gemeinde (municipality)', category: 'legal', priority: 95, deadline_days: 14, is_urgent: true },
    { task_number: 4, title: 'Register for school/kindergarten', category: 'family', priority: 85, deadline_days: 7, is_urgent: true },
    { task_number: 5, title: 'Receive residence permit card', category: 'legal', priority: 80, deadline_days: null, is_urgent: false },
    { task_number: 6, title: 'Open a Swiss bank account', category: 'admin', priority: 75, deadline_days: null, is_urgent: false },
    { task_number: 7, title: 'Arrange mobile phone & internet plan', category: 'admin', priority: 70, deadline_days: null, is_urgent: false },
    { task_number: 8, title: 'Choose health insurance provider', category: 'health', priority: 88, deadline_days: 90, is_urgent: true },
  ];

  for (const task of tasksToInsert) {
    const { error } = await supabase
      .from('tasks')
      .upsert({
        ...task,
        module_id: 1
      }, { onConflict: 'task_number' });
    
    if (error) {
      console.error(`❌ Error inserting task ${task.task_number}:`, error);
    } else {
      console.log(`✅ Task ${task.task_number}: ${task.title}`);
    }
  }
  console.log('\n');

  // 3. Insert Task Variants
  console.log('🎨 Inserting Task Variants...\n');
  
  for (let taskNum = 1; taskNum <= 8; taskNum++) {
    const sheetName = String(taskNum);
    if (!workbook.Sheets[sheetName]) {
      console.log(`⚠️  Sheet ${sheetName} not found, skipping...`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[1]) continue;

      const variant = {
        task_id: taskNum,
        target_audience: JSON.stringify(parseTargetAudience(row[1])),
        intro: row[2] || '',
        info_box: row[3] || '',
        initial_question: row[4] || null,
        answer_options: row[4] ? JSON.stringify(['yes', 'not_yet']) : null,
        actions: row[5] ? JSON.stringify(parseActions(row[5])) : null,
        priority: 100 - i, // Higher priority for first variants
        ui_config: null
      };

      const { error } = await supabase
        .from('task_variants')
        .insert(variant);

      if (error) {
        console.error(`❌ Error inserting variant for task ${taskNum}:`, error.message);
      } else {
        console.log(`✅ Task ${taskNum} - Variant ${i}: ${parseTargetAudience(row[1]).join(', ')}`);
      }
    }
  }

  console.log('\n🎉 Migration completed successfully!');
}

// Run migration
seedModule().catch(console.error);
