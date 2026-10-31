-- ============================================================================
-- SMART THEME PARK OPERATIONS AND PERSONALIZED VISITOR EXPERIENCE SYSTEM
-- Relational Database Schema (PostgreSQL)
-- Course: DBMS Experiential Learning - Level 3 Project
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Note: pgvector extension is created here if available; vector scripts handle fallback gracefully
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. DROP EXISTING OBJECTS (TEARDOWN PREPARATION)
-- ============================================================================
DROP VIEW IF EXISTS v_zone_crowd_density CASCADE;
DROP VIEW IF EXISTS v_visitor_expenditure_analytics CASCADE;
DROP VIEW IF EXISTS v_daily_revenue_analytics CASCADE;
DROP VIEW IF EXISTS v_live_attraction_status CASCADE;

DROP TRIGGER IF EXISTS trg_audit_ticket_cancellation_trigger ON tickets;
DROP TRIGGER IF EXISTS trg_prevent_maintenance_booking_trigger ON fastpass_reservations;
DROP TRIGGER IF EXISTS trg_update_zone_occupancy_trigger ON tickets;

DROP FUNCTION IF EXISTS fn_audit_ticket_cancellation();
DROP FUNCTION IF EXISTS fn_prevent_maintenance_booking();
DROP FUNCTION IF EXISTS fn_update_zone_occupancy();
DROP FUNCTION IF EXISTS calculate_park_crowd_index();
DROP FUNCTION IF EXISTS sp_book_tickets(INT, INT, INT, DATE);
DROP FUNCTION IF EXISTS sp_assign_fastpass(INT, INT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS sp_report_maintenance_incident(INT, INT, TEXT, VARCHAR);

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS fastpass_reservations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS ticket_tiers CASCADE;
DROP TABLE IF EXISTS attractions CASCADE;
DROP TABLE IF EXISTS park_zones CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 2. DDL: CORE ENTITIES & RELATIONAL STRUCTURE
-- ============================================================================

-- Table: USERS (Role-based access: ADMIN, OPERATOR, VISITOR)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VISITOR',
    phone VARCHAR(20),
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'OPERATOR', 'VISITOR')),
    CONSTRAINT chk_wallet_positive CHECK (wallet_balance >= 0)
);

-- Table: PARK_ZONES (Thematic sections across the park)
CREATE TABLE park_zones (
    zone_id SERIAL PRIMARY KEY,
    zone_name VARCHAR(80) NOT NULL UNIQUE,
    theme VARCHAR(100) NOT NULL,
    max_capacity INT NOT NULL,
    current_occupancy INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_max_capacity_positive CHECK (max_capacity > 0),
    CONSTRAINT chk_current_occupancy_valid CHECK (current_occupancy >= 0 AND current_occupancy <= max_capacity * 1.2)
);

-- Table: ATTRACTIONS (Rides, coasters, shows with thrill levels & wait times)
CREATE TABLE attractions (
    attraction_id SERIAL PRIMARY KEY,
    zone_id INT NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    thrill_level VARCHAR(20) NOT NULL DEFAULT 'MODERATE',
    min_height_cm INT NOT NULL DEFAULT 0,
    hourly_capacity INT NOT NULL,
    current_wait_time INT NOT NULL DEFAULT 5,
    status VARCHAR(20) NOT NULL DEFAULT 'OPERATIONAL',
    fastpass_available BOOLEAN NOT NULL DEFAULT TRUE,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 4.5,
    embedding vector(384), -- Vector embeddings for semantic search & personalization
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attraction_zone FOREIGN KEY (zone_id) 
        REFERENCES park_zones(zone_id) ON DELETE RESTRICT,
    CONSTRAINT chk_thrill_level CHECK (thrill_level IN ('LOW', 'MODERATE', 'HIGH', 'EXTREME')),
    CONSTRAINT chk_attraction_status CHECK (status IN ('OPERATIONAL', 'MAINTENANCE', 'CLOSED', 'WEATHER_HOLD')),
    CONSTRAINT chk_hourly_capacity CHECK (hourly_capacity > 0),
    CONSTRAINT chk_min_height CHECK (min_height_cm >= 0),
    CONSTRAINT chk_wait_time CHECK (current_wait_time >= 0),
    CONSTRAINT chk_rating CHECK (rating >= 1.0 AND rating <= 5.0)
);

