import { MongoClient, Db, Int32 } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'smart_theme_park';

let client: MongoClient | null = null;
let isMongoAvailable: boolean | null = null;
let lastMongoAttemptAt = 0;
const MONGO_RETRY_INTERVAL_MS = 10_000;

// Realistic mock document collections for immediate preview
const mockTurnstileEvents = [
  { sensorId: 'TURNSTILE-ZN2-G1', attractionId: 1, zoneId: 2, ticketCode: 'TCK-VIP-00101', scanType: 'FASTPASS_TAP', batteryPct: 97.2, timestamp: new Date(Date.now() - 5 * 60000) },
  { sensorId: 'TURNSTILE-ZN2-G2', attractionId: 1, zoneId: 2, ticketCode: 'TCK-STD-1002', scanType: 'ENTRY', batteryPct: 96.8, timestamp: new Date(Date.now() - 10 * 60000) },
  { sensorId: 'TURNSTILE-ZN3-G1', attractionId: 3, zoneId: 3, ticketCode: 'TCK-STD-1003', scanType: 'ENTRY', batteryPct: 98.1, timestamp: new Date(Date.now() - 12 * 60000) },
  { sensorId: 'TURNSTILE-ZN1-MAIN', attractionId: null, zoneId: 1, ticketCode: 'TCK-VIP-00201', scanType: 'ENTRY', batteryPct: 99.0, timestamp: new Date(Date.now() - 25 * 60000) },
  { sensorId: 'TURNSTILE-ZN4-G1', attractionId: 7, zoneId: 4, ticketCode: 'TCK-STD-1005', scanType: 'ENTRY', batteryPct: 95.4, timestamp: new Date(Date.now() - 35 * 60000) },
];

const mockRideTelemetry = [
  { attractionId: 1, rideName: 'Apex Predator: Hyper Coaster', gForceMax: 4.3, motorTempCelsius: 72.4, trackVibrationMmS: 2.1, safetyHarnessLocked: true, speedKmh: 121.5, dispatchCycleSec: 85, timestamp: new Date() },
  { attractionId: 2, rideName: 'Quantum Leap 4D Dark Ride', gForceMax: 2.1, motorTempCelsius: 48.6, trackVibrationMmS: 0.9, safetyHarnessLocked: true, speedKmh: 42.0, dispatchCycleSec: 120, timestamp: new Date() },
  { attractionId: 4, rideName: 'Sub-Zero Glacier Plunge', gForceMax: 3.4, motorTempCelsius: 88.5, trackVibrationMmS: 3.9, safetyHarnessLocked: true, speedKmh: 82.0, dispatchCycleSec: 95, timestamp: new Date() },
  { attractionId: 3, rideName: 'Raptor Encounter River Safari', gForceMax: 1.5, motorTempCelsius: 52.1, trackVibrationMmS: 1.1, safetyHarnessLocked: true, speedKmh: 24.0, dispatchCycleSec: 180, timestamp: new Date() },
];

const rideTelemetrySeed = mockRideTelemetry.map((event) => ({
  ...event,
  timestamp: new Date(event.timestamp),
}));

const mockFeedback = [
  { attractionId: 1, visitorName: 'Alex Johnson', rating: 5, reviewText: 'Unreal adrenaline drop! Inversion was insane. Minimal wait with FastPass.', sentiment: 'POSITIVE', tags: ['adrenaline', 'smooth', 'fastpass'], submittedAt: new Date(Date.now() - 2 * 3600000) },
  { attractionId: 2, visitorName: 'Priya Sharma', rating: 5, reviewText: 'The 4D digital projection and motion sync felt like actual virtual reality.', sentiment: 'POSITIVE', tags: ['scifi', 'interactive', 'family'], submittedAt: new Date(Date.now() - 1 * 3600000) },
  { attractionId: 4, visitorName: 'Liam O\'Connor', rating: 4, reviewText: 'Super refreshing on a hot day. The final 45-meter splashdown gets your front row drenched!', sentiment: 'POSITIVE', tags: ['water', 'splash', 'fun'], submittedAt: new Date(Date.now() - 30 * 60000) },
];

export async function getMongoDb(): Promise<{ db: Db | null; isMock: boolean }> {
  // Mongo may come online after the Next.js server has already started. Avoid
  // permanently caching the first failed connection, while not retrying on every request.
  if (isMongoAvailable === false && Date.now() - lastMongoAttemptAt < MONGO_RETRY_INTERVAL_MS) {
    return { db: null, isMock: true };
  }

  try {
    if (!client) {
      lastMongoAttemptAt = Date.now();
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
      await client.connect();
      isMongoAvailable = true;
      console.log('✅ MongoDB connected successfully.');
    }
    return { db: client.db(dbName), isMock: false };
  } catch (err: any) {
    client = null;
    isMongoAvailable = false;
    console.warn('⚠️ MongoDB offline. Using high-fidelity NoSQL mock telemetry & aggregation pipeline.');
    return { db: null, isMock: true };
  }
}

export async function seedTelemetryIfEmpty(db: Db): Promise<void> {
  const telemetry = db.collection('ride_telemetry');
  if (await telemetry.estimatedDocumentCount() > 0) return;

  await telemetry.insertMany(rideTelemetrySeed.map((event) => ({
    ...event,
    attractionId: new Int32(event.attractionId),
    dispatchCycleSec: new Int32(event.dispatchCycleSec),
    timestamp: new Date(),
  })));
}

export { Int32, mockTurnstileEvents, mockRideTelemetry, mockFeedback };
