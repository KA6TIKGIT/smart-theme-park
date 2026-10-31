# Smart Theme Park Operations and Personalized Visitor Experience System
## DBMS Experiential Learning – Level 3 Project Documentation
**Course:** Database Management Systems (DBMS Level 3)  
**Institution:** PES University  

---

## 1. Problem Statement & Motivation
Modern theme parks accommodate tens of thousands of guests daily across sprawling thematic zones. Operators encounter major logistical and computational challenges:
1. **Dynamic Congestion Bottlenecks:** Unpredictable queue spikes lead to visitor frustration and uneven zone density.
2. **Strict Transaction Concurrency & Scalping:** Rapid ticket bookings and limited FastPass quotas require ACID guarantees to avoid double-booking and overselling.
3. **High-Frequency Unstructured Telemetry:** Turnstile RFID/NFC gates, optical sensors, and ride accelerometers produce continuous, high-volume event streams that overload traditional relational schemas.
4. **Impersonal Visitor Experience:** Standard attraction lists fail to align with visitor mood, sensory preferences, or adrenaline cravings in real-time.

To address these challenges, this system implements a **tri-paradigm database architecture**:
- **Relational SQL (PostgreSQL):** For mission-critical ACID transactions, bookings, ticket issuance, role-based access, and operational views.
- **Document NoSQL (MongoDB):** For high-throughput IoT turnstile event ingestion, mechanical ride sensor telemetry, and flexible feedback logs.
- **Vector Database (pgvector):** For personalized semantic recommendation matching natural language visitor queries against 384-dimensional attraction embeddings using cosine similarity.

---

## 2. Multi-Paradigm Database Choice & Justification

| Paradigm | Database Engine | Data Handled | Justification |
| :--- | :--- | :--- | :--- |
| **SQL (Relational)** | PostgreSQL 16 | Users, Roles, Zones, Attractions, Bookings, Tickets, FastPass, Maintenance, Audit Logs | Strict ACID transactions, concurrency locking (`FOR UPDATE`), referential integrity (`FOREIGN KEY`), complex joins, stored procedures, and triggers. |
| **NoSQL (Document)** | MongoDB 7.0 | `iot_turnstile_events`, `ride_telemetry`, `visitor_experience_feedback` | High ingestion write throughput, polymorphic schema for varying sensor payloads, native time-series indexes, and multi-stage aggregation pipelines (`$group`, `$bucket`, `$match`). |
| **Vector DB** | PostgreSQL with `pgvector` | 384-dimensional dense vectors of attraction profiles & visitor vibe embeddings | Sub-millisecond Approximate Nearest Neighbor (ANN) search via HNSW indexes using Cosine Distance (`<=>`), bridging natural language visitor intent with theme park inventory. |

---

## 3. Relational Database Design (SQL)

### Entities & Relational Schema
1. **`users`**:
   - `user_id` (PK, SERIAL), `full_name` (VARCHAR), `email` (VARCHAR UNIQUE), `password_hash` (VARCHAR), `role` (VARCHAR CHECK IN 'ADMIN', 'OPERATOR', 'VISITOR'), `phone` (VARCHAR), `wallet_balance` (NUMERIC CHECK >= 0), `created_at` (TIMESTAMPTZ).
2. **`park_zones`**:
   - `zone_id` (PK, SERIAL), `zone_name` (VARCHAR UNIQUE), `theme` (VARCHAR), `max_capacity` (INT CHECK > 0), `current_occupancy` (INT CHECK >= 0), `is_active` (BOOLEAN).
3. **`attractions`**:
   - `attraction_id` (PK, SERIAL), `zone_id` (FK -> `park_zones.zone_id`), `name` (VARCHAR UNIQUE), `description` (TEXT), `thrill_level` (VARCHAR CHECK IN 'LOW', 'MODERATE', 'HIGH', 'EXTREME'), `min_height_cm` (INT), `hourly_capacity` (INT CHECK > 0), `current_wait_time` (INT), `status` (VARCHAR CHECK IN 'OPERATIONAL', 'MAINTENANCE', 'CLOSED', 'WEATHER_HOLD'), `fastpass_available` (BOOLEAN), `rating` (NUMERIC 1.0 to 5.0), `embedding` (vector(384)).
