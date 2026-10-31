import { Pool, QueryResult } from 'pg';

// Connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://themepark_admin:themepark_secure_password@localhost:5432/smart_theme_park_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

let isPostgresAvailable: boolean | null = null;

// Initial in-memory mock state for seamless offline demonstration if PostgreSQL service isn't active
const mockDb = {
  zones: [
    { zone_id: 1, zone_name: 'Main Adventure Boulevard', theme: 'Grand Victorian & Welcome Esplanade', max_capacity: 3500, current_occupancy: 1240, is_active: true },
    { zone_id: 2, zone_name: 'Cyberpunk Metropolis', theme: 'Futuristic Neo-Tokyo & Neon High-Tech', max_capacity: 2800, current_occupancy: 1980, is_active: true },
    { zone_id: 3, zone_name: 'Jurassic Lagoon', theme: 'Prehistoric Jungle & Primeval Waterways', max_capacity: 3200, current_occupancy: 2150, is_active: true },
    { zone_id: 4, zone_name: 'Enchanted Mythic Woods', theme: 'Fairytale Medieval & Arcane Wonders', max_capacity: 2500, current_occupancy: 1420, is_active: true },
  ],
  attractions: [
    { attraction_id: 1, zone_id: 2, name: 'Apex Predator: Hyper Coaster', description: 'A colossal 75-meter electromagnetic launch rollercoaster with 4 inversions, reaching speeds over 120 km/h. Pure adrenaline rush for daring thrill seekers.', thrill_level: 'EXTREME', min_height_cm: 140, hourly_capacity: 1200, current_wait_time: 45, status: 'OPERATIONAL', fastpass_available: true, rating: 4.9 },
    { attraction_id: 2, zone_id: 2, name: 'Quantum Leap 4D Dark Ride', description: 'Interactive dark coaster journey through cyberspace and neon-lit digital dimensions with synchronized motion seats and laser blasting.', thrill_level: 'HIGH', min_height_cm: 110, hourly_capacity: 900, current_wait_time: 35, status: 'OPERATIONAL', fastpass_available: true, rating: 4.7 },
    { attraction_id: 3, zone_id: 3, name: 'Raptor Encounter River Safari', description: 'Expedition raft journey navigating through dense prehistoric river canyons flanked by animatronic velociraptors and towering brachiosaurs.', thrill_level: 'MODERATE', min_height_cm: 100, hourly_capacity: 1400, current_wait_time: 25, status: 'OPERATIONAL', fastpass_available: true, rating: 4.6 },
    { attraction_id: 4, zone_id: 3, name: 'Sub-Zero Glacier Plunge', description: 'Heart-stopping 45-meter dual-flume water drop coaster splashing into glacial subterranean caverns. Prepare to get soaked!', thrill_level: 'HIGH', min_height_cm: 120, hourly_capacity: 850, current_wait_time: 50, status: 'OPERATIONAL', fastpass_available: true, rating: 4.8 },
    { attraction_id: 5, zone_id: 1, name: 'Starlight Celestial Carousel', description: 'An ornate double-decker hand-carved celestial carousel illuminated by 5,000 warm LED stars. Perfect gentle family wonder.', thrill_level: 'LOW', min_height_cm: 0, hourly_capacity: 800, current_wait_time: 10, status: 'OPERATIONAL', fastpass_available: false, rating: 4.3 },
    { attraction_id: 6, zone_id: 1, name: 'Skyline Panorama Gondola', description: 'Continuous cable gondola system offering breathtaking 360-degree aerial views of the entire theme park landscape and lake.', thrill_level: 'LOW', min_height_cm: 0, hourly_capacity: 1600, current_wait_time: 15, status: 'OPERATIONAL', fastpass_available: false, rating: 4.5 },
    { attraction_id: 7, zone_id: 4, name: 'Mystic Manor Illusion Escape', description: 'Haunted gothic castle experience packed with holographic illusions, shifting staircases, and supernatural ghostly mysteries.', thrill_level: 'HIGH', min_height_cm: 115, hourly_capacity: 750, current_wait_time: 40, status: 'OPERATIONAL', fastpass_available: true, rating: 4.8 },
    { attraction_id: 8, zone_id: 4, name: 'Enchanted Whispering River', description: 'Tranquil botanical boat cruise floating through glowing bioluminescent flora, talking willow trees, and gentle sparkling waterfalls.', thrill_level: 'LOW', min_height_cm: 0, hourly_capacity: 1100, current_wait_time: 20, status: 'OPERATIONAL', fastpass_available: true, rating: 4.4 },
  ],
  users: [
    { user_id: 1, full_name: 'Chief Operations Director', email: 'admin@themepark.com', role: 'ADMIN', wallet_balance: 1000.00 },
    { user_id: 2, full_name: 'Sarah Turnstile Lead', email: 'staff.sarah@themepark.com', role: 'OPERATOR', wallet_balance: 250.00 },
    { user_id: 3, full_name: 'Marcus Maintenance Eng', email: 'staff.marcus@themepark.com', role: 'OPERATOR', wallet_balance: 300.00 },
    { user_id: 4, full_name: 'Alex Johnson', email: 'visitor.alex@gmail.com', role: 'VISITOR', wallet_balance: 450.00 },
    { user_id: 5, full_name: 'Priya Sharma', email: 'visitor.priya@gmail.com', role: 'VISITOR', wallet_balance: 320.00 },
    { user_id: 6, full_name: 'Liam O\'Connor', email: 'visitor.liam@gmail.com', role: 'VISITOR', wallet_balance: 180.00 },
  ],
  ticketTiers: [
    { tier_id: 1, tier_name: 'Standard Day Pass', base_price: 59.99, benefits: 'Full park general admission, all regular queues, valid 1 day.' },
    { tier_id: 2, tier_name: 'VIP FastPass Plus', base_price: 119.99, benefits: 'Expedited FastPass queues & parade reserved seating.' },
    { tier_id: 3, tier_name: 'Season Elite Pass', base_price: 249.99, benefits: 'Unlimited visits, 20% dining/merch discount, VIP parking.' },
    { tier_id: 4, tier_name: 'Junior Explorer Pass', base_price: 39.99, benefits: 'Kids <12 & seniors 65+, access to all family rides.' },
  ],
  bookings: [
    { booking_id: 1, user_id: 4, booking_date: '2026-10-31', total_amount: 119.99, payment_status: 'PAID', booking_reference: 'BK-20261031-10041' },
    { booking_id: 2, user_id: 5, booking_date: '2026-10-31', total_amount: 239.98, payment_status: 'PAID', booking_reference: 'BK-20261031-10042' },
    { booking_id: 3, user_id: 6, booking_date: '2026-10-31', total_amount: 59.99, payment_status: 'PAID', booking_reference: 'BK-20261031-10043' },
  ],
  tickets: [
    { ticket_id: 1, booking_id: 1, tier_id: 2, ticket_code: 'TCK-VIP-00101', status: 'ACTIVE' },
    { ticket_id: 2, booking_id: 2, tier_id: 2, ticket_code: 'TCK-VIP-00201', status: 'ACTIVE' },
    { ticket_id: 3, booking_id: 2, tier_id: 2, ticket_code: 'TCK-VIP-00202', status: 'ACTIVE' },
    { ticket_id: 4, booking_id: 3, tier_id: 1, ticket_code: 'TCK-STD-00301', status: 'ACTIVE' },
  ],
  fastpasses: [
    { fastpass_id: 1, ticket_id: 1, attraction_id: 1, time_slot: '14:30 - 15:00', status: 'CONFIRMED' },
    { fastpass_id: 2, ticket_id: 2, attraction_id: 2, time_slot: '15:00 - 15:30', status: 'CONFIRMED' },
  ],
  maintenance: [
    { log_id: 1, attraction_id: 4, reported_by: 3, incident_description: 'Flume track drainage sensor intermittent voltage spike. Pre-emptive inspection underway.', severity: 'MEDIUM', status: 'IN_PROGRESS', created_at: new Date().toISOString() },
  ],
  audit: [
    { audit_id: 1, action_type: 'SYSTEM_INIT', table_name: 'users', record_id: 1, details: { message: 'Database initialized.' } as Record<string, any>, performed_at: new Date().toISOString() }
  ] as Array<{ audit_id: number; action_type: string; table_name: string; record_id: number; details: Record<string, any>; performed_at: string }>
};

