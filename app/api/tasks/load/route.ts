import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId parameter' 
      }, { status: 400 });
    }

    console.log(`📋 Loading tasks for user: ${userId}`);

    // Mock tasks data - in a real app, this would come from the database
    const tasks = [
      {
        id: 1,
        task_number: 1,
        title: "Secure residence permit / visa",
        description: "Make sure your legal right to stay in Switzerland is secured",
        status: "not_started",
        priority: "high",
        category: "legal",
        icon: "FileText",
        initial_question: "Do you already have a residence permit or visa?",
        ui_config: {
          components: [
            {
              type: 'question_multiple',
              question: 'Do you already have a residence permit or visa?',
              options: [
                { value: 'yes', label: 'Yes, I have it', description: 'I already have my residence permit' },
                { value: 'no', label: 'No, I need to apply', description: 'I need to start the application process' }
              ]
            }
          ]
        }
      },
      {
        id: 2,
        task_number: 2,
        title: "Find housing",
        description: "Secure your housing in Switzerland",
        status: "not_started",
        priority: "high",
        category: "housing",
        icon: "Home",
        initial_question: "Do you already have housing arranged?"
      },
      {
        id: 3,
        task_number: 3,
        title: "Register at your Gemeinde (municipality)",
        description: "Make your residence official within 14 days of arrival",
        status: "not_started",
        priority: "high",
        category: "legal",
        icon: "Building",
        initial_question: "Have you already registered at your Gemeinde?",
        ui_config: {
          components: [
            {
              type: 'question_multiple',
              question: 'Have you already registered at your Gemeinde?',
              options: [
                { value: 'yes', label: 'Yes, I am registered', description: 'I have completed the registration' },
                { value: 'no', label: 'No, I need to register', description: 'I need to start the registration process' }
              ]
            }
          ]
        }
      },
      {
        id: 4,
        task_number: 4,
        title: "Register for School/Kindergarten",
        description: "Register your kids for school right after arrival",
        status: "not_started",
        priority: "medium",
        category: "family",
        icon: "GraduationCap",
        hasSpecialFlow: true
      },
      {
        id: 5,
        task_number: 5,
        title: "Open bank account",
        description: "Set up your Swiss banking",
        status: "not_started",
        priority: "medium",
        category: "banking",
        icon: "CreditCard"
      },
      {
        id: 6,
        task_number: 6,
        title: "Get health insurance",
        description: "Secure your health coverage",
        status: "not_started",
        priority: "high",
        category: "health",
        icon: "Heart"
      },
      {
        id: 7,
        task_number: 7,
        title: "Register for taxes",
        description: "Set up your tax obligations",
        status: "not_started",
        priority: "medium",
        category: "legal",
        icon: "FileText"
      },
      {
        id: 8,
        task_number: 8,
        title: "Set up internet and utilities",
        description: "Connect your home services",
        status: "not_started",
        priority: "low",
        category: "housing",
        icon: "Wifi"
      },
      {
        id: 9,
        task_number: 9,
        title: "Get a Swiss phone number",
        description: "Set up local communication",
        status: "not_started",
        priority: "medium",
        category: "communication",
        icon: "Phone"
      },
      {
        id: 10,
        task_number: 10,
        title: "Register for public transport",
        description: "Get your mobility sorted",
        status: "not_started",
        priority: "low",
        category: "transport",
        icon: "Bus"
      },
      {
        id: 11,
        task_number: 11,
        title: "Find a local doctor/GP",
        description: "Establish your healthcare",
        status: "not_started",
        priority: "medium",
        category: "health",
        icon: "Stethoscope"
      },
      {
        id: 12,
        task_number: 12,
        title: "Learn about Swiss customs and culture",
        description: "Integrate into Swiss society",
        status: "not_started",
        priority: "low",
        category: "culture",
        icon: "BookOpen"
      }
    ];

    // In a real app, you would load user-specific task status from database
    // For now, return the base tasks
    return NextResponse.json({
      success: true,
      tasks: tasks
    });

  } catch (error) {
    console.error('Load tasks error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error loading tasks'
    }, { status: 500 });
  }
}