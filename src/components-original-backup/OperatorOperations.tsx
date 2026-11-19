'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Radio, ShieldAlert, Cpu, Wrench, CheckCircle, RefreshCw, Send, ArrowRight } from 'lucide-react';
import { UserRole } from '@/lib/auth';

interface OperatorOperationsProps {
  currentRole: UserRole;
  onRefreshAll?: () => void;
}

export const OperatorOperations: React.FC<OperatorOperationsProps> = ({
  currentRole,
  onRefreshAll,
}) => {
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Turnstile Simulation form
  const [scanZoneId, setScanZoneId] = useState(2);
  const [scanAttractionId, setScanAttractionId] = useState(1);
  const [scanType, setScanType] = useState('ENTRY');
  const [scanTicketCode, setScanTicketCode] = useState('TCK-LIVE-OPERATOR');
  const [simulatingScan, setSimulatingScan] = useState(false);
  const [scanStatusMsg, setScanStatusMsg] = useState<string | null>(null);

  // Maintenance Incident Form
  const [incidentAttrId, setIncidentAttrId] = useState(4);
  const [incidentSeverity, setIncidentSeverity] = useState('MEDIUM');
  const [incidentDesc, setIncidentDesc] = useState('Flume pump hydraulic pressure anomaly detected during cycle dispatch.');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentSuccessMsg, setIncidentSuccessMsg] = useState<string | null>(null);

  // Wait Time Quick Override
  const [overrideAttrId, setOverrideAttrId] = useState(1);
  const [newWaitTime, setNewWaitTime] = useState(45);
  const [overrideMsg, setOverrideMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const json = await res.json();
      if (json.success) setTelemetryData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatingScan(true);
    setScanStatusMsg(null);
    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TURNSTILE_SCAN',
          payload: {
            sensorId: `TURNSTILE-ZN${scanZoneId}-G1`,
            zoneId: scanZoneId,
            attractionId: scanAttractionId,
            ticketCode: scanTicketCode || `TCK-LIVE-${Math.floor(Math.random() * 9000 + 1000)}`,
            scanType,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setScanStatusMsg(`Event logged in MongoDB (NoSQL) & Trigger fired in PostgreSQL: ${json.message}`);
        fetchTelemetry();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      setScanStatusMsg(`Error: ${err.message}`);
    } finally {
      setSimulatingScan(false);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentSubmitting(true);
    setIncidentSuccessMsg(null);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attractionId: incidentAttrId,
          reportedBy: 3, // Marcus Ride Maintenance Eng
          description: incidentDesc,
          severity: incidentSeverity,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIncidentSuccessMsg(`Incident Filed! Stored Procedure sp_report_maintenance_incident triggered ride shutdown: ${json.message}`);
        fetchTelemetry();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      setIncidentSuccessMsg(`Error: ${err.message}`);
    } finally {
      setIncidentSubmitting(false);
    }
  };

  const handleUpdateWaitTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideMsg(null);
    try {
      const res = await fetch('/api/attractions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attractionId: overrideAttrId,
          currentWaitTime: newWaitTime,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOverrideMsg(`Wait time updated to ${newWaitTime} mins (SQL UPDATE statement executed)`);
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      setOverrideMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-amber-900/40 p-6 rounded-2xl shadow-xl gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            IoT Telemetry & Operational Control Stream
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Staff & Turnstile Operator Station</h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate RFID/turnstile scan events into MongoDB (NoSQL) and trigger automated SQL maintenance procedures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTelemetry}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Grid: Turnstile Simulator & Maintenance Incident Reporter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: IoT Turnstile Scanner Simulator */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">IoT Turnstile NFC / QR Tap Simulator</h3>
              <p className="text-xs text-slate-400">Generates NoSQL document events in <span className="font-mono text-amber-400">iot_turnstile_events</span></p>
            </div>
          </div>

          {scanStatusMsg && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs font-medium">
              {scanStatusMsg}
            </div>
          )}

          <form onSubmit={handleSimulateScan} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Park Zone</label>
                <select
                  value={scanZoneId}
                  onChange={(e) => setScanZoneId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value={1}>Zone 1: Main Adventure Blvd</option>
                  <option value={2}>Zone 2: Cyberpunk Metropolis</option>
                  <option value={3}>Zone 3: Jurassic Lagoon</option>
                  <option value={4}>Zone 4: Enchanted Mythic Woods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attraction Turnstile</label>
                <select
                  value={scanAttractionId}
                  onChange={(e) => setScanAttractionId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value={1}>Apex Predator Coaster</option>
                  <option value={2}>Quantum Leap 4D</option>
                  <option value={3}>Raptor Encounter River</option>
                  <option value={4}>Sub-Zero Glacier Plunge</option>
                  <option value={5}>Starlight Carousel</option>
                  <option value={7}>Mystic Manor Escape</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Scan Type</label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ENTRY">Standard Queue Entry Tap</option>
                  <option value="FASTPASS_TAP">FastPass Expedited Tap</option>
                  <option value="EXIT">Zone Exit Sensor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ticket Code</label>
                <input
                  type="text"
                  value={scanTicketCode}
                  onChange={(e) => setScanTicketCode(e.target.value)}
                  placeholder="TCK-LIVE-XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulatingScan}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {simulatingScan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Turnstile Tap Event
            </button>
          </form>
        </section>

        {/* Module 2: Maintenance Incident Reporter (Triggers Stored Procedure) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Emergency Ride Incident Reporter</h3>
              <p className="text-xs text-slate-400">Triggers <span className="font-mono text-rose-400">sp_report_maintenance_incident</span></p>
            </div>
          </div>

          {incidentSuccessMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs font-medium">
              {incidentSuccessMsg}
            </div>
          )}

          <form onSubmit={handleReportIncident} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attraction Target</label>
                <select
                  value={incidentAttrId}
                  onChange={(e) => setIncidentAttrId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value={1}>Apex Predator Coaster</option>
                  <option value={2}>Quantum Leap 4D</option>
                  <option value={3}>Raptor Encounter Safari</option>
                  <option value={4}>Sub-Zero Glacier Plunge</option>
                  <option value={7}>Mystic Manor Escape</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
                <select
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="LOW">Low (Sensor recalibration)</option>
                  <option value="MEDIUM">Medium (Hydraulic/Track Check)</option>
                  <option value="HIGH">High (Temporary Stop)</option>
                  <option value="CRITICAL">Critical (Immediate Evac)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Report Details</label>
              <textarea
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={incidentSubmitting}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {incidentSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Trigger Emergency Shutdown Procedure
            </button>
          </form>
        </section>

      </div>

      {/* Module 3: Live Sensor Telemetry Gauges (MongoDB Stream) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Real-Time Ride Sensor Telemetry (NoSQL Stream)</h3>
              <p className="text-xs text-slate-400">Streamed from ride car accelerometers, vibration sensors, and thermistors</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-300">
            {telemetryData?.source || 'NoSQL Telemetry Cluster'}
          </span>
        </div>

        {telemetryData?.aggregations?.rideHealthStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {telemetryData.aggregations.rideHealthStats.map((item: any) => (
              <div key={item._id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="font-bold text-xs text-white truncate">{item._id}</div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                  <span className="text-slate-400">Max G-Force:</span>
                  <span className="font-extrabold text-amber-400 font-mono">{Number(item.maxGForce || 3.8).toFixed(1)} G</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Motor Temp:</span>
                  <span className={`font-extrabold font-mono ${item.avgMotorTemp > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Number(item.avgMotorTemp || 68.2).toFixed(1)} °C
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Track Vibration:</span>
                  <span className="font-extrabold text-indigo-300 font-mono">{Number(item.maxVibration || 1.8).toFixed(1)} mm/s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Module 4: Live Turnstile Recent Scans Stream */}
      {telemetryData?.recentScans && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-sm">Recent Turnstile Ingestion Stream (MongoDB)</h3>
            <span className="text-xs text-slate-400">Auto-updating every 10s</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Sensor ID</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Ticket Code</th>
                  <th className="py-2.5 px-3">Scan Type</th>
                  <th className="py-2.5 px-3">Sensor Battery</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {telemetryData.recentScans.slice(0, 6).map((scan: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-indigo-300">{scan.sensorId}</td>
                    <td className="py-2 px-3 text-slate-300">Zone {scan.zoneId}</td>
                    <td className="py-2 px-3 text-amber-300">{scan.ticketCode}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        scan.scanType === 'FASTPASS_TAP' ? 'bg-indigo-950 text-indigo-300' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {scan.scanType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{Number(scan.batteryPct || 98.0).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-slate-500">{new Date(scan.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
};
