const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

function makeVector(seedStr, dim = 384) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let vec = [];
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    let v = Math.sin(hash + i * 1.6180339887);
    vec.push(v);
    sumSq += v * v;
  }
  let norm = Math.sqrt(sumSq);
  return "[" + vec.map(x => (x / norm).toFixed(5)).join(",") + "]";
}

const adminHash = bcrypt.hashSync("admin123", 10);
const staffHash = bcrypt.hashSync("staff123", 10);
const visitorHash = bcrypt.hashSync("visitor123", 10);

const attractions = [
  { id: 1, zone: 2, name: "Apex Predator: Hyper Coaster", desc: "A colossal 75-meter electromagnetic launch rollercoaster with 4 inversions, reaching speeds over 120 km/h. Pure adrenaline rush for daring thrill seekers.", thrill: "EXTREME", minHeight: 140, cap: 1200, wait: 45, fp: true, rating: 4.9, kw: "extreme rollercoaster thrill high speed adrenaline loops" },
  { id: 2, zone: 2, name: "Quantum Leap 4D Dark Ride", desc: "Interactive dark coaster journey through cyberspace and neon-lit digital dimensions with synchronized motion seats and laser blasting.", thrill: "HIGH", minHeight: 110, cap: 900, wait: 35, fp: true, rating: 4.7, kw: "scifi futuristic 4d indoor dark ride cyberspace laser" },
  { id: 3, zone: 3, name: "Raptor Encounter River Safari", desc: "Expedition raft journey navigating through dense prehistoric river canyons flanked by animatronic velociraptors and towering brachiosaurs.", thrill: "MODERATE", minHeight: 100, cap: 1400, wait: 25, fp: true, rating: 4.6, kw: "jurassic dinosaurs water raft safari family friendly jungle" },
  { id: 4, zone: 3, name: "Sub-Zero Glacier Plunge", desc: "Heart-stopping 45-meter dual-flume water drop coaster splashing into glacial subterranean caverns. Prepare to get soaked!", thrill: "HIGH", minHeight: 120, cap: 850, wait: 50, fp: true, rating: 4.8, kw: "water coaster huge splash plunge drop soaked thrilling" },
  { id: 5, zone: 1, name: "Starlight Celestial Carousel", desc: "An ornate double-decker hand-carved celestial carousel illuminated by 5,000 warm LED stars. Perfect gentle family wonder.", thrill: "LOW", minHeight: 0, cap: 800, wait: 10, fp: false, rating: 4.3, kw: "gentle kids family carousel relax music stars magical" },
  { id: 6, zone: 1, name: "Skyline Panorama Gondola", desc: "Continuous cable gondola system offering breathtaking 360-degree aerial views of the entire theme park landscape and lake.", thrill: "LOW", minHeight: 0, cap: 1600, wait: 15, fp: false, rating: 4.5, kw: "aerial view gondola cable scenic relaxing transport photo vista" },
  { id: 7, zone: 4, name: "Mystic Manor Illusion Escape", desc: "Haunted gothic castle experience packed with holographic illusions, shifting staircases, and supernatural ghostly mysteries.", thrill: "HIGH", minHeight: 115, cap: 750, wait: 40, fp: true, rating: 4.8, kw: "spooky haunted illusion magic dark mystery ghost castle" },
  { id: 8, zone: 4, name: "Enchanted Whispering River", desc: "Tranquil botanical boat cruise floating through glowing bioluminescent flora, talking willow trees, and gentle sparkling waterfalls.", thrill: "LOW", minHeight: 0, cap: 1100, wait: 20, fp: true, rating: 4.4, kw: "fairy tale gentle boat nature magical water relaxing bioluminescent" }
];

