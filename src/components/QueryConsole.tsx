'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Code, 
  Clock, 
  Table, 
  Check, 
  AlertCircle, 
  Copy, 
  Sparkles, 
  BookOpen,
  Wand2,
  Terminal,
  Database
} from 'lucide-react';

interface PresetQuery {
  id: string;
  category: string;
  name: string;
  description: string;
  sql: string;
  emoji: string;
}

const PRESET_QUERIES: PresetQuery[] = [
  {
    id: 'join_agg',
    category: 'JOINs & Aggregates',
    name: '1. Multi-Table Realm Revenue',
    emoji: '🎪',
    description: 'Joins Park Zones, Attractions, FastPass reservations, Tickets, and Bookings to calculate total revenue, ticket count, and average wait time per zone.',
    sql: `SELECT 
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
ORDER BY total_zone_revenue DESC;`
  },
  {
    id: 'group_by_having',
    category: 'Aggregation & Filtering',
    name: '2. Queue Bottleneck Discovery',
    emoji: '⏳',
    description: 'Filters thrill levels to find queue bottlenecks having an average wait time of 20 minutes or greater.',
    sql: `SELECT 
    a.thrill_level,
    COUNT(a.attraction_id) AS ride_count,
    ROUND(AVG(a.current_wait_time), 2) AS avg_wait_time,
    MAX(a.current_wait_time) AS longest_wait_time,
    SUM(a.hourly_capacity) AS combined_hourly_throughput
FROM attractions a
WHERE a.status = 'OPERATIONAL'
GROUP BY a.thrill_level
HAVING AVG(a.current_wait_time) >= 20.0
ORDER BY avg_wait_time DESC;`
  },
  {
    id: 'correlated_subquery',
    category: 'Subqueries & CTEs',
    name: '3. VIP High-Roller Guests',
    emoji: '👑',
    description: 'Finds visitors whose lifetime expenditure strictly exceeds the average spending of all registered visitors.',
    sql: `SELECT 
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
ORDER BY visitor_total_spent DESC;`
  },
  {
    id: 'cte_window',
    category: 'Advanced SQL',
    name: '4. Zone Wait-Time Ranks (Window Function)',
    emoji: '🏆',
    description: 'Uses DENSE_RANK() OVER (PARTITION BY zone) to rank attractions by queue wait time within each zone and computes deviation from the zone average.',
    sql: `WITH ZoneAttractionMetrics AS (
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
ORDER BY zone_name, wait_rank_in_zone;`
  },
  {
    id: 'pgvector_cosine',
    category: 'Vector Database',
    name: '5. AI Vector Similarity Search',
    emoji: '🔮',
    description: 'Demonstrates vector cosine distance (<=>) retrieval matching an input embedding vector against stored 384-dimensional attraction embeddings.',
    sql: `SELECT 
    attraction_id,
    name,
    thrill_level,
    current_wait_time,
    description,
    ROUND((1 - (embedding <=> '[0.052, -0.012, 0.089, 0.015, -0.043, 0.081, 0.002, -0.091, 0.034, 0.012]'::vector))::NUMERIC, 4) AS match_score
FROM attractions
WHERE status = 'OPERATIONAL'
ORDER BY embedding <=> '[0.052, -0.012, 0.089, 0.015, -0.043, 0.081, 0.002, -0.091, 0.034, 0.012]'::vector ASC
LIMIT 4;`
  },
  {
    id: 'view_live',
    category: 'Views',
    name: '6. SQL View: Live Ride Status',
    emoji: '🎡',
    description: 'Queries the live operational view combining attraction info, zone names, and active maintenance incident counts.',
    sql: `SELECT * FROM v_live_attraction_status ORDER BY current_wait_time DESC;`
  },
  {
    id: 'view_revenue',
    category: 'Views',
    name: '7. SQL View: Daily Revenue',
    emoji: '💰',
    description: 'Queries aggregated daily booking values and ticket sales broken down by tier.',
    sql: `SELECT * FROM v_daily_revenue_analytics ORDER BY tier_revenue DESC;`
  }
];

