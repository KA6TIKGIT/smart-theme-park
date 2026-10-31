-- ============================================================================
-- SMART THEME PARK OPERATIONS AND PERSONALIZED VISITOR EXPERIENCE SYSTEM
-- Clean Teardown & DROP Statements
-- Course: DBMS Experiential Learning - Level 3 Project
-- ============================================================================

-- Drop Views in reverse dependency order
DROP VIEW IF EXISTS v_zone_crowd_density CASCADE;
DROP VIEW IF EXISTS v_visitor_expenditure_analytics CASCADE;
DROP VIEW IF EXISTS v_daily_revenue_analytics CASCADE;
DROP VIEW IF EXISTS v_live_attraction_status CASCADE;

-- Drop Triggers
DROP TRIGGER IF EXISTS trg_audit_ticket_cancellation_trigger ON tickets;
DROP TRIGGER IF EXISTS trg_prevent_maintenance_booking_trigger ON fastpass_reservations;
DROP TRIGGER IF EXISTS trg_update_zone_occupancy_trigger ON tickets;

-- Drop Trigger Functions and Stored Procedures
DROP FUNCTION IF EXISTS fn_audit_ticket_cancellation() CASCADE;
DROP FUNCTION IF EXISTS fn_prevent_maintenance_booking() CASCADE;
DROP FUNCTION IF EXISTS fn_update_zone_occupancy() CASCADE;
DROP FUNCTION IF EXISTS calculate_park_crowd_index() CASCADE;
DROP FUNCTION IF EXISTS sp_book_tickets(INT, INT, INT, DATE) CASCADE;
DROP FUNCTION IF EXISTS sp_assign_fastpass(INT, INT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS sp_report_maintenance_incident(INT, INT, TEXT, VARCHAR) CASCADE;

-- Drop Tables respecting Foreign Key hierarchy
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS fastpass_reservations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS ticket_tiers CASCADE;
DROP TABLE IF EXISTS attractions CASCADE;
DROP TABLE IF EXISTS park_zones CASCADE;
DROP TABLE IF EXISTS users CASCADE;
