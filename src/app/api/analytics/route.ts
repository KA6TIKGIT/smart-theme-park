import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export async function GET() {
  try {
    const [revenueRes, crowdRes, expenditureRes, liveStatusRes] = await Promise.all([
      query(`SELECT * FROM v_daily_revenue_analytics ORDER BY booking_date DESC, tier_revenue DESC`),
      query(`SELECT * FROM v_zone_crowd_density ORDER BY occupancy_percentage DESC`),
      query(`SELECT * FROM v_visitor_expenditure_analytics ORDER BY total_lifetime_spent DESC LIMIT 10`),
      query(`SELECT * FROM v_live_attraction_status ORDER BY current_wait_time DESC`)
    ]);

    return NextResponse.json({
      success: true,
      views: {
        dailyRevenue: revenueRes.rows,
        zoneCrowdDensity: crowdRes.rows,
        visitorExpenditure: expenditureRes.rows,
        liveAttractionStatus: liveStatusRes.rows
      },
      isMock: revenueRes.isMock
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