-- Table: TICKET_TIERS (Pricing tiers and admission passes)
CREATE TABLE ticket_tiers (
    tier_id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    base_price NUMERIC(10, 2) NOT NULL,
    benefits TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tier_price CHECK (base_price > 0)
);

-- Table: BOOKINGS (ACID Transaction master table)
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    booking_reference VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_booking_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED'))
);

-- Table: TICKETS (Individual entrance passes generated from a booking)
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL,
    tier_id INT NOT NULL,
    ticket_code VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    entry_timestamp TIMESTAMP WITH TIME ZONE,
    exit_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_tier FOREIGN KEY (tier_id) 
        REFERENCES ticket_tiers(tier_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ticket_status CHECK (status IN ('ACTIVE', 'USED', 'CANCELLED', 'EXPIRED'))
);

-- Table: FASTPASS_RESERVATIONS (Personalized queue-skipping system)
CREATE TABLE fastpass_reservations (
    fastpass_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    attraction_id INT NOT NULL,
    time_slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fastpass_ticket FOREIGN KEY (ticket_id) 
        REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_fastpass_attraction FOREIGN KEY (attraction_id) 
        REFERENCES attractions(attraction_id) ON DELETE CASCADE,
    CONSTRAINT chk_fastpass_status CHECK (status IN ('CONFIRMED', 'REDEEMED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT chk_timeslot_validity CHECK (time_slot_end > time_slot_start)
);

-- Table: MAINTENANCE_LOGS (Incident reporting and downtime tracking)
CREATE TABLE maintenance_logs (
    log_id SERIAL PRIMARY KEY,
    attraction_id INT NOT NULL,
    reported_by INT NOT NULL,
    incident_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    scheduled_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_attraction FOREIGN KEY (attraction_id) 
        REFERENCES attractions(attraction_id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_reporter FOREIGN KEY (reported_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_maintenance_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_maintenance_status CHECK (status IN ('REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
);

-- Table: AUDIT_LOGS (Automated regulatory and security change tracking)
CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    details JSONB,
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. INDEXING (Performance Optimization & Vector Indexing)
-- ============================================================================

-- B-Tree indexes on foreign keys
CREATE INDEX idx_attractions_zone ON attractions(zone_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_tier ON tickets(tier_id);
CREATE INDEX idx_fastpass_ticket ON fastpass_reservations(ticket_id);
CREATE INDEX idx_fastpass_attraction ON fastpass_reservations(attraction_id);
CREATE INDEX idx_maintenance_attraction ON maintenance_logs(attraction_id);

-- Composite indexes for frequent queries
CREATE INDEX idx_tickets_date_status ON tickets(status, created_at);
CREATE INDEX idx_fastpass_slot ON fastpass_reservations(attraction_id, time_slot_start, status);
CREATE INDEX idx_bookings_date ON bookings(booking_date, payment_status);

-- Partial index for active maintenance investigations
CREATE INDEX idx_active_maintenance ON maintenance_logs(attraction_id, severity) 
    WHERE status IN ('REPORTED', 'IN_PROGRESS');

-- Full-Text Search GIN index on attraction descriptions
CREATE INDEX idx_attractions_fts ON attractions 
    USING gin(to_tsvector('english', name || ' ' || description));

-- Vector Index using HNSW for cosine distance (if pgvector is installed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_attractions_vector_hnsw ON attractions USING hnsw (embedding vector_cosine_ops)';
    END IF;
END $$;

-- ============================================================================
-- 4. DATABASE VIEWS
-- ============================================================================

-- View 1: Real-time Live Attraction Status with Active Zone Details
CREATE VIEW v_live_attraction_status AS
SELECT 
    a.attraction_id,
    a.name AS attraction_name,
    pz.zone_name,
    pz.theme AS zone_theme,
    a.thrill_level,
    a.min_height_cm,
    a.hourly_capacity,
    a.current_wait_time,
    a.status AS attraction_status,
    a.fastpass_available,
    a.rating,
    COUNT(m.log_id) FILTER (WHERE m.status IN ('REPORTED', 'IN_PROGRESS')) AS active_maintenance_issues
FROM attractions a
JOIN park_zones pz ON a.zone_id = pz.zone_id
LEFT JOIN maintenance_logs m ON a.attraction_id = m.attraction_id
GROUP BY 
    a.attraction_id, a.name, pz.zone_name, pz.theme, a.thrill_level, 
    a.min_height_cm, a.hourly_capacity, a.current_wait_time, a.status, 
    a.fastpass_available, a.rating;

-- View 2: Daily Revenue Analytics grouped by Ticket Tier & Date
CREATE VIEW v_daily_revenue_analytics AS
SELECT 
    b.booking_date,
    tt.tier_name,
    COUNT(t.ticket_id) AS total_tickets_sold,
    SUM(tt.base_price) AS tier_revenue,
    AVG(b.total_amount) AS avg_booking_value,
    COUNT(DISTINCT b.booking_id) AS unique_transactions
FROM bookings b
JOIN tickets t ON b.booking_id = t.booking_id
JOIN ticket_tiers tt ON t.tier_id = tt.tier_id
WHERE b.payment_status = 'PAID'
GROUP BY b.booking_date, tt.tier_name;

-- View 3: Visitor Expenditure & Engagement Ranking
CREATE VIEW v_visitor_expenditure_analytics AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT b.booking_id) AS total_bookings_count,
    COUNT(t.ticket_id) AS total_tickets_purchased,
    COALESCE(SUM(b.total_amount), 0.00) AS total_lifetime_spent,
    MAX(b.created_at) AS last_visit_date
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id AND b.payment_status = 'PAID'
LEFT JOIN tickets t ON b.booking_id = t.booking_id
WHERE u.role = 'VISITOR'
GROUP BY u.user_id, u.full_name, u.email;

-- View 4: Zone Crowd Density and Capacity Utilization
CREATE VIEW v_zone_crowd_density AS
SELECT 
    pz.zone_id,
    pz.zone_name,
    pz.theme,
    pz.max_capacity,
    pz.current_occupancy,
    ROUND((pz.current_occupancy::NUMERIC / pz.max_capacity) * 100, 2) AS occupancy_percentage,
    CASE 
        WHEN (pz.current_occupancy::NUMERIC / pz.max_capacity) >= 0.90 THEN 'CRITICAL_CONGESTION'
        WHEN (pz.current_occupancy::NUMERIC / pz.max_capacity) >= 0.70 THEN 'HIGH_DENSITY'
        WHEN (pz.current_occupancy::NUMERIC / pz.max_capacity) >= 0.40 THEN 'MODERATE'
        ELSE 'LOW_COMFORTABLE'
    END AS crowd_status,
    COUNT(a.attraction_id) AS total_attractions,
    COALESCE(AVG(a.current_wait_time), 0) AS avg_zone_wait_time
FROM park_zones pz
LEFT JOIN attractions a ON pz.zone_id = a.zone_id AND a.status = 'OPERATIONAL'
GROUP BY pz.zone_id, pz.zone_name, pz.theme, pz.max_capacity, pz.current_occupancy;

-- ============================================================================
-- 5. STORED PROCEDURES & FUNCTIONS
-- ============================================================================

-- Stored Procedure / Function 1: Atomic Ticket Booking with Concurrency Lock
CREATE OR REPLACE FUNCTION sp_book_tickets(
    p_user_id INT,
    p_tier_id INT,
    p_ticket_count INT,
    p_booking_date DATE
)
RETURNS TABLE (
    out_booking_id INT,
    out_reference VARCHAR(50),
    out_total_price NUMERIC(10, 2),
    out_status VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_unit_price NUMERIC(10, 2);
    v_total_cost NUMERIC(10, 2);
    v_user_balance NUMERIC(10, 2);
    v_booking_ref VARCHAR(50);
    v_new_booking_id INT;
    v_i INT;
    v_new_ticket_code VARCHAR(64);
BEGIN
    -- Verify ticket count
    IF p_ticket_count <= 0 THEN
        RAISE EXCEPTION 'Ticket count must be at least 1';
    END IF;

    -- Concurrency check & lock user row
    SELECT wallet_balance INTO v_user_balance
    FROM users
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    -- Fetch tier price
    SELECT base_price INTO v_unit_price
    FROM ticket_tiers
    WHERE tier_id = p_tier_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or inactive ticket tier: %', p_tier_id;
    END IF;

    v_total_cost := v_unit_price * p_ticket_count;

    -- Check wallet balance
    IF v_user_balance < v_total_cost THEN
        RAISE EXCEPTION 'Insufficient balance: requires $%, available $%', v_total_cost, v_user_balance;
    END IF;

    -- Deduct wallet balance
    UPDATE users
    SET wallet_balance = wallet_balance - v_total_cost
    WHERE user_id = p_user_id;

    -- Generate unique booking reference
    v_booking_ref := 'BK-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    -- Insert Booking record
    INSERT INTO bookings (user_id, booking_date, total_amount, payment_status, booking_reference)
    VALUES (p_user_id, p_booking_date, v_total_cost, 'PAID', v_booking_ref)
    RETURNING booking_id INTO v_new_booking_id;

    -- Issue individual tickets
    FOR v_i IN 1..p_ticket_count LOOP
        v_new_ticket_code := 'TCK-' || v_new_booking_id || '-' || v_i || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
        INSERT INTO tickets (booking_id, tier_id, ticket_code, status)
        VALUES (v_new_booking_id, p_tier_id, v_new_ticket_code, 'ACTIVE');
    END LOOP;

    -- Log transaction
    INSERT INTO audit_logs (action_type, table_name, record_id, details)
    VALUES (
        'BOOKING_CREATED', 
        'bookings', 
        v_new_booking_id, 
        json_build_object('tickets_issued', p_ticket_count, 'amount', v_total_cost, 'reference', v_booking_ref)
    );

    RETURN QUERY SELECT v_new_booking_id, v_booking_ref, v_total_cost, 'PAID'::VARCHAR(20);
END;
$$;

-- Stored Procedure / Function 2: Assign FastPass with Quota Enforcement
CREATE OR REPLACE FUNCTION sp_assign_fastpass(
    p_ticket_id INT,
    p_attraction_id INT,
    p_slot_start TIMESTAMP WITH TIME ZONE,
    p_slot_end TIMESTAMP WITH TIME ZONE
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket_status VARCHAR(20);
    v_attr_status VARCHAR(20);
    v_existing_count INT;
    v_fastpass_id INT;
    c_max_slot_quota CONSTANT INT := 50;
BEGIN
    -- Verify Ticket is ACTIVE
    SELECT status INTO v_ticket_status
    FROM tickets
    WHERE ticket_id = p_ticket_id;

    IF v_ticket_status IS NULL OR v_ticket_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Ticket % is not active or does not exist', p_ticket_id;
    END IF;

    -- Verify Attraction is OPERATIONAL
    SELECT status INTO v_attr_status
    FROM attractions
    WHERE attraction_id = p_attraction_id;

    IF v_attr_status <> 'OPERATIONAL' THEN
        RAISE EXCEPTION 'Cannot book FastPass: Attraction is in status %', v_attr_status;
    END IF;

    -- Check Slot Quota
    SELECT COUNT(*) INTO v_existing_count
    FROM fastpass_reservations
    WHERE attraction_id = p_attraction_id
      AND time_slot_start = p_slot_start
      AND status = 'CONFIRMED';

    IF v_existing_count >= c_max_slot_quota THEN
        RAISE EXCEPTION 'Slot quota exceeded for attraction % at %', p_attraction_id, p_slot_start;
    END IF;

    -- Insert reservation
    INSERT INTO fastpass_reservations (ticket_id, attraction_id, time_slot_start, time_slot_end, status)
    VALUES (p_ticket_id, p_attraction_id, p_slot_start, p_slot_end, 'CONFIRMED')
    RETURNING fastpass_id INTO v_fastpass_id;

    RETURN v_fastpass_id;
END;
$$;

-- Stored Procedure / Function 3: Report Incident and Automate Ride Shutdown
CREATE OR REPLACE FUNCTION sp_report_maintenance_incident(
    p_attraction_id INT,
    p_reported_by INT,
    p_description TEXT,
    p_severity VARCHAR(20)
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id INT;
BEGIN
    -- Insert Maintenance Incident Log
    INSERT INTO maintenance_logs (attraction_id, reported_by, incident_description, severity, status)
    VALUES (p_attraction_id, p_reported_by, p_description, p_severity, 'IN_PROGRESS')
    RETURNING log_id INTO v_log_id;

    -- Update Attraction Status to MAINTENANCE automatically
    UPDATE attractions
    SET status = 'MAINTENANCE',
        current_wait_time = 0
    WHERE attraction_id = p_attraction_id;

    -- Audit log
    INSERT INTO audit_logs (action_type, table_name, record_id, details)
    VALUES (
        'MAINTENANCE_TRIGGERED', 
        'maintenance_logs', 
        v_log_id, 
        json_build_object('attraction_id', p_attraction_id, 'severity', p_severity, 'reason', p_description)
    );

    RETURN v_log_id;
END;
$$;

-- Stored Function 4: Dynamic Park Crowd Index Calculation
CREATE OR REPLACE FUNCTION calculate_park_crowd_index()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_capacity INT;
    v_total_occupancy INT;
    v_crowd_index INT;
BEGIN
    SELECT COALESCE(SUM(max_capacity), 1), COALESCE(SUM(current_occupancy), 0)
    INTO v_total_capacity, v_total_occupancy
    FROM park_zones
    WHERE is_active = TRUE;

    v_crowd_index := ROUND((v_total_occupancy::NUMERIC / v_total_capacity::NUMERIC) * 100);
    
    IF v_crowd_index > 100 THEN
        v_crowd_index := 100;
    END IF;

    RETURN v_crowd_index;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Trigger Function 1: Prevent FastPass Booking for Non-Operational Attractions
CREATE OR REPLACE FUNCTION fn_prevent_maintenance_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    SELECT status INTO v_status
    FROM attractions
    WHERE attraction_id = NEW.attraction_id;

    IF v_status <> 'OPERATIONAL' THEN
        RAISE EXCEPTION 'Trigger Abort: Cannot reserve FastPass for Attraction % because its status is %', 
            NEW.attraction_id, v_status;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_maintenance_booking_trigger
BEFORE INSERT ON fastpass_reservations
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_maintenance_booking();

-- Trigger Function 2: Automated Audit Logging on Ticket Cancellation
CREATE OR REPLACE FUNCTION fn_audit_ticket_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status <> 'CANCELLED' AND NEW.status = 'CANCELLED' THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, details)
        VALUES (
            'TICKET_CANCELLED',
            'tickets',
            NEW.ticket_id,
            json_build_object(
                'ticket_code', NEW.ticket_code,
                'booking_id', NEW.booking_id,
                'cancelled_at', CURRENT_TIMESTAMP
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_ticket_cancellation_trigger
AFTER UPDATE OF status ON tickets
FOR EACH ROW
EXECUTE FUNCTION fn_audit_ticket_cancellation();

-- Trigger Function 3: Zone Occupancy Real-Time Auto-Adjustment
CREATE OR REPLACE FUNCTION fn_update_zone_occupancy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_zone_id INT;
BEGIN
    -- When a ticket is scanned as USED (Entry)
    IF OLD.status = 'ACTIVE' AND NEW.status = 'USED' THEN
        -- Default entrance zone is Zone 1 (Main Street Plaza)
        UPDATE park_zones
        SET current_occupancy = LEAST(max_capacity, current_occupancy + 1)
        WHERE zone_id = 1;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_zone_occupancy_trigger
AFTER UPDATE OF status ON tickets
FOR EACH ROW
EXECUTE FUNCTION fn_update_zone_occupancy();
