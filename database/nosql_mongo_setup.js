// ============================================================================
// SMART THEME PARK OPERATIONS AND PERSONALIZED VISITOR EXPERIENCE SYSTEM
// NoSQL (MongoDB) Database Setup, Schema Validation, Indexing & Aggregations
// Course: DBMS Experiential Learning - Level 3 Project
// ============================================================================

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'smart_theme_park';

async function setupMongo() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
    const db = client.db(DB_NAME);

    // ------------------------------------------------------------------------
    // 1. COLLECTION: iot_turnstile_events (High frequency sensor event stream)
    // ------------------------------------------------------------------------
    console.log('Configuring collection: iot_turnstile_events...');
    await db.createCollection('iot_turnstile_events', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['sensorId', 'zoneId', 'scanType', 'timestamp'],
          properties: {
            sensorId: { bsonType: 'string', description: 'Hardware Turnstile ID' },
            attractionId: { bsonType: ['int', 'null'], description: 'Attraction ID if ride turnstile' },
            zoneId: { bsonType: 'int', description: 'Park Zone ID' },
            ticketCode: { bsonType: 'string', description: 'Scanned Ticket identifier' },
            scanType: { enum: ['ENTRY', 'EXIT', 'FASTPASS_TAP'], description: 'Direction or tap type' },
            batteryPct: { bsonType: 'double', minimum: 0, maximum: 100 },
            timestamp: { bsonType: 'date', description: 'UTC timestamp of event' }
          }
        }
      }
    }).catch(() => console.log('iot_turnstile_events collection already exists.'));

    // Indexes
    await db.collection('iot_turnstile_events').createIndex({ timestamp: -1 });
    await db.collection('iot_turnstile_events').createIndex({ zoneId: 1, timestamp: -1 });
    await db.collection('iot_turnstile_events').createIndex({ attractionId: 1, timestamp: -1 });

    // ------------------------------------------------------------------------
    // 2. COLLECTION: ride_telemetry (IoT Vibration, Temp & G-Force Monitoring)
    // ------------------------------------------------------------------------
    console.log('Configuring collection: ride_telemetry...');
    await db.createCollection('ride_telemetry', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['attractionId', 'rideName', 'gForceMax', 'motorTempCelsius', 'timestamp'],
          properties: {
            attractionId: { bsonType: 'int' },
            rideName: { bsonType: 'string' },
            gForceMax: { bsonType: 'double', minimum: 0.0, maximum: 10.0 },
            motorTempCelsius: { bsonType: 'double', minimum: -20.0, maximum: 150.0 },
            trackVibrationMmS: { bsonType: 'double', minimum: 0.0 },
            safetyHarnessLocked: { bsonType: 'bool' },
            speedKmh: { bsonType: 'double', minimum: 0.0 },
            dispatchCycleSec: { bsonType: 'int' },
            timestamp: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => console.log('ride_telemetry collection already exists.'));

    // Indexes
    await db.collection('ride_telemetry').createIndex({ attractionId: 1, timestamp: -1 });
    await db.collection('ride_telemetry').createIndex({ motorTempCelsius: 1 });

    // ------------------------------------------------------------------------
    // 3. COLLECTION: visitor_experience_feedback (Flexible Reviews & NLP Tags)
    // ------------------------------------------------------------------------
    console.log('Configuring collection: visitor_experience_feedback...');
    await db.createCollection('visitor_experience_feedback', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['attractionId', 'rating', 'reviewText', 'submittedAt'],
          properties: {
            attractionId: { bsonType: 'int' },
            visitorId: { bsonType: 'int' },
            visitorName: { bsonType: 'string' },
            rating: { bsonType: 'int', minimum: 1, maximum: 5 },
            reviewText: { bsonType: 'string' },
            sentiment: { enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] },
            tags: { bsonType: 'array', items: { bsonType: 'string' } },
            waitSatisfactionScore: { bsonType: 'double', minimum: 0, maximum: 10 },
            submittedAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => console.log('visitor_experience_feedback collection already exists.'));

    // Indexes
    await db.collection('visitor_experience_feedback').createIndex({ attractionId: 1, rating: -1 });
    await db.collection('visitor_experience_feedback').createIndex({ reviewText: 'text' });

    // ------------------------------------------------------------------------
    // 4. SEED SAMPLE DATA
    // ------------------------------------------------------------------------
    console.log('Seeding initial MongoDB documents...');
    const now = new Date();

    // Turnstile scans
    const turnstileEvents = [];
    for (let i = 0; i < 40; i++) {
      const timeOffset = (40 - i) * 60 * 1000;
      turnstileEvents.push({
        sensorId: `TURNSTILE-ZN${(i % 4) + 1}-G${(i % 3) + 1}`,
        attractionId: (i % 8) + 1,
        zoneId: (i % 4) + 1,
        ticketCode: `TCK-LIVE-${1000 + i}`,
        scanType: i % 5 === 0 ? 'FASTPASS_TAP' : 'ENTRY',
        batteryPct: 98.4 - (i * 0.1),
        timestamp: new Date(now.getTime() - timeOffset)
      });
    }
    await db.collection('iot_turnstile_events').deleteMany({});
    await db.collection('iot_turnstile_events').insertMany(turnstileEvents);

    // Ride telemetry
    const telemetryEvents = [
      { attractionId: 1, rideName: 'Apex Predator: Hyper Coaster', gForceMax: 4.3, motorTempCelsius: 72.4, trackVibrationMmS: 2.1, safetyHarnessLocked: true, speedKmh: 121.5, dispatchCycleSec: 85, timestamp: new Date(now.getTime() - 5 * 60000) },
      { attractionId: 1, rideName: 'Apex Predator: Hyper Coaster', gForceMax: 4.1, motorTempCelsius: 74.2, trackVibrationMmS: 2.3, safetyHarnessLocked: true, speedKmh: 119.8, dispatchCycleSec: 88, timestamp: now },
      { attractionId: 2, rideName: 'Quantum Leap 4D Dark Ride', gForceMax: 2.1, motorTempCelsius: 48.6, trackVibrationMmS: 0.9, safetyHarnessLocked: true, speedKmh: 42.0, dispatchCycleSec: 120, timestamp: now },
      { attractionId: 4, rideName: 'Sub-Zero Glacier Plunge', gForceMax: 3.4, motorTempCelsius: 88.5, trackVibrationMmS: 3.9, safetyHarnessLocked: true, speedKmh: 82.0, dispatchCycleSec: 95, timestamp: now },
      { attractionId: 3, rideName: 'Raptor Encounter River Safari', gForceMax: 1.5, motorTempCelsius: 52.1, trackVibrationMmS: 1.1, safetyHarnessLocked: true, speedKmh: 24.0, dispatchCycleSec: 180, timestamp: now }
    ];
    await db.collection('ride_telemetry').deleteMany({});
    await db.collection('ride_telemetry').insertMany(telemetryEvents);

    // Visitor feedback
    const feedbackDocs = [
      { attractionId: 1, visitorId: 4, visitorName: 'Alex Johnson', rating: 5, reviewText: 'Unreal adrenaline drop! The inverted loop at night was insane. Minimal wait with FastPass.', sentiment: 'POSITIVE', tags: ['adrenaline', 'smooth', 'fastpass'], waitSatisfactionScore: 9.5, submittedAt: new Date(now.getTime() - 2 * 3600000) },
      { attractionId: 2, visitorId: 5, visitorName: 'Priya Sharma', rating: 5, reviewText: 'The 4D digital projection and motion sync felt like actual virtual reality. Loved the laser targets.', sentiment: 'POSITIVE', tags: ['scifi', 'interactive', 'family'], waitSatisfactionScore: 8.8, submittedAt: new Date(now.getTime() - 1 * 3600000) },
      { attractionId: 4, visitorId: 6, visitorName: 'Liam O Connor', rating: 4, reviewText: 'Super refreshing on a hot day. The final 45-meter splashdown gets your entire front row drenched!', sentiment: 'POSITIVE', tags: ['water', 'splash', 'fun'], waitSatisfactionScore: 7.5, submittedAt: new Date(now.getTime() - 30 * 60000) },
      { attractionId: 5, visitorId: 4, visitorName: 'Alex Johnson', rating: 4, reviewText: 'Very calming and beautiful celestial light show. Great break between coasters.', sentiment: 'NEUTRAL', tags: ['relaxing', 'lights', 'scenic'], waitSatisfactionScore: 10.0, submittedAt: new Date(now.getTime() - 15 * 60000) }
    ];
    await db.collection('visitor_experience_feedback').deleteMany({});
    await db.collection('visitor_experience_feedback').insertMany(feedbackDocs);

    console.log('MongoDB successfully configured and seeded!');
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  setupMongo().catch(err => {
    console.error('Mongo setup error:', err.message);
    process.exit(1);
  });
}

module.exports = { setupMongo };
