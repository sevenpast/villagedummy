import { NextRequest, NextResponse } from 'next/server';
import { DailyHousingJob } from '@/lib/housingScraper';

export async function POST(request: NextRequest) {
  try {
    console.log('Manually triggering daily housing job...');
    
    // Run the daily housing job
    const result = await DailyHousingJob.runDailyJob();
    
    console.log('Manual daily housing job completed:', result);

    return NextResponse.json({
      success: result.success,
      message: `Manual trigger completed - processed ${result.processed} users`,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manual daily housing job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Manual daily housing job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow GET for easy testing
export async function GET() {
  try {
    console.log('Testing manual daily housing job...');
    
    const result = await DailyHousingJob.runDailyJob();
    
    return NextResponse.json({
      success: result.success,
      message: `Test manual trigger completed - processed ${result.processed} users`,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test manual daily housing job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test manual daily housing job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
