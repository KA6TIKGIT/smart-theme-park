-- ============================================================================
-- SMART THEME PARK OPERATIONS AND PERSONALIZED VISITOR EXPERIENCE SYSTEM
-- Schema Evolution & ALTER Statements (Demonstrating DDL Alterations)
-- Course: DBMS Experiential Learning - Level 3 Project
-- ============================================================================

-- 1. Adding operational columns to existing tables
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS loyalty_points INT NOT NULL DEFAULT 0;

ALTER TABLE attractions 
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(255) DEFAULT '/attractions/default.jpg';

ALTER TABLE ticket_tiers 
ADD COLUMN IF NOT EXISTS seasonal_discount_pct NUMERIC(5, 2) DEFAULT 0.00;

-- 2. Modifying column types and defaults
ALTER TABLE park_zones 
ALTER COLUMN theme TYPE VARCHAR(150);

ALTER TABLE attractions 
ALTER COLUMN current_wait_time SET DEFAULT 15;

-- 3. Adding new business integrity CHECK constraints
ALTER TABLE users 
ADD CONSTRAINT chk_user_loyalty_non_negative 
CHECK (loyalty_points >= 0);

ALTER TABLE attractions 
ADD CONSTRAINT chk_attraction_name_length 
CHECK (char_length(name) >= 3);

ALTER TABLE ticket_tiers 
ADD CONSTRAINT chk_discount_range 
CHECK (seasonal_discount_pct >= 0.00 AND seasonal_discount_pct <= 100.00);

-- 4. Updating and replacing existing CHECK constraint on tickets to support REFUNDED status
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS chk_ticket_status;

ALTER TABLE tickets 
ADD CONSTRAINT chk_ticket_status 
CHECK (status IN ('ACTIVE', 'USED', 'CANCELLED', 'EXPIRED', 'REFUNDED'));

-- 5. Creating additional performance composite index via ALTER-level DDL
CREATE INDEX IF NOT EXISTS idx_attractions_zone_status 
ON attractions(zone_id, status);

CREATE INDEX IF NOT EXISTS idx_users_email_role 
ON users(email, role);
