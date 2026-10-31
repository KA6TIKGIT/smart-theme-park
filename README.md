# 🎡 Smart Theme Park Operations and Personalized Visitor Experience System

> **DBMS Experiential Learning – Level 3 Project**  
> **Course:** Database Management Systems  
> **Architecture:** Multi-Paradigm (Relational SQL + Document NoSQL + Vector Database)

---

## 🌟 Executive Summary
**Aetheria Realm** is an intelligent theme park operations management and personalized guest experience platform. It solves real-world high-throughput crowd congestion, dynamic attraction wait times, critical safety maintenance shutdowns, and impersonal visitor journeys through a unified tri-paradigm database architecture:

1. **SQL (PostgreSQL 16):** ACID transactions, concurrency locking (`SELECT ... FOR UPDATE`), referential constraints, stored procedures, triggers, views, and complex aggregations.
2. **NoSQL (MongoDB 7.0):** High-frequency IoT turnstile NFC/QR taps, mechanical ride sensor telemetry (vibration, motor heat, G-force), and multi-stage aggregation pipelines.
3. **Vector Database (pgvector):** Dense 384-dimensional semantic embeddings for personalized AI attraction discovery and real-time vibe recommendations using Cosine Distance (`<=>`).

---

## 🏛️ System Architecture & Database Paradigms

```
                                  +------------------------------------+
                                  |     Next.js 14 Web Application     |
                                  | (Visitor, Operator, Admin Portals) |
                                  +-----------------+------------------+
                                                    |
                         +--------------------------+-------------------------+
                         |                          |                         |
                         v                          v                         v
           +---------------------------+ +--------------------+ +--------------------------+
           |      PostgreSQL 16        | |    MongoDB 7.0     | |   PostgreSQL + pgvector  |
           |     (Relational SQL)      | |   (Document NoSQL) | |     (Vector Similarity)  |
           +---------------------------+ +--------------------+ +--------------------------+
           | • Users & RBAC            | | • IoT Turnstile    | | • 384D Embeddings        |
           | • Park Zones & Rides      | |   RFID Scan Stream | | • HNSW Vector Index      |
           | • Bookings & Tickets (Tx) | | • Ride Telemetry   | | • Cosine Distance (<=>)  |
           | • FastPass Reservations   | |   (G-Force, Temp)  | | • Natural Language Vibe  |
           | • Stored Procedures       | | • Multi-stage      | |   Personalization        |
           | • Database Triggers       | |   Aggregations     | |                          |
           | • Relational Views        | |                    | |                          |
           +---------------------------+ +--------------------+ +--------------------------+
```

---

## 📁 Repository Structure
```
smart-theme-park/
├── database/
│   ├── schema.sql              # Full PostgreSQL DDL (Tables, Constraints, Indexes, Views, Stored Procs, Triggers)
│   ├── alter_statements.sql    # Schema evolution & ALTER TABLE demonstrations
│   ├── drop_statements.sql     # Safe teardown scripts respecting foreign key hierarchies
│   ├── seed.sql                # Rich realistic seed data including 384D pgvector embeddings
│   ├── complex_queries.sql     # Comprehensive SQL operations (JOINs, GROUP BY/HAVING, Subqueries, CTEs, Window)
│   ├── nosql_mongo_setup.js    # MongoDB collection schemas, validation rules, indexes, & aggregation pipelines
│   └── vector_setup.sql        # pgvector extension, HNSW index, and semantic search procedure
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── attractions/    # DML Select, Insert, Update for rides & queues
│   │   │   ├── bookings/       # ACID Transaction booking execution via sp_book_tickets
│   │   │   ├── fastpass/       # FastPass slot assignment with trigger validation
│   │   │   ├── maintenance/    # Operator incident reporting & emergency ride shutdown
│   │   │   ├── telemetry/      # MongoDB IoT turnstile & ride sensor ingestion & aggregations
│   │   │   ├── semantic-search/# Vector similarity search with pgvector / cosine similarity
│   │   │   ├── analytics/      # Live PostgreSQL view queries (v_daily_revenue, v_zone_crowd)
│   │   │   └── query-console/  # Interactive SQL Query Runner with live execution timing
│   │   ├── layout.tsx
│   │   └── page.tsx            # Multi-portal interactive app with role switcher
│   ├── components/
│   │   ├── Navbar.tsx          # Role switcher (Visitor, Staff, Admin) & crowd index meter
│   │   ├── PersonalizedExperience.tsx # Vector vibe finder, attraction cards, ACID booking modal
│   │   ├── OperatorOperations.tsx     # IoT turnstile scanner simulator, sensor gauges, maintenance reporter
│   │   ├── AnalyticsDashboard.tsx     # Visualizations for SQL Views & NoSQL aggregation metrics
│   │   └── QueryConsole.tsx    # Live SQL / NoSQL console with preloaded Level 3 evaluation queries
│   └── lib/
│       ├── auth.ts             # Role-based access control (ADMIN, OPERATOR, VISITOR)
│       └── db/
│           ├── postgres.ts     # PostgreSQL pool with high-fidelity fallback
│           ├── mongo.ts        # MongoDB client with live & mock pipelines
│           └── vector.ts       # Vector embedding generator & cosine similarity engine
├── docker-compose.yml          # 1-command startup for PostgreSQL + pgvector and MongoDB
├── DATABASE_DOCUMENTATION.md   # Complete Level 3 technical report & schema description
├── package.json
└── README.md
```

---

## ⚡ Quick Start & Execution

### 1. Boot Databases via Docker (Recommended)
```bash
docker compose up -d
```
This starts:
- **PostgreSQL 16** (with `pgvector` extension) on port `5432` with preloaded `schema.sql` and `seed.sql`.
- **MongoDB 7.0** on port `27017`.

### 2. Run the Next.js Application
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Offline / Demo Resilience:**  
> If PostgreSQL or MongoDB is not running on your machine, the application automatically engages a high-fidelity mock relational and document engine. Every button, booking transaction, turnstile simulation, vector recommendation, and SQL view query will work flawlessly!

---

## 🧪 Demonstration Highlights for Evaluation

1. **Role-Based Portals:**
   - **Visitor View:** Try the *AI Vibe Finder* ("Crazy high-speed coaster with steep drops"), reserve a FastPass, and execute an ACID ticket purchase.
   - **Operator View:** Dispatch IoT turnstile taps into MongoDB and trigger emergency ride maintenance.
   - **Admin View:** Inspect live PostgreSQL Views (`v_daily_revenue_analytics`, `v_zone_crowd_density`).
2. **Interactive Query Console (Tab 4):**
   - Click through preloaded Level 3 queries (Multi-Table JOINs, GROUP BY with HAVING, Correlated Subqueries, CTEs, Window Functions, and pgvector Cosine Search) and execute them with live millisecond timing!