4. **`ticket_tiers`**:
   - `tier_id` (PK, SERIAL), `tier_name` (VARCHAR UNIQUE), `base_price` (NUMERIC CHECK > 0), `benefits` (TEXT), `is_active` (BOOLEAN).
5. **`bookings`**:
   - `booking_id` (PK, SERIAL), `user_id` (FK -> `users.user_id`), `booking_date` (DATE), `total_amount` (NUMERIC CHECK >= 0), `payment_status` (VARCHAR CHECK IN 'PENDING', 'PAID', 'REFUNDED', 'FAILED'), `booking_reference` (VARCHAR UNIQUE).
6. **`tickets`**:
   - `ticket_id` (PK, SERIAL), `booking_id` (FK -> `bookings.booking_id`), `tier_id` (FK -> `ticket_tiers.tier_id`), `ticket_code` (VARCHAR UNIQUE), `status` (VARCHAR CHECK IN 'ACTIVE', 'USED', 'CANCELLED', 'EXPIRED').
7. **`fastpass_reservations`**:
   - `fastpass_id` (PK, SERIAL), `ticket_id` (FK -> `tickets.ticket_id`), `attraction_id` (FK -> `attractions.attraction_id`), `time_slot_start` (TIMESTAMPTZ), `time_slot_end` (TIMESTAMPTZ CHECK end > start), `status` (VARCHAR CHECK IN 'CONFIRMED', 'REDEEMED', 'CANCELLED').
