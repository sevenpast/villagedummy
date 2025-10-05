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
        title: "Secure residence permit / visa",
        description: "Make sure your legal right to stay in Switzerland is secured",
        status: "not_started",
        priority: "high",
        category: "legal",
        icon: "FileText"
      },
      {
        id: 2,
        title: "Find accommodation",
        description: "Secure your housing in Switzerland",
        status: "not_started",
        priority: "high",
        category: "housing",
        icon: "Home"
      },
      {
        id: 3,
        title: "Register at your Gemeinde (municipality)",
        description: "Make your residence official within 14 days of arrival",
        status: "not_started",
        priority: "high",
        category: "legal",
        icon: "Building"
      },
      {
        id: 4,
        title: "Register for school/kindergarten",
        description: "Register your kids for school right after arrival",
        status: "not_started",
        priority: "medium",
        category: "education",
        icon: "GraduationCap"
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