let sql = `-- ============================================================================
-- SMART THEME PARK OPERATIONS AND PERSONALIZED VISITOR EXPERIENCE SYSTEM
-- Comprehensive Seed Data Script
-- Course: DBMS Experiential Learning - Level 3 Project
-- ============================================================================

-- Clean existing data
TRUNCATE audit_logs, maintenance_logs, fastpass_reservations, tickets, bookings, ticket_tiers, attractions, park_zones, users RESTART IDENTITY CASCADE;

-- 1. Insert Users (Admin, Operators, Visitors)
INSERT INTO users (user_id, full_name, email, password_hash, role, phone, wallet_balance) VALUES
(1, 'Chief Operations Director', 'admin@themepark.com', '${adminHash}', 'ADMIN', '+1-800-555-0101', 1000.00),
(2, 'Sarah Turnstile Lead', 'staff.sarah@themepark.com', '${staffHash}', 'OPERATOR', '+1-800-555-0102', 250.00),
(3, 'Marcus Ride Maintenance Eng', 'staff.marcus@themepark.com', '${staffHash}', 'OPERATOR', '+1-800-555-0103', 300.00),
(4, 'Alex Johnson', 'visitor.alex@gmail.com', '${visitorHash}', 'VISITOR', '+1-800-555-0111', 450.00),
(5, 'Priya Sharma', 'visitor.priya@gmail.com', '${visitorHash}', 'VISITOR', '+1-800-555-0112', 320.00),
(6, 'Liam O''Connor', 'visitor.liam@gmail.com', '${visitorHash}', 'VISITOR', '+1-800-555-0113', 180.00);

SELECT setval('users_user_id_seq', 6);

-- 2. Insert Park Zones
INSERT INTO park_zones (zone_id, zone_name, theme, max_capacity, current_occupancy, is_active) VALUES
(1, 'Main Adventure Boulevard', 'Grand Victorian & Welcome Esplanade', 3500, 1240, TRUE),
(2, 'Cyberpunk Metropolis', 'Futuristic Neo-Tokyo & Neon High-Tech', 2800, 1980, TRUE),
(3, 'Jurassic Lagoon', 'Prehistoric Jungle & Primeval Waterways', 3200, 2150, TRUE),
(4, 'Enchanted Mythic Woods', 'Fairytale Medieval & Arcane Wonders', 2500, 1420, TRUE);

SELECT setval('park_zones_zone_id_seq', 4);

-- 3. Insert Ticket Tiers
INSERT INTO ticket_tiers (tier_id, tier_name, base_price, benefits, is_active) VALUES
(1, 'Standard Day Pass', 59.99, 'Full park general admission, all regular queues, valid for 1 full operating day.', TRUE),
(2, 'VIP FastPass Plus', 119.99, 'Includes expedited FastPass queue access for all tier-1 thrill attractions and reserved night parade seating.', TRUE),
(3, 'Season Elite Pass', 249.99, 'Unlimited park visits all season, 20% discount on dining & merchandise, priority parking.', TRUE),
(4, 'Junior Explorer Pass', 39.99, 'Discounted admission for visitors under 12 or seniors 65+, access to all family rides.', TRUE);

SELECT setval('ticket_tiers_tier_id_seq', 4);

-- 4. Insert Attractions with Vector Embeddings
`;

for (const a of attractions) {
  const vec = makeVector(a.kw);
  sql += `INSERT INTO attractions (attraction_id, zone_id, name, description, thrill_level, min_height_cm, hourly_capacity, current_wait_time, status, fastpass_available, rating, embedding) VALUES
(${a.id}, ${a.zone}, '${a.name.replace(/'/g, "''")}', '${a.desc.replace(/'/g, "''")}', '${a.thrill}', ${a.minHeight}, ${a.cap}, ${a.wait}, 'OPERATIONAL', ${a.fp}, ${a.rating}, '${vec}');\n`;
}