export async function testPostgresConnection(): Promise<boolean> {
  if (isPostgresAvailable !== null) return isPostgresAvailable;
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    isPostgresAvailable = true;
    console.log('✅ PostgreSQL connected successfully.');
    return true;
  } catch (err) {
    isPostgresAvailable = false;
    console.warn('⚠️ PostgreSQL offline or unconfigured. Falling back to high-fidelity mock relational engine.');
    return false;
  }
}

/**
 * Execute a SQL query against PostgreSQL with fallback mock handling
 */
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number; isMock: boolean }> {
  const isAvailable = await testPostgresConnection();
  if (isAvailable) {
    try {
      const res = await pool.query<any>(text, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length, isMock: false };
    } catch (err: any) {
      console.error('PostgreSQL execution error:', err.message);
      throw err;
    }
  }

  // Fallback mock SQL handler for instant out-of-the-box UI demonstration
  return executeMockSql<T>(text, params);
}

function executeMockSql<T>(text: string, params?: any[]): { rows: T[]; rowCount: number; isMock: boolean } {
  const upper = text.trim().toUpperCase();

  // Handle Attractions Select with Join
  if (upper.includes('FROM ATTRACTIONS') || upper.includes('V_LIVE_ATTRACTION_STATUS')) {
    const rows = mockDb.attractions.map(a => {
      const zone = mockDb.zones.find(z => z.zone_id === a.zone_id);
      const activeMaint = mockDb.maintenance.filter(m => m.attraction_id === a.attraction_id && m.status === 'IN_PROGRESS').length;
      return {
        ...a,
        attraction_name: a.name,
        zone_name: zone?.zone_name || 'Main Zone',
        zone_theme: zone?.theme || 'Default',
        attraction_status: a.status,
        active_maintenance_issues: activeMaint
      };
    }) as unknown as T[];
    return { rows, rowCount: rows.length, isMock: true };
  }

  // Handle Zones
  if (upper.includes('FROM PARK_ZONES') || upper.includes('V_ZONE_CROWD_DENSITY')) {
    const rows = mockDb.zones.map(z => ({
      ...z,
      occupancy_percentage: Math.round((z.current_occupancy / z.max_capacity) * 100),
      crowd_status: (z.current_occupancy / z.max_capacity) >= 0.7 ? 'HIGH_DENSITY' : 'MODERATE',
      total_attractions: mockDb.attractions.filter(a => a.zone_id === z.zone_id).length,
      avg_zone_wait_time: 25
    })) as unknown as T[];
    return { rows, rowCount: rows.length, isMock: true };
  }

  // Handle Ticket Tiers
  if (upper.includes('FROM TICKET_TIERS')) {
    return { rows: mockDb.ticketTiers as unknown as T[], rowCount: mockDb.ticketTiers.length, isMock: true };
  }

  // Handle Daily Revenue View
  if (upper.includes('V_DAILY_REVENUE_ANALYTICS')) {
    const rows = [
      { booking_date: '2026-10-31', tier_name: 'VIP FastPass Plus', total_tickets_sold: 28, tier_revenue: 3359.72, avg_booking_value: 142.50, unique_transactions: 24 },
      { booking_date: '2026-10-31', tier_name: 'Standard Day Pass', total_tickets_sold: 95, tier_revenue: 5699.05, avg_booking_value: 89.20, unique_transactions: 71 },
      { booking_date: '2026-10-31', tier_name: 'Season Elite Pass', total_tickets_sold: 12, tier_revenue: 2999.88, avg_booking_value: 249.99, unique_transactions: 12 },
      { booking_date: '2026-10-31', tier_name: 'Junior Explorer Pass', total_tickets_sold: 44, tier_revenue: 1759.56, avg_booking_value: 48.00, unique_transactions: 38 },
    ] as unknown as T[];
    return { rows, rowCount: rows.length, isMock: true };
  }

  // Handle Visitor Expenditure View
  if (upper.includes('V_VISITOR_EXPENDITURE_ANALYTICS')) {
    const rows = [
      { user_id: 4, full_name: 'Alex Johnson', email: 'visitor.alex@gmail.com', total_bookings_count: 3, total_tickets_purchased: 4, total_lifetime_spent: 359.97, last_visit_date: '2026-10-31' },
      { user_id: 5, full_name: 'Priya Sharma', email: 'visitor.priya@gmail.com', total_bookings_count: 2, total_tickets_purchased: 3, total_lifetime_spent: 239.98, last_visit_date: '2026-10-31' },
      { user_id: 6, full_name: 'Liam O\'Connor', email: 'visitor.liam@gmail.com', total_bookings_count: 1, total_tickets_purchased: 1, total_lifetime_spent: 59.99, last_visit_date: '2026-10-31' },
    ] as unknown as T[];
    return { rows, rowCount: rows.length, isMock: true };
  }

  // Handle Maintenance Logs
  if (upper.includes('FROM MAINTENANCE_LOGS')) {
    const rows = mockDb.maintenance.map(m => {
      const a = mockDb.attractions.find(attr => attr.attraction_id === m.attraction_id);
      return { ...m, attraction_name: a?.name || 'Ride' };
    }) as unknown as T[];
    return { rows, rowCount: rows.length, isMock: true };
  }

  // Handle Bookings & Tickets for user
  if (upper.includes('FROM TICKETS')) {
    const rows = mockDb.tickets.map(t => {
      const tier = mockDb.ticketTiers.find(ti => ti.tier_id === t.tier_id);
      return { ...t, tier_name: tier?.tier_name, base_price: tier?.base_price };
    }) as unknown as T[];
    return { rows, rowCount: rows.length, isMock: true };
  }

  // Generic fallback
  return { rows: [] as T[], rowCount: 0, isMock: true };
}

export { pool, mockDb };
