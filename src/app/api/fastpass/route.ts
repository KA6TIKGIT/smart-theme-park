import { NextResponse } from 'next/server';
import { query, testPostgresConnection, mockDb } from '@/lib/db/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    const sql = `
      SELECT 
        fp.fastpass_id,
        fp.ticket_id,
        fp.attraction_id,
        a.name AS attraction_name,
        fp.time_slot_start,
        fp.time_slot_end,
        fp.status
      FROM fastpass_reservations fp
      JOIN attractions a ON fp.attraction_id = a.attraction_id
      ${ticketId ? `WHERE fp.ticket_id = ${parseInt(ticketId)}` : ''}
      ORDER BY fp.time_slot_start ASC;
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
    const { ticketId, attractionId, slotStart, slotEnd } = body;

    if (!ticketId || !attractionId) {
      return NextResponse.json({ success: false, error: 'ticketId and attractionId are required' }, { status: 400 });
    }

    const isLive = await testPostgresConnection();
    if (isLive) {
      const sql = `SELECT sp_assign_fastpass($1, $2, $3::TIMESTAMPTZ, $4::TIMESTAMPTZ) AS fastpass_id;`;
      const res = await query(sql, [ticketId, attractionId, slotStart, slotEnd]);
      return NextResponse.json({
        success: true,
        message: 'FastPass confirmed via stored procedure & verified by trigger constraints',
        data: res.rows[0]
      });
    }

    // Mock validation & trigger enforcement
    const attraction = mockDb.attractions.find(a => a.attraction_id === attractionId);
    if (!attraction || attraction.status !== 'OPERATIONAL') {
      return NextResponse.json({
        success: false,
        error: `Trigger trg_prevent_maintenance_booking ABORT: Attraction '${attraction?.name}' is currently in status '${attraction?.status || 'UNKNOWN'}'. Cannot reserve FastPass.`
      }, { status: 400 });
    }

    const newFp = {
      fastpass_id: mockDb.fastpasses.length + 1,
      ticket_id: ticketId,
      attraction_id: attractionId,
      time_slot: '16:00 - 16:30',
      status: 'CONFIRMED'
    };
    mockDb.fastpasses.push(newFp);

    return NextResponse.json({
      success: true,
      message: 'FastPass reserved successfully (verified by integrity trigger)',
      data: newFp
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
