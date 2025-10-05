import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // Ensure Supabase environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase environment variables are not configured.');
    return NextResponse.json({
      success: false,
      error: 'Supabase URL or Key is not configured in environment variables.'
    }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    console.log(`📋 Loading tasks for user: ${userId}`);

    // Get user profile to determine segments
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('country_of_origin, has_kids, municipality, canton')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Determine user segments
    const userSegments = [];
    if (userData.country_of_origin && ['DE', 'FR', 'IT', 'AT', 'ES', 'NL', 'BE', 'NO', 'IS', 'LI'].includes(userData.country_of_origin)) {
      userSegments.push('EU/EFTA');
    } else if (userData.country_of_origin) {
      userSegments.push('Non-EU/EFTA');
    }
    if (userData.has_kids) {
      userSegments.push('with_kids');
    }
    userSegments.push('all');

    console.log(`👤 User segments:`, userSegments);

    // Get tasks with their variants
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        task_number,
        title,
        category,
        is_urgent,
        priority,
        icon_name,
        task_variants (
          id,
          target_audience,
          intro,
          info_box,
          ui_config,
          priority
        )
      `)
      .eq('id', 1) // Only load tasks 1-3 for now
      .or('id.eq.2,id.eq.3')
      .order('task_number', { ascending: true });

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      return NextResponse.json({
        success: false,
        error: tasksError.message
      }, { status: 500 });
    }

    // Filter tasks based on user segments
    const filteredTasks = tasks.map(task => ({
      ...task,
      variants: task.task_variants.filter((variant: any) => 
        variant.target_audience.some((audience: string) => userSegments.includes(audience))
      )
    })).filter(task => task.variants.length > 0);

    console.log(`✅ Loaded ${filteredTasks.length} tasks for user ${userId}`);
    return NextResponse.json({ 
      success: true, 
      tasks: filteredTasks,
      userSegments 
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error loading tasks:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}


