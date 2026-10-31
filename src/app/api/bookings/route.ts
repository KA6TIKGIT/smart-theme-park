import { NextResponse } from 'next/server';
import { query, pool, testPostgresConnection, mockDb } from '@/lib/db/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '4';

    const sql = `
      SELECT 
        b.booking_id,
        b.booking_reference,
        b.booking_date,
        b.total_amount,
        b.payment_status,
        b.created_at,
        json_agg(
          json_build_object(
            'ticket_id', t.ticket_id,
            'ticket_code', t.ticket_code,
            'tier_name', tt.tier_name,
            'status', t.status
          )
        ) AS tickets
      FROM bookings b
      JOIN tickets t ON b.booking_id = t.booking_id
      JOIN ticket_tiers tt ON t.tier_id = tt.tier_id
      WHERE b.user_id = $1
      GROUP BY b.booking_id, b.booking_reference, b.booking_date, b.total_amount, b.payment_status, b.created_at
      ORDER BY b.created_at DESC;
    `;

    const isLive = await testPostgresConnection();
    if (isLive) {
      const res = await query(sql, [parseInt(userId)]);
      return NextResponse.json({ success: true, data: res.rows });
    }

    // High-fidelity fallback for offline demo
    const userBookings = mockDb.bookings.filter(b => b.user_id === parseInt(userId)).map(b => {
      const bTickets = mockDb.tickets.filter(t => t.booking_id === b.booking_id).map(t => {
        const tier = mockDb.ticketTiers.find(ti => ti.tier_id === t.tier_id);
        return {
          ticket_id: t.ticket_id,
          ticket_code: t.ticket_code,
          tier_name: tier?.tier_name || 'Standard Pass',
          status: t.status
        };
      });
      return {
        ...b,
        tickets: bTickets
      };
    });

    return NextResponse.json({ success: true, data: userBookings, isMock: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, tierId, ticketCount, bookingDate } = body;

    if (!userId || !tierId || !ticketCount || ticketCount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid booking parameters' }, { status: 400 });
    }

    const isLive = await testPostgresConnection();
    if (isLive) {
      // Execute ACID Transaction using Stored Procedure sp_book_tickets
      const spSql = `SELECT * FROM sp_book_tickets($1, $2, $3, $4::DATE);`;
      const res = await pool.query(spSql, [userId, tierId, ticketCount, bookingDate || new Date().toISOString().split('T')[0]]);
      return NextResponse.json({
        success: true,
        message: 'Transaction successfully executed and committed via sp_book_tickets',
        data: res.rows[0]
      });
    }

    // Mock transactional simulation
    const tier = mockDb.ticketTiers.find(t => t.tier_id === tierId) || mockDb.ticketTiers[0];
    const totalCost = Number((tier.base_price * ticketCount).toFixed(2));
    const user = mockDb.users.find(u => u.user_id === userId);

    if (user && user.wallet_balance < totalCost) {
      return NextResponse.json({
        success: false,
        error: `Transaction Rolled Back: Insufficient wallet balance ($${user.wallet_balance} available, $${totalCost} required)`
      }, { status: 400 });
    }

    if (user) {
      user.wallet_balance = Number((user.wallet_balance - totalCost).toFixed(2));
    }

    const newBookingId = mockDb.bookings.length + 1;
    const ref = `BK-${Date.now().toString().slice(-8)}`;
    const newBooking = {
      booking_id: newBookingId,
      user_id: userId,
      booking_date: bookingDate || '2026-10-31',
      total_amount: totalCost,
      payment_status: 'PAID',
      booking_reference: ref,
    };
    mockDb.bookings.push(newBooking);

    const issuedTickets = [];
    for (let i = 1; i <= ticketCount; i++) {
      const code = `TCK-${newBookingId}-${i}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const ticket = {
        ticket_id: mockDb.tickets.length + 1,
        booking_id: newBookingId,
        tier_id: tierId,
        ticket_code: code,
        status: 'ACTIVE'
      };
      mockDb.tickets.push(ticket);
      issuedTickets.push(ticket);
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction committed (Mock ACID engine)',
      data: {
        out_booking_id: newBookingId,
        out_reference: ref,
        out_total_price: totalCost,
        out_status: 'PAID',
        tickets: issuedTickets
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
