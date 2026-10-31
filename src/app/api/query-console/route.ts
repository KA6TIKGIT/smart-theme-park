import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sql } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ success: false, error: 'SQL query required' }, { status: 400 });
    }

    const startTime = performance.now();
    const result = await query(sql);
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      sql,
      executionTimeMs: durationMs,
      rowCount: result.rowCount,
      columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
      rows: result.rows,
      isMock: result.isMock
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      executionTimeMs: 0
    }, { status: 400 });
  }
}
