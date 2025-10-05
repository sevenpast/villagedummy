import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // For now, return mock user data
    // In a real application, this would fetch from your database
    const userProfile = {
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '1990-01-15',
      gender: 'Male',
      address: 'Musterstrasse 123',
      street: 'Musterstrasse',
      houseNumber: '123',
      postalCode: '8001',
      city: 'Zürich',
      phone: '+41 44 123 45 67',
      email: 'john.doe@example.com',
      nationality: 'German',
      passportNumber: 'P123456789',
      idNumber: 'ID123456789',
      hasChildren: 'Yes',
      childName: 'Jane Doe',
      childBirthDate: '2015-03-20'
    };

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user profile'
    }, { status: 500 });
  }
}