8. **`maintenance_logs`**:
   - `log_id` (PK, SERIAL), `attraction_id` (FK -> `attractions.attraction_id`), `reported_by` (FK -> `users.user_id`), `incident_description` (TEXT), `severity` (VARCHAR CHECK IN 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'), `status` (VARCHAR), `scheduled_end` (TIMESTAMPTZ).
9. **`audit_logs`**:
   - `audit_id` (PK, SERIAL), `action_type` (VARCHAR), `table_name` (VARCHAR), `record_id` (INT), `details` (JSONB), `performed_at` (TIMESTAMPTZ).

---

## 4. Advanced Database Concepts Implemented

### 1. ACID Transactions with Concurrency Control
- **Location:** `database/schema.sql` (`sp_book_tickets`) and `src/app/api/bookings/route.ts`
- **Mechanism:** Implements `SELECT ... FOR UPDATE` row-level locks on user balance records to prevent concurrent overdrawing/race conditions during high-volume ticket sales. If any step fails, the entire transaction is rolled back.

### 2. Database Views
- **`v_live_attraction_status`:** Combines attraction telemetry, zone metadata, thrill ratings, and unresolved maintenance incident counts.
- **`v_daily_revenue_analytics`:** Aggregates ticket revenue, transaction counts, and average order value grouped by date and admission tier.
- **`v_visitor_expenditure_analytics`:** Lifetime spending metrics and booking frequency per guest.
- **`v_zone_crowd_density`:** Computes live occupancy percentages (`current_occupancy / max_capacity * 100`) and categorizes crowd density (`LOW`, `MODERATE`, `HIGH_DENSITY`, `CRITICAL`).

### 3. Stored Procedures & Functions
- **`sp_book_tickets(p_user_id, p_tier_id, p_ticket_count, p_booking_date)`:** Atomically validates balance, generates unique alphanumeric ticket codes, creates master booking, deducts wallet funds, and writes audit logs.
- **`sp_assign_fastpass(p_ticket_id, p_attraction_id, p_slot_start, p_slot_end)`:** Enforces a hard quota of 50 FastPasses per 30-minute interval and verifies attraction operational health.
- **`sp_report_maintenance_incident(p_attraction_id, p_reported_by, p_description, p_severity)`:** Enforces automatic safety shutdown by transitioning attraction status to `MAINTENANCE` and zeroing wait queues.

### 4. Database Triggers
- **`trg_prevent_maintenance_booking_trigger` (`BEFORE INSERT ON fastpass_reservations`):** Intercepts reservation attempts on rides currently under maintenance or closed status, aborting with an exception.
- **`trg_audit_ticket_cancellation_trigger` (`AFTER UPDATE OF status ON tickets`):** Automatically appends security audit logs with JSON timestamps whenever a ticket is marked `CANCELLED`.
- **`trg_update_zone_occupancy_trigger` (`AFTER UPDATE OF status ON tickets`):** Increments zone occupancy counters when tickets are validated at turnstiles (`status = 'USED'`).

### 5. Indexing Strategy
- **B-Tree Indexes:** On all Foreign Key constraints (`zone_id`, `user_id`, `booking_id`, `attraction_id`).
- **Composite Indexes:** `(status, created_at)` on `tickets` and `(attraction_id, time_slot_start)` on `fastpass_reservations`.
- **Partial Index:** `WHERE status IN ('REPORTED', 'IN_PROGRESS')` on `maintenance_logs` to accelerate active incident lookups.
- **Full-Text Search (GIN Index):** `to_tsvector('english', name || ' ' || description)` on `attractions`.
- **Vector HNSW Index:** `hnsw (embedding vector_cosine_ops)` with `m = 16, ef_construction = 64` for cosine similarity nearest neighbor search.

### 6. NoSQL Aggregation Pipelines (MongoDB)
- **Hourly Turnstile Heatmap:** Groups scans by `zoneId`, calculating entry volumes, FastPass ratio, and average turnstile battery level.
- **Predictive Maintenance Anomaly Detection:** Averages motor temperatures and maximum G-forces per attraction, isolating readings exceeding safety thresholds (e.g. > 85°C).

### 7. Vector Similarity Search (Semantic Personalization)
- **Data Embedded:** Multi-faceted attraction textual representations including thrill intensity, sensory tags, and ride mechanics.
- **Embedding Dimensions:** 384 dimensions (all-MiniLM-L6-v2 compatible).
- **Distance Metric:** Cosine Distance (`<=>`), evaluated as `Similarity = 1 - CosineDistance`.
- **Query Flow:** Natural language prompt -> 384D unit vector -> Cosine distance ordering -> Top-K personalized attraction recommendations.

---

## 5. Web Application Integration (Next.js 14)
- **Frontend Stack:** Next.js (App Router), React 18, Tailwind CSS, Lucide Icons.
- **Backend API Handlers:**
  - `/api/attractions`: Live queue monitoring and dynamic DML updates.
  - `/api/bookings`: Stored procedure-backed ticket purchases with ACID protection.
  - `/api/fastpass`: FastPass slot booking with trigger validation.
  - `/api/maintenance`: Operator incident reporting.
  - `/api/telemetry`: MongoDB IoT turnstile and sensor telemetry ingestion and aggregation.
  - `/api/semantic-search`: Vector cosine similarity attraction recommender.
  - `/api/analytics`: Queries live PostgreSQL views for executive analytics.
  - `/api/query-console`: Interactive evaluation SQL query runner with live timing metrics.

---

## 6. Execution & Setup Instructions

### Option 1: Docker (Recommended - One Command)
Ensure Docker is running, then execute:
```bash
cd smart-theme-park
docker compose up -d
```
This automatically boots:
- PostgreSQL 16 with `pgvector` on port `5432` with preloaded `schema.sql` and `seed.sql`.
- MongoDB 7.0 on port `27017`.

### Option 2: Run Application Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
*(Note: If PostgreSQL or MongoDB is not running locally, the application automatically engages a mock relational and document fallback engine, enabling full UI testing and demonstration without crashing!)*

---

## 7. Individual Contributions Mapping
- **Team Member 1 (Database Architect & Backend):**
  - PostgreSQL Relational Schema, DDL, Constraints, Indexes, Views, Stored Procedures, and Triggers.
  - MongoDB Collection Schemas, Validation Rules, and Aggregation Pipelines.
  - Next.js API Route Handlers and Connection Pools.
- **Team Member 2 (Application Developer & Vector AI):**
  - Vector Embeddings Generation, Cosine Similarity Engine, and Semantic Search Interface.
  - Responsive Next.js Web Application UI (Visitor Portal, Operator Station, Analytics, and Query Console).
  - Documentation, Docker Setup, and End-to-End System Integration.
