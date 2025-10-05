import { createClient } from '@supabase/supabase-js';
import { addDays, differenceInDays, isPast } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Segment detection logic
const EU_EFTA = ['Germany', 'France', 'Italy', 'Austria', 'Netherlands', 'Belgium', 'Spain', 'Portugal', 'Sweden', 'Denmark', 'Norway', 'Iceland', 'Liechtenstein'];
const VISA_EXEMPT = ['USA', 'UK', 'Canada', 'Australia', 'New Zealand', 'Japan', 'Singapore', 'South Korea'];

export function getUserSegments(user: any): string[] {
  const segments: string[] = [];
  
  if (!user.country_of_origin) {
    segments.push('default');
    return segments;
  }
  
  // EU/EFTA check
  if (EU_EFTA.includes(user.country_of_origin)) {
    segments.push('EU/EFTA');
  } 
  // Non-EU/EFTA checks
  else {
    if (VISA_EXEMPT.includes(user.country_of_origin)) {
      segments.push('Non-EU/EFTA', 'visa-exempt');
    } else {
      segments.push('Non-EU/EFTA', 'visa-required');
    }
  }
  
  // Family check
  if (user.has_kids && user.num_children > 0) {
    segments.push('with_kids');
  }
  
  // Always include 'all'
  segments.push('all');
  
  return segments;
}

export function calculateDeadline(user: any, task: any): Date | null {
  if (!task.deadline_days || !user.arrival_date) return null;
  
  const arrivalDate = new Date(user.arrival_date);
  return addDays(arrivalDate, task.deadline_days);
}

export function getTaskUrgency(deadline: Date | null): 'overdue' | 'urgent' | 'upcoming' | null {
  if (!deadline) return null;
  
  const daysUntil = differenceInDays(deadline, new Date());
  
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 3) return 'urgent';
  if (daysUntil <= 7) return 'upcoming';
  
  return null;
}

export async function getPersonalizedTasks(userId: string) {
  // 1. Get user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (userError || !user) {
    throw new Error('User not found');
  }
  
  // 2. Get user's segments
  const userSegments = getUserSegments(user);
  
  // 3. Get all tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('module_id', 1)
    .order('priority', { ascending: false });
  
  if (tasksError) throw tasksError;
  
  // 4. Get user's completed tasks
  const { data: userTaskStatus } = await supabase
    .from('user_task_status')
    .select('*')
    .eq('user_id', userId);
  
  const completedTaskIds = userTaskStatus
    ?.filter(s => s.status === 'completed')
    .map(s => s.task_id) || [];
  
  // 5. For each task, find matching variant
  const personalizedTasks = [];
  
  for (const task of tasks || []) {
    // Get all variants for this task
    const { data: variants } = await supabase
      .from('task_variants')
      .select('*')
      .eq('task_id', task.task_number)
      .order('priority', { ascending: false });
    
    if (!variants || variants.length === 0) continue;
    
    // Find best matching variant
    let matchedVariant = null;
    let bestMatchScore = -1;
    
    for (const variant of variants) {
      const targetAudience = JSON.parse(variant.target_audience || '["all"]');
      
      // Calculate match score
      const matchScore = targetAudience.filter((seg: string) => 
        userSegments.includes(seg)
      ).length;
      
      // Default variant as fallback
      if (targetAudience.includes('default') && matchScore === 0) {
        if (!matchedVariant) matchedVariant = variant;
      }
      
      // Better match found
      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        matchedVariant = variant;
      }
    }
    
    if (!matchedVariant) continue;
    
    // Calculate deadline and urgency
    const deadline = calculateDeadline(user, task);
    const urgency = getTaskUrgency(deadline);
    
    // Get user's status for this task
    const userStatus = userTaskStatus?.find(s => s.task_id === task.task_number);
    
    personalizedTasks.push({
      taskId: task.task_number,
      title: task.title,
      category: task.category,
      isUrgent: task.is_urgent,
      priority: task.priority,
      deadline,
      urgency,
      status: userStatus?.status || 'not_started',
      variant: {
        intro: matchedVariant.intro,
        infoBox: matchedVariant.info_box,
        initialQuestion: matchedVariant.initial_question,
        answerOptions: matchedVariant.answer_options ? 
          JSON.parse(matchedVariant.answer_options) : null,
        actions: matchedVariant.actions ? 
          JSON.parse(matchedVariant.actions) : null,
      },
      completed: completedTaskIds.includes(task.task_number)
    });
  }
  
  return {
    user,
    segments: userSegments,
    tasks: personalizedTasks
  };
}

export async function updateTaskStatus(
  userId: string, 
  taskId: number, 
  status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable'
) {
  const { data, error } = await supabase
    .from('user_task_status')
    .upsert({
      user_id: userId,
      task_id: taskId,
      status,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,task_id' });
  
  if (error) throw error;
  return data;
}

export async function setTaskReminder(
  userId: string,
  taskId: number,
  reminderDate: Date
) {
  // Create reminder in database
  const { data, error } = await supabase
    .from('user_task_status')
    .upsert({
      user_id: userId,
      task_id: taskId,
      reminder_date: reminderDate.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,task_id' });
  
  if (error) throw error;
  
  // TODO: Schedule email reminder (use Vercel Cron or Supabase Edge Function)
  
  return data;
}
