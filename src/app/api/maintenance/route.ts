import { NextResponse } from 'next/server';
import { query, testPostgresConnection, mockDb } from '@/lib/db/postgres';

export async function GET() {
  try {
    const sql = `
      SELECT 
        m.log_id,
        m.attraction_id,
        a.name AS attraction_name,
        u.full_name AS reported_by_name,
        m.incident_description,
        m.severity,
        m.status,
        m.scheduled_end,
        m.created_at
      FROM maintenance_logs m
      JOIN attractions a ON m.attraction_id = a.attraction_id
      JOIN users u ON m.reported_by = u.user_id
      ORDER BY m.created_at DESC;
    `;
    const res = await query(sql);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attractionId, reportedBy, description, severity } = body;

    if (!attractionId || !description || !severity) {
      return NextResponse.json({ success: false, error: 'Missing required maintenance fields' }, { status: 400 });
    }

    const isLive = await testPostgresConnection();
    if (isLive) {
      const sql = `SELECT sp_report_maintenance_incident($1, $2, $3, $4) AS log_id;`;
      const res = await query(sql, [attractionId, reportedBy || 3, description, severity]);
      return NextResponse.json({
        success: true,
        message: 'Maintenance incident filed. Ride status auto-updated to MAINTENANCE via stored procedure.',
        logId: res.rows[0]?.log_id
      });
    }

    // Mock stored procedure simulation
    const logId = mockDb.maintenance.length + 1;
    const newLog = {
      log_id: logId,
      attraction_id: attractionId,
      reported_by: reportedBy || 3,
      incident_description: description,
      severity: severity,
      status: 'IN_PROGRESS',
      created_at: new Date().toISOString()
    };
    mockDb.maintenance.unshift(newLog);

    // Update attraction status to MAINTENANCE
    const attraction = mockDb.attractions.find(a => a.attraction_id === attractionId);
    if (attraction) {
      attraction.status = 'MAINTENANCE';
      attraction.current_wait_time = 0;
    }

    // Insert mock audit log
    mockDb.audit.unshift({
      audit_id: mockDb.audit.length + 1,
      action_type: 'MAINTENANCE_TRIGGERED',
      table_name: 'maintenance_logs',
      record_id: logId,
      details: { attraction_id: attractionId, severity, reason: description },
      performed_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance incident filed. Attraction automatically switched to MAINTENANCE state.',
      data: newLog
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