sql += `\nSELECT setval('attractions_attraction_id_seq', 8);

-- 5. Insert Bookings
INSERT INTO bookings (booking_id, user_id, booking_date, total_amount, payment_status, booking_reference, created_at) VALUES
(1, 4, CURRENT_DATE, 119.99, 'PAID', 'BK-20261031-10041', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(2, 5, CURRENT_DATE, 239.98, 'PAID', 'BK-20261031-10042', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(3, 6, CURRENT_DATE, 59.99,  'PAID', 'BK-20261031-10043', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(4, 4, CURRENT_DATE - INTERVAL '5 days', 179.97, 'PAID', 'BK-20261026-09412', CURRENT_TIMESTAMP - INTERVAL '5 days');

SELECT setval('bookings_booking_id_seq', 4);

-- 6. Insert Tickets
INSERT INTO tickets (ticket_id, booking_id, tier_id, ticket_code, status, entry_timestamp) VALUES
(1, 1, 2, 'TCK-VIP-00101', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '2 hours 30 mins'),
(2, 2, 2, 'TCK-VIP-00201', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '1 hour 45 mins'),
(3, 2, 2, 'TCK-VIP-00202', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '1 hour 45 mins'),
(4, 3, 1, 'TCK-STD-00301', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '40 mins'),
(5, 4, 1, 'TCK-STD-00401', 'USED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(6, 4, 1, 'TCK-STD-00402', 'USED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, 4, 1, 'TCK-STD-00403', 'USED', CURRENT_TIMESTAMP - INTERVAL '5 days');

SELECT setval('tickets_ticket_id_seq', 7);

-- 7. Insert FastPass Reservations
INSERT INTO fastpass_reservations (fastpass_id, ticket_id, attraction_id, time_slot_start, time_slot_end, status) VALUES
(1, 1, 1, CURRENT_TIMESTAMP + INTERVAL '30 mins', CURRENT_TIMESTAMP + INTERVAL '60 mins', 'CONFIRMED'),
(2, 2, 2, CURRENT_TIMESTAMP + INTERVAL '45 mins', CURRENT_TIMESTAMP + INTERVAL '75 mins', 'CONFIRMED'),
(3, 3, 2, CURRENT_TIMESTAMP + INTERVAL '45 mins', CURRENT_TIMESTAMP + INTERVAL '75 mins', 'CONFIRMED'),
(4, 1, 4, CURRENT_TIMESTAMP + INTERVAL '120 mins', CURRENT_TIMESTAMP + INTERVAL '150 mins', 'CONFIRMED');

SELECT setval('fastpass_reservations_fastpass_id_seq', 4);

-- 8. Insert Maintenance Logs
INSERT INTO maintenance_logs (log_id, attraction_id, reported_by, incident_description, severity, status, scheduled_end) VALUES
(1, 4, 3, 'Flume track drainage sensor intermittent voltage spike. Pre-emptive inspection underway.', 'MEDIUM', 'IN_PROGRESS', CURRENT_TIMESTAMP + INTERVAL '2 hours'),
(2, 1, 3, 'Pre-flight hydraulic clamp calibration completed successfully during morning safety drill.', 'LOW', 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '4 hours');

SELECT setval('maintenance_logs_log_id_seq', 2);

-- 9. Insert Audit Logs
INSERT INTO audit_logs (audit_id, action_type, table_name, record_id, details) VALUES
(1, 'SYSTEM_INIT', 'users', 1, '{"message": "Smart Theme Park Database successfully initialized with Level 3 requirements."}'),
(2, 'BOOKING_CREATED', 'bookings', 1, '{"booking_ref": "BK-20261031-10041", "tier": "VIP FastPass Plus", "amount": 119.99}'),
(3, 'MAINTENANCE_TRIGGERED', 'maintenance_logs', 1, '{"attraction": "Sub-Zero Glacier Plunge", "status": "IN_PROGRESS"}');

SELECT setval('audit_logs_audit_id_seq', 3);
`;

const outputPath = path.join(__dirname, "..", "database", "seed.sql");
fs.writeFileSync(outputPath, sql);
console.log("Wrote seed SQL to:", outputPath);
