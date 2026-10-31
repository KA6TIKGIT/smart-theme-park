import { NextResponse } from 'next/server';
import { query, mockDb } from '@/lib/db/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const thrill = searchParams.get('thrill');
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        a.attraction_id,
        a.name,
        a.description,
        a.thrill_level,
        a.min_height_cm,
        a.hourly_capacity,
        a.current_wait_time,
        a.status,
        a.fastpass_available,
        a.rating,
        pz.zone_id,
        pz.zone_name,
        pz.theme AS zone_theme
      FROM attractions a
      JOIN park_zones pz ON a.zone_id = pz.zone_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (zoneId && zoneId !== 'ALL') {
      params.push(parseInt(zoneId));
      sql += ` AND a.zone_id = $${params.length}`;
    }
    if (thrill && thrill !== 'ALL') {
      params.push(thrill);
      sql += ` AND a.thrill_level = $${params.length}`;
    }
    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }

    sql += ` ORDER BY a.attraction_id ASC`;

    const res = await query(sql, params);
    return NextResponse.json({
      success: true,
      data: res.rows,
      count: res.rowCount,
      dataSource: res.isMock ? 'Mock Relational Store' : 'PostgreSQL Database'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { attractionId, currentWaitTime, status } = body;

    if (!attractionId) {
      return NextResponse.json({ success: false, error: 'Attraction ID required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [attractionId];

    if (currentWaitTime !== undefined) {
      params.push(currentWaitTime);
      updates.push(`current_wait_time = $${params.length}`);
    }
    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const sql = `
      UPDATE attractions 
      SET ${updates.join(', ')} 
      WHERE attraction_id = $1 
      RETURNING *;
    `;

    const res = await query(sql, params);

    // Also update mock store if in mock mode
    if (res.isMock) {
      const item = mockDb.attractions.find(a => a.attraction_id === attractionId);
      if (item) {
        if (currentWaitTime !== undefined) item.current_wait_time = currentWaitTime;
        if (status) item.status = status;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Attraction updated successfully',
      data: res.rows[0] || { attractionId, currentWaitTime, status }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
