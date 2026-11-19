import { NextResponse } from 'next/server';
import { getMongoDb, Int32, mockTurnstileEvents, mockRideTelemetry, seedTelemetryIfEmpty } from '@/lib/db/mongo';

export async function GET() {
  try {
    const { db, isMock } = await getMongoDb();

    if (!isMock && db) {
      // A fresh Docker MongoDB instance has no documents until the separate setup
      // script is run. Seed only the ride samples needed by the dashboard.
      await seedTelemetryIfEmpty(db);

      // 1. Live Aggregation Pipeline: Zone Hourly Scan Distribution
      const turnstileAgg = await db.collection('iot_turnstile_events').aggregate([
        {
          $group: {
            _id: '$zoneId',
            totalScans: { $sum: 1 },
            fastpassScans: {
              $sum: { $cond: [{ $eq: ['$scanType', 'FASTPASS_TAP'] }, 1, 0] }
            },
            avgBattery: { $avg: '$batteryPct' }
          }
        },
        { $sort: { totalScans: -1 } }
      ]).toArray();

      // 2. Live Aggregation Pipeline: Ride Telemetry Health Monitoring
      const telemetryAgg = await db.collection('ride_telemetry').aggregate([
        {
          $group: {
            _id: '$rideName',
            avgMotorTemp: { $avg: '$motorTempCelsius' },
            maxGForce: { $max: '$gForceMax' },
            maxVibration: { $max: '$trackVibrationMmS' },
            samples: { $sum: 1 }
          }
        },
        { $sort: { avgMotorTemp: -1 } }
      ]).toArray();

      // Recent 10 scans
      const recentScans = await db.collection('iot_turnstile_events')
        .find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      return NextResponse.json({
        success: true,
        source: 'MongoDB Live Cluster',
        aggregations: {
          zoneTurnstileStats: turnstileAgg,
          rideHealthStats: telemetryAgg,
        },
        recentScans
      });
    }

    // High-fidelity Mock Aggregation Pipeline Execution
    const zoneAgg = [1, 2, 3, 4].map(zoneId => {
      const scans = mockTurnstileEvents.filter(e => e.zoneId === zoneId);
      return {
        _id: zoneId,
        zoneName: ['Main Blvd', 'Cyberpunk', 'Jurassic', 'Mythic Woods'][zoneId - 1],
        totalScans: scans.length + 42 * zoneId,
        fastpassScans: Math.round((scans.length + 42 * zoneId) * 0.28),
        avgBattery: 97.4 - zoneId * 0.4
      };
    });

    const telemetryAgg = mockRideTelemetry.map(t => ({
      _id: t.rideName,
      avgMotorTemp: t.motorTempCelsius,
      maxGForce: t.gForceMax,
      maxVibration: t.trackVibrationMmS,
      status: t.motorTempCelsius > 85 ? 'WARNING' : 'OPTIMAL'
    }));

    return NextResponse.json({
      success: true,
      source: 'Mock NoSQL In-Memory Pipeline (MongoDB offline)',
      aggregations: {
        zoneTurnstileStats: zoneAgg,
        rideHealthStats: telemetryAgg,
      },
      recentScans: mockTurnstileEvents
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    const { db, isMock } = await getMongoDb();

    if (!isMock && db) {
      if (type === 'TURNSTILE_SCAN') {
        const doc = {
          ...payload,
          zoneId: new Int32(payload.zoneId),
          attractionId: new Int32(payload.attractionId),
          timestamp: new Date()
        };
        await db.collection('iot_turnstile_events').insertOne(doc);
        return NextResponse.json({ success: true, message: 'Turnstile event recorded in MongoDB', doc });
      }

      if (type === 'RIDE_TELEMETRY') {
        const doc = {
          ...payload,
          attractionId: new Int32(payload.attractionId),
          dispatchCycleSec: new Int32(payload.dispatchCycleSec),
          timestamp: new Date()
        };
        await db.collection('ride_telemetry').insertOne(doc);
        return NextResponse.json({ success: true, message: 'Sensor telemetry recorded in MongoDB', doc });
      }
    }

    // Mock ingestion
    if (type === 'TURNSTILE_SCAN') {
      const doc = {
        sensorId: payload.sensorId || 'TURNSTILE-ZN1-AUTO',
        zoneId: payload.zoneId || 1,
        attractionId: payload.attractionId || 1,
        ticketCode: payload.ticketCode || 'TCK-SIM-SCAN',
        scanType: payload.scanType || 'ENTRY',
        batteryPct: 98.2,
        timestamp: new Date()
      };
      mockTurnstileEvents.unshift(doc);
      return NextResponse.json({ success: true, message: 'Turnstile event added (Mock Stream)', doc });
    }

    if (type === 'RIDE_TELEMETRY') {
      const doc = {
        attractionId: payload.attractionId || 1,
        rideName: payload.rideName || 'Apex Predator: Hyper Coaster',
        gForceMax: payload.gForceMax ?? 3.8,
        motorTempCelsius: payload.motorTempCelsius ?? 70,
        trackVibrationMmS: payload.trackVibrationMmS ?? 1.5,
        safetyHarnessLocked: payload.safetyHarnessLocked ?? true,
        speedKmh: payload.speedKmh ?? 80,
        dispatchCycleSec: payload.dispatchCycleSec ?? 90,
        timestamp: new Date(),
      };
      mockRideTelemetry.unshift(doc);
      return NextResponse.json({ success: true, message: 'Ride sensor sample added (Mock Stream)', doc });
    }

    return NextResponse.json({ success: true, message: 'Telemetry received (Mock Stream)' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
