import { NextRequest, NextResponse } from 'next/server';

// Real database storage (in-memory for demo)
const childrenDatabase: Map<string, any> = new Map();
const userChildrenIndex: Map<string, Set<string>> = new Map();

// Helper function to get user ID from localStorage data in request
function getUserIdFromRequest(): string {
  // For demo, we'll get this from the user session
  return 'user_1759462336453'; // This should come from real auth in production
}

// GET /api/children - Get all children for current user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();

    // Debug: Log current database state
    console.log(`DATABASE DEBUG: Total children in DB:`, childrenDatabase.size);
    console.log(`DATABASE DEBUG: User ${userId} children IDs:`, userChildrenIndex.get(userId));

    // Get children IDs for this user
    const userChildrenIds = userChildrenIndex.get(userId) || new Set();

    // Get all children data for this user
    const userChildren: any[] = [];
    for (const childId of userChildrenIds) {
      const child = childrenDatabase.get(childId);
      if (child && child.is_active !== false) {
        // Remove any mock nationality data
        const cleanChild = {
          ...child,
          nationality: child.nationality === 'Brazilian' ? '' : child.nationality || '',
          birth_place: child.birth_place === 'São Paulo' ? '' : child.birth_place || '',
          allergies: child.allergies === 'Peanut allergy' ? '' : child.allergies || '',
          preferred_language: child.preferred_language === 'Portuguese' ? '' : child.preferred_language || ''
        };
        userChildren.push(cleanChild);
        console.log(`DATABASE DEBUG: Cleaned child data:`, cleanChild);
      }
    }

    // Sort by creation date
    userChildren.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    console.log(`CLEAN API: Returning ${userChildren.length} children for user ${userId}`);

    return NextResponse.json({
      success: true,
      children: userChildren
    });

  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}

// POST /api/children - Add new child
export async function POST(request: NextRequest) {
  try {
    const childData = await request.json();

    // Validate required fields
    if (!childData.first_name || !childData.last_name || !childData.date_of_birth) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, date_of_birth' },
        { status: 400 }
      );
    }

    const userId = getUserIdFromRequest();
    const childId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newChild = {
      id: childId,
      user_id: userId,
      first_name: childData.first_name,
      last_name: childData.last_name,
      date_of_birth: childData.date_of_birth,
      gender: childData.gender || '',
      nationality: childData.nationality || '',
      birth_place: childData.birth_place || '',
      allergies: childData.allergies || '',
      medical_conditions: childData.medical_conditions || '',
      special_needs: childData.special_needs || '',
      previous_school: childData.previous_school || '',
      school_grade: childData.school_grade || '',
      preferred_language: childData.preferred_language || '',
      notes: childData.notes || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in database
    childrenDatabase.set(childId, newChild);

    // Update user index
    if (!userChildrenIndex.has(userId)) {
      userChildrenIndex.set(userId, new Set());
    }
    userChildrenIndex.get(userId)!.add(childId);

    console.log('DATABASE: Added new child:', newChild);

    return NextResponse.json({
      success: true,
      child: newChild
    });

  } catch (error) {
    console.error('Error adding child:', error);
    return NextResponse.json(
      { error: 'Failed to add child' },
      { status: 500 }
    );
  }
}

// PUT /api/children/[id] - Update existing child
export async function PUT(request: NextRequest) {
  try {
    const childData = await request.json();
    const { id } = childData;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing child ID' },
        { status: 400 }
      );
    }

    const userId = getUserIdFromRequest();

    // Check if child exists and belongs to current user
    const existingChild = childrenDatabase.get(id);
    if (!existingChild) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    if (existingChild.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this child' },
        { status: 403 }
      );
    }

    // Update child data in database
    const updatedChild = {
      ...existingChild,
      first_name: childData.first_name || existingChild.first_name,
      last_name: childData.last_name || existingChild.last_name,
      date_of_birth: childData.date_of_birth || existingChild.date_of_birth,
      gender: childData.gender !== undefined ? childData.gender : existingChild.gender,
      nationality: childData.nationality !== undefined ? childData.nationality : existingChild.nationality,
      birth_place: childData.birth_place !== undefined ? childData.birth_place : existingChild.birth_place,
      allergies: childData.allergies !== undefined ? childData.allergies : existingChild.allergies,
      medical_conditions: childData.medical_conditions !== undefined ? childData.medical_conditions : existingChild.medical_conditions,
      special_needs: childData.special_needs !== undefined ? childData.special_needs : existingChild.special_needs,
      previous_school: childData.previous_school !== undefined ? childData.previous_school : existingChild.previous_school,
      school_grade: childData.school_grade !== undefined ? childData.school_grade : existingChild.school_grade,
      preferred_language: childData.preferred_language !== undefined ? childData.preferred_language : existingChild.preferred_language,
      notes: childData.notes !== undefined ? childData.notes : existingChild.notes,
      updated_at: new Date().toISOString()
    };

    // Store updated child in database
    childrenDatabase.set(id, updatedChild);

    console.log('DATABASE: Updated child:', updatedChild);

    return NextResponse.json({
      success: true,
      child: updatedChild
    });

  } catch (error) {
    console.error('Error updating child:', error);
    return NextResponse.json(
      { error: 'Failed to update child' },
      { status: 500 }
    );
  }
}

// DELETE /api/children/[id] - Delete/deactivate child
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing child ID' },
        { status: 400 }
      );
    }

    const userId = getUserIdFromRequest();

    // Check if child exists and belongs to current user
    const existingChild = childrenDatabase.get(id);
    if (!existingChild) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    if (existingChild.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this child' },
        { status: 403 }
      );
    }

    // Soft delete - mark as inactive
    const deactivatedChild = {
      ...existingChild,
      is_active: false,
      updated_at: new Date().toISOString()
    };

    childrenDatabase.set(id, deactivatedChild);

    console.log('DATABASE: Deactivated child:', deactivatedChild);

    return NextResponse.json({
      success: true,
      message: 'Child deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting child:', error);
    return NextResponse.json(
      { error: 'Failed to delete child' },
      { status: 500 }
    );
  }
}