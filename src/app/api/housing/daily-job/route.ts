import { NextRequest, NextResponse } from 'next/server';
import { DailyHousingJob } from '@/lib/housingScraper';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (optional - you might want to add API key validation)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily housing job...');
    
    // Run the daily housing job
    const result = await DailyHousingJob.runDailyJob();
    
    console.log('Daily housing job completed:', result);

    return NextResponse.json({
      success: result.success,
      message: `Processed ${result.processed} users`,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Daily housing job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Daily housing job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow GET for testing purposes
export async function GET() {
  try {
    console.log('Testing daily housing job...');
    
    const result = await DailyHousingJob.runDailyJob();
    
    return NextResponse.json({
      success: result.success,
      message: `Test completed - processed ${result.processed} users`,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test daily housing job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test daily housing job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
