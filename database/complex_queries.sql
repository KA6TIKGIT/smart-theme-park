-- ============================================================================
-- SMART THEME PARK OPERATIONS AND PERSONALIZED VISITOR EXPERIENCE SYSTEM
-- Comprehensive Complex SQL Queries Demonstration
-- Course: DBMS Experiential Learning - Level 3 Project
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: MULTI-TABLE INNER & LEFT JOIN WITH AGGREGATION & FILTERING
-- Business Goal: Calculate total revenue, tickets sold, and popular zones for active attractions
-- ----------------------------------------------------------------------------
SELECT 
    pz.zone_name,
    pz.theme,
    COUNT(DISTINCT a.attraction_id) AS total_attractions,
    COUNT(t.ticket_id) AS total_tickets_associated,
    COALESCE(SUM(b.total_amount), 0.00) AS total_zone_revenue,
    ROUND(AVG(a.current_wait_time), 1) AS avg_wait_time_mins
FROM park_zones pz
INNER JOIN attractions a ON pz.zone_id = a.zone_id
LEFT JOIN fastpass_reservations fp ON a.attraction_id = fp.attraction_id
LEFT JOIN tickets t ON fp.ticket_id = t.ticket_id
LEFT JOIN bookings b ON t.booking_id = b.booking_id AND b.payment_status = 'PAID'
WHERE pz.is_active = TRUE
GROUP BY pz.zone_id, pz.zone_name, pz.theme
ORDER BY total_zone_revenue DESC;

-- ----------------------------------------------------------------------------
-- QUERY 2: GROUP BY WITH HAVING CLAUSE
-- Business Goal: Identify high-density or bottleneck attractions with average wait times > 20 mins
-- ----------------------------------------------------------------------------
SELECT 
    a.thrill_level,
    COUNT(a.attraction_id) AS ride_count,
    ROUND(AVG(a.current_wait_time), 2) AS avg_wait_time,
    MAX(a.current_wait_time) AS longest_wait_time,
    SUM(a.hourly_capacity) AS combined_hourly_throughput
FROM attractions a
WHERE a.status = 'OPERATIONAL'
GROUP BY a.thrill_level
HAVING AVG(a.current_wait_time) >= 20.0
ORDER BY avg_wait_time DESC;

-- ----------------------------------------------------------------------------
-- QUERY 3: NESTED CORRELATED SUBQUERY
-- Business Goal: Find visitors whose lifetime spending exceeds the average lifetime spending of all visitors
-- ----------------------------------------------------------------------------
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    (SELECT SUM(b.total_amount) 
     FROM bookings b 
     WHERE b.user_id = u.user_id AND b.payment_status = 'PAID') AS visitor_total_spent
FROM users u
WHERE u.role = 'VISITOR'
  AND (
      SELECT COALESCE(SUM(b.total_amount), 0)
      FROM bookings b
      WHERE b.user_id = u.user_id AND b.payment_status = 'PAID'
  ) > (
      SELECT AVG(user_total)
      FROM (
          SELECT SUM(b2.total_amount) AS user_total
          FROM bookings b2
          JOIN users u2 ON b2.user_id = u2.user_id
          WHERE u2.role = 'VISITOR' AND b2.payment_status = 'PAID'
          GROUP BY u2.user_id
      ) AS avg_expenditure_subquery
  )
ORDER BY visitor_total_spent DESC;

-- ----------------------------------------------------------------------------
-- QUERY 4: COMMON TABLE EXPRESSION (CTE) & WINDOW FUNCTION (RANK / ROW_NUMBER)
-- Business Goal: Rank attractions within each park zone by current queue wait time
-- ----------------------------------------------------------------------------
WITH ZoneAttractionMetrics AS (
    SELECT 
        pz.zone_name,
        a.attraction_id,
        a.name AS attraction_name,
        a.thrill_level,
        a.current_wait_time,
        a.hourly_capacity,
        DENSE_RANK() OVER (
            PARTITION BY a.zone_id 
            ORDER BY a.current_wait_time DESC
        ) AS wait_rank_in_zone,
        ROUND(AVG(a.current_wait_time) OVER (PARTITION BY a.zone_id), 1) AS zone_avg_wait
    FROM attractions a
    JOIN park_zones pz ON a.zone_id = pz.zone_id
    WHERE a.status = 'OPERATIONAL'
)
SELECT 
    zone_name,
    wait_rank_in_zone,
    attraction_name,
    thrill_level,
    current_wait_time,
    zone_avg_wait,
    (current_wait_time - zone_avg_wait) AS deviation_from_zone_avg
FROM ZoneAttractionMetrics
ORDER BY zone_name, wait_rank_in_zone;

-- ----------------------------------------------------------------------------
-- QUERY 5: FULL-TEXT SEARCH (GIN INDEX POWERED)
-- Business Goal: Fast natural language keyword search matching visitor queries
-- ----------------------------------------------------------------------------
SELECT 
    attraction_id,
    name,
    thrill_level,
    description,
    ts_rank_cd(to_tsvector('english', name || ' ' || description), query) AS rank_score
FROM attractions, 
     to_tsquery('english', 'rollercoaster | splash | dinosaur') AS query
WHERE to_tsvector('english', name || ' ' || description) @@ query
ORDER BY rank_score DESC;

-- ----------------------------------------------------------------------------
-- QUERY 6: VECTOR SIMILARITY SEARCH (PGVECTOR COSINE DISTANCE)
-- Business Goal: Personalized AI recommendation based on visitor mood/preference vector
-- ----------------------------------------------------------------------------
-- Note: Replace $1 with visitor prompt embedding vector (384 dimensions)
-- Cosine distance (<=>) returns 0 for identical vectors, up to 2 for opposite.
-- Similarity score = 1 - cosine_distance
SELECT 
    attraction_id,
    name,
    thrill_level,
    current_wait_time,
    description,
    ROUND((1 - (embedding <=> '[0.052, -0.012, 0.089, 0.015, -0.043, 0.081, 0.002, -0.091, 0.034, 0.012, ...]'::vector))::NUMERIC, 4) AS match_score
FROM attractions
WHERE status = 'OPERATIONAL'
ORDER BY embedding <=> '[0.052, -0.012, 0.089, 0.015, -0.043, 0.081, 0.002, -0.091, 0.034, 0.012, ...]'::vector ASC
LIMIT 4;

-- ----------------------------------------------------------------------------
-- QUERY 7: TRANSACTION CONCURRENCY (ACID TICKET PURCHASE & QUOTA DEDUCTION)
-- ----------------------------------------------------------------------------
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 1. Check & Lock user row
SELECT wallet_balance FROM users WHERE user_id = 4 FOR UPDATE;

-- 2. Deduct funds ($59.99 for Standard Pass)
UPDATE users 
SET wallet_balance = wallet_balance - 59.99 
WHERE user_id = 4 AND wallet_balance >= 59.99;

-- 3. Insert Booking
INSERT INTO bookings (user_id, booking_date, total_amount, payment_status, booking_reference)
VALUES (4, CURRENT_DATE, 59.99, 'PAID', 'BK-DEMO-TX-0099')
RETURNING booking_id;

-- 4. Issue Ticket
INSERT INTO tickets (booking_id, tier_id, ticket_code, status)
VALUES (
    (SELECT booking_id FROM bookings WHERE booking_reference = 'BK-DEMO-TX-0099'),
    1,
    'TCK-TX-LIVE-0099',
    'ACTIVE'
);

COMMIT;
