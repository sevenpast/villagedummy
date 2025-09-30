import { NextRequest, NextResponse } from 'next/server';
import { HousingListing } from '@/lib/housingScraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user's housing preferences from localStorage (in production, use database)
    const userPreferences = JSON.parse(localStorage.getItem(`user_preferences_${userId}`) || '{}');
    
    // Get stored listings for this user
    const storedListings = JSON.parse(localStorage.getItem(`housing_listings_${userId}`) || '[]');
    
    // If no stored listings, return empty array
    if (storedListings.length === 0) {
      return NextResponse.json({
        success: true,
        listings: [],
        message: 'No listings found. Daily job may not have run yet.',
        lastUpdated: null
      });
    }

    // Sort by match score and return top 3
    const topPicks = storedListings
      .sort((a: HousingListing, b: HousingListing) => b.match_score - a.match_score)
      .slice(0, 3);

    // Get the most recent update time
    const lastUpdated = storedListings.length > 0 
      ? Math.max(...storedListings.map((l: HousingListing) => new Date(l.scraped_at).getTime()))
      : null;

    return NextResponse.json({
      success: true,
      listings: topPicks,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
      totalListings: storedListings.length
    });

  } catch (error) {
    console.error('Error fetching top picks:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch top picks',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;
    
    if (!userId || !preferences) {
      return NextResponse.json({ error: 'userId and preferences are required' }, { status: 400 });
    }

    // Store user preferences
    localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(preferences));
    
    // Trigger immediate scraping for this user
    const { DailyHousingJob } = await import('@/lib/housingScraper');
    
    // Create a single-user job
    const result = await DailyHousingJob.runDailyJob();
    
    return NextResponse.json({
      success: true,
      message: 'Preferences saved and scraping triggered',
      processed: result.processed
    });

  } catch (error) {
    console.error('Error saving preferences:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
