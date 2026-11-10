import { NextResponse } from 'next/server';
import { testDbConnection, query } from '@/lib/db';

export async function GET() {
  try {
    const status = await testDbConnection();
    
    if (!status.connected) {
      return NextResponse.json(status, { status: 503 });
    }

    // Query stats
    let projectCount = 0;
    let reportCount = 0;
    let resourceCount = 0;

    try {
      const [pRes] = await query('SELECT COUNT(*) as count FROM projects');
      projectCount = pRes?.count || 0;

      const [rRes] = await query('SELECT COUNT(*) as count FROM daily_reports');
      reportCount = rRes?.count || 0;

      const [mRes] = await query('SELECT COUNT(*) as count FROM master_resources');
      resourceCount = mRes?.count || 0;
    } catch (e) {
      console.warn('Error reading table counts:', e.message);
    }

    return NextResponse.json({
      ...status,
      stats: {
        projects: projectCount,
        daily_reports: reportCount,
        master_resources: resourceCount,
      }
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error.message,
    }, { status: 500 });
  }
}

