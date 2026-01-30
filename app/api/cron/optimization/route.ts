import { NextRequest, NextResponse } from 'next/server';
import { OptimizationEngine } from '@/lib/optimization/engine';

// This endpoint should be called by Vercel Cron or external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting scheduled optimization run...');
    const engine = new OptimizationEngine();
    await engine.runScheduledRules();

    return NextResponse.json({
      success: true,
      message: 'Optimization rules executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in cron optimization:', error);
    return NextResponse.json(
      { error: 'Failed to execute optimization rules', details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time
