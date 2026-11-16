'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Radio, 
  ShieldAlert, 
  Cpu, 
  Wrench, 
  CheckCircle, 
  RefreshCw, 
  Send, 
  ArrowRight,
  Gauge,
  Sliders,
  Flame,
  Zap,
  Power
} from 'lucide-react';
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
        setScanStatusMsg(`🎟️ Tap Ingested! MongoDB NoSQL event logged & trigger evaluated: ${json.message}`);
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
        setIncidentSuccessMsg(`🚨 Emergency Incident Logged! Stored Procedure sp_report_maintenance_incident shut down ride: ${json.message}`);
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
        setOverrideMsg(`⏱️ Wait time updated to ${newWaitTime} mins (SQL UPDATE statement executed)`);
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      setOverrideMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Playful Arcade Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-amber-950/80 via-slate-900 to-purple-950/80 border-2 border-amber-500/40 p-6 sm:p-7 rounded-3xl shadow-2xl gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Ride Command & Turnstile Control Arcade</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Staff & Ride Captain Operations Desk
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Simulate turnstile taps into MongoDB (NoSQL) sensor collections and dispatch automated SQL maintenance safety shutdowns.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchTelemetry}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Poll Live Sensors</span>
          </button>
        </div>
      </div>

      {/* Grid: Turnstile Simulator & Maintenance Incident Reporter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: Turnstile Tap Simulator (MongoDB Stream Ingestion) */}
        <section className="bg-gradient-to-br from-slate-900 via-[#13162c] to-purple-950/60 border-2 border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 text-2xl shadow-inner">
              🎟️
            </div>
            <div>
              <h3 className="font-black text-white text-base">Guest NFC / QR Turnstile Tap Simulator</h3>
              <p className="text-xs text-purple-300">Generates real-time NoSQL events in <span className="font-mono text-amber-300">iot_turnstile_events</span></p>
            </div>
          </div>

          {scanStatusMsg && (
            <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs font-bold animate-fade-in">
              {scanStatusMsg}
            </div>
          )}

          <form onSubmit={handleSimulateScan} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5">Park Realm</label>
                <select
                  value={scanZoneId}
                  onChange={(e) => setScanZoneId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value={1}>🎪 Main Adventure Blvd</option>
                  <option value={2}>🚀 Cyberpunk Metropolis</option>
                  <option value={3}>🦖 Jurassic Lagoon</option>
                  <option value={4}>🏰 Enchanted Mythic Woods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5">Attraction Gate</label>
                <select
                  value={scanAttractionId}
                  onChange={(e) => setScanAttractionId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value={1}>Apex Predator Coaster</option>
                  <option value={2}>Quantum Leap 4D</option>
                  <option value={3}>Raptor Encounter River</option>
                  <option value={4}>Sub-Zero Glacier Plunge</option>
                  <option value={5}>Starlight Carousel</option>
                  <option value={6}>T-Rex Rampage Escape</option>
                  <option value={7}>Mystic Manor Escape</option>
                  <option value={8}>Whispering River Cruise</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5">Scan Event Type</label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                >
                  <option value="ENTRY">Standard Queue Tap</option>
                  <option value="FASTPASS_TAP">⚡ FastPass Express Tap</option>
                  <option value="EXIT">Zone Exit Sensor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5">Ticket Code Scanned</label>
                <input
                  type="text"
                  value={scanTicketCode}
                  onChange={(e) => setScanTicketCode(e.target.value)}
                  placeholder="TCK-LIVE-XXXX"
                  className="w-full bg-slate-950 border border-purple-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulatingScan}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-90 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
            >
              {simulatingScan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Simulate Guest Turnstile Tap</span>
            </button>
          </form>
        </section>

        {/* Module 2: Maintenance Incident Reporter (PostgreSQL Stored Procedure) */}
        <section className="bg-gradient-to-br from-slate-900 via-[#1a1220] to-rose-950/50 border-2 border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 text-2xl shadow-inner">
              🚨
            </div>
            <div>
              <h3 className="font-black text-white text-base">Emergency Ride Safety Shutdown</h3>
              <p className="text-xs text-rose-300">Triggers stored procedure <span className="font-mono text-amber-300">sp_report_maintenance_incident</span></p>
            </div>
          </div>

          {incidentSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-bold animate-fade-in">
              {incidentSuccessMsg}
            </div>
          )}

          <form onSubmit={handleReportIncident} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-1.5">Ride Target</label>
                <select
                  value={incidentAttrId}
                  onChange={(e) => setIncidentAttrId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-rose-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value={1}>Apex Predator Coaster</option>
                  <option value={2}>Quantum Leap 4D</option>
                  <option value={3}>Raptor Encounter Safari</option>
                  <option value={4}>Sub-Zero Glacier Plunge</option>
                  <option value={6}>T-Rex Escape Rampage</option>
                  <option value={7}>Mystic Manor Escape</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-1.5">Severity Level</label>
                <select
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                >
                  <option value="LOW">Low (Sensor recalibration)</option>
                  <option value="MEDIUM">Medium (Hydraulic/Track Check)</option>
                  <option value="HIGH">High (Temporary Stop)</option>
                  <option value="CRITICAL">Critical (Immediate Evac)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-1.5">Operator Incident Report</label>
              <textarea
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-rose-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={incidentSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:opacity-90 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
            >
              {incidentSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              <span>Execute Ride Emergency Stop Procedure</span>
            </button>
          </form>
        </section>

      </div>

      {/* Module 3: Live Coaster Car Sensor Gauges (MongoDB Stream) */}
      <section className="bg-gradient-to-br from-slate-900 via-[#13162a] to-purple-950/60 border-2 border-purple-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40 text-2xl shadow-inner">
              ⚡
            </div>
            <div>
              <h3 className="font-black text-white text-base">Real-Time Coaster Car Telemetry Stream</h3>
              <p className="text-xs text-purple-300">Live accelerometers, vibration sensors, and drive motor thermistors in MongoDB</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-purple-950 border border-purple-700 text-amber-300">
            {telemetryData?.source || 'NoSQL Telemetry Cluster Active'}
          </span>
        </div>

        {telemetryData?.aggregations?.rideHealthStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {telemetryData.aggregations.rideHealthStats.map((item: any) => (
              <div 
                key={item._id} 
                className="bg-slate-950/90 border border-purple-800/60 rounded-2xl p-4 space-y-2.5 hover:border-amber-400/60 transition-colors shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="font-black text-xs text-white truncate max-w-[150px]">{item._id}</div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    Online
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-900/40">
                  <span className="text-purple-300 flex items-center gap-1">
                    <span>🎢</span> Peak G-Force:
                  </span>
                  <span className="font-black text-amber-300 font-mono text-sm">
                    {Number(item.maxGForce || 3.8).toFixed(1)} G
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 flex items-center gap-1">
                    <span>🌡️</span> Motor Temp:
                  </span>
                  <span className={`font-black font-mono text-sm ${item.avgMotorTemp > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Number(item.avgMotorTemp || 68.2).toFixed(1)} °C
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 flex items-center gap-1">
                    <span>〰️</span> Track Vibration:
                  </span>
                  <span className="font-black text-cyan-300 font-mono text-sm">
                    {Number(item.maxVibration || 1.8).toFixed(1)} mm/s
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Module 4: Live Turnstile Scans Stream */}
      {telemetryData?.recentScans && (
        <section className="bg-gradient-to-br from-slate-900 via-[#13162a] to-purple-950/60 border-2 border-purple-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <span>📡</span> Live Guest Ingestion Stream (MongoDB NoSQL)
              </h3>
              <p className="text-xs text-purple-300">Continuous feed of admission ticket taps across park zones</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Auto-updating (10s)
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-purple-300 font-black uppercase text-[10px] border-b border-purple-900/60">
                <tr>
                  <th className="py-3 px-4">Gate Sensor ID</th>
                  <th className="py-3 px-4">Park Realm</th>
                  <th className="py-3 px-4">Ticket Scanned</th>
                  <th className="py-3 px-4">Tap Type</th>
                  <th className="py-3 px-4">Sensor Battery</th>
                  <th className="py-3 px-4">Tap Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40 font-mono text-[11px] bg-slate-950/60">
                {telemetryData.recentScans.slice(0, 6).map((scan: any, i: number) => (
                  <tr key={i} className="hover:bg-purple-950/30 transition-colors">
                    <td className="py-2.5 px-4 text-cyan-300 font-bold">{scan.sensorId}</td>
                    <td className="py-2.5 px-4 text-purple-200">Realm {scan.zoneId}</td>
                    <td className="py-2.5 px-4 text-amber-300 font-bold">{scan.ticketCode}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        scan.scanType === 'FASTPASS_TAP' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {scan.scanType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-purple-300">{Number(scan.batteryPct || 98.0).toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-slate-400">{new Date(scan.timestamp).toLocaleTimeString()}</td>
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