export const QueryConsole: React.FC = () => {
  const [activeQueryId, setActiveQueryId] = useState<string>(PRESET_QUERIES[0].id);
  const [sqlCode, setSqlCode] = useState<string>(PRESET_QUERIES[0].sql);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (id: string) => {
    const selected = PRESET_QUERIES.find((q) => q.id === id);
    if (selected) {
      setActiveQueryId(id);
      setSqlCode(selected.sql);
      setResult(null);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setResult(null);
    try {
      const res = await fetch('/api/query-console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlCode }),
      });
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setResult({ success: false, error: err.message, executionTimeMs: 0 });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPreset = PRESET_QUERIES.find((q) => q.id === activeQueryId);

  return (
    <div className="space-y-6">
      
      {/* Magic Lab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-teal-950 via-[#101b2b] to-purple-950 border-2 border-teal-500/40 p-6 sm:p-7 rounded-3xl shadow-2xl gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase tracking-wider mb-2">
            <Wand2 className="w-4 h-4 text-teal-300" />
            <span>Interactive Query Lab & Blueprint Workshop</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Magic Query Grimoire & DBMS Benchmark Runner
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Execute all Level 3 evaluation queries in real-time (Multi-table JOINs, GROUP BY/HAVING, Correlated Subqueries, CTEs, Window Functions, and pgvector embeddings).
          </p>
        </div>
      </div>

      {/* Preset Query Selector Strip */}
      <div className="bg-gradient-to-r from-slate-900 to-[#12162a] border-2 border-purple-800/40 p-4 rounded-3xl shadow-xl space-y-2">
        <div className="text-xs font-black text-amber-300 px-1 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Pick an Evaluator Blueprint / Query Spell:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeQueryId === preset.id
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 scale-105'
                  : 'bg-slate-950 text-purple-200 hover:bg-slate-800 hover:text-white border border-purple-900/60'
              }`}
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description Box */}
      {currentPreset && (
        <div className="p-4 bg-gradient-to-r from-purple-950/70 to-slate-950 border border-purple-700/50 rounded-2xl text-xs text-purple-200 flex items-start gap-3 shadow-md">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-amber-300 mr-2 uppercase tracking-wider">{currentPreset.category}:</span>
            <span>{currentPreset.description}</span>
          </div>
        </div>
      )}

      {/* SQL Editor Area */}
      <div className="bg-slate-950 border-2 border-purple-800/50 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-900 to-[#13162c] border-b border-purple-900/60">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 ml-2">theme_park_query.sql</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-200 hover:text-white text-xs flex items-center gap-1.5 font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>

            <button
              onClick={handleExecute}
              disabled={executing}
              className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:opacity-90 text-white font-black text-xs shadow-lg shadow-teal-500/25 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{executing ? 'Executing Spell...' : 'Cast Spell (Run SQL)'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={sqlCode}
          onChange={(e) => setSqlCode(e.target.value)}
          rows={11}
          className="w-full bg-[#0a0d18] p-5 font-mono text-xs text-cyan-200 focus:outline-none focus:ring-1 focus:ring-teal-400 leading-relaxed resize-y"
          spellCheck={false}
        />
      </div>

      {/* Results View */}
      {result && (
        <section className="bg-gradient-to-br from-slate-900 via-[#13162a] to-purple-950/60 border-2 border-purple-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-900/60">
            <div className="flex items-center gap-2.5">
              <Table className="w-5 h-5 text-teal-400" />
              <h3 className="font-black text-white text-base">Execution Benchmark & Output</h3>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-purple-900 text-amber-300 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {result.executionTimeMs} ms
              </span>
              <span className="bg-slate-950 px-3 py-1 rounded-xl border border-purple-900 text-cyan-300 font-bold">
                {result.rowCount ?? result.rows?.length ?? 0} rows returned
              </span>
              <span className="bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800 text-emerald-300 font-bold">
                {result.isMock ? 'Mock Engine' : 'PostgreSQL Live'}
              </span>
            </div>
          </div>

          {!result.success ? (
            <div className="p-4 bg-rose-950/90 border border-rose-600 rounded-2xl text-rose-200 text-xs font-mono flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <div className="font-bold">Execution Error:</div>
                <div className="mt-1">{result.error}</div>
              </div>
            </div>
          ) : result.rows && result.rows.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-2xl border border-purple-900/60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-slate-950 text-purple-300 uppercase text-[10px] font-black border-b border-purple-900/60">
                  <tr>
                    {result.columns?.map((col: string) => (
                      <th key={col} className="py-3 px-4 whitespace-nowrap bg-slate-950">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/40 text-purple-200 bg-slate-950/60">
                  {result.rows.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-purple-950/40 transition-colors">
                      {result.columns?.map((col: string) => (
                        <td key={col} className="py-2.5 px-4 whitespace-nowrap">
                          {typeof row[col] === 'object' && row[col] !== null
                            ? JSON.stringify(row[col])
                            : String(row[col] ?? 'NULL')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-purple-300 text-xs font-mono">
              Query completed successfully with 0 rows returned.
            </div>
          )}
        </section>
      )}

    </div>
  );
};
