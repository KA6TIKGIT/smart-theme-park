'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Award, 
  TrendingUp, 
  RefreshCw, 
  BarChart3, 
  Database, 
  Layers,
  Crown,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) setAnalyticsData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const views = analyticsData?.views || {};

  return (
    <div className="space-y-8">
      
      {/* Royal Park Director Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-purple-950 via-[#181335] to-indigo-950 border-2 border-purple-600/40 p-6 sm:p-7 rounded-3xl shadow-2xl gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider mb-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Kingdom Command & Park Director Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Theme Park Business Intelligence & Live SQL Views
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Real-time analytics materialized from PostgreSQL Views: <span className="font-mono text-amber-300 font-bold">v_daily_revenue_analytics</span>, <span className="font-mono text-cyan-300 font-bold">v_zone_crowd_density</span>, and <span className="font-mono text-rose-300 font-bold">v_visitor_expenditure_analytics</span>.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-xl shadow-purple-600/20 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh SQL Views</span>
        </button>
      </div>

      {/* Playful KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#161d2f] to-emerald-950/40 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
              💰
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live SQL View
            </span>
          </div>
          <div className="text-xs text-purple-200 font-extrabold">Today's Park Revenue</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">$13,818.21</div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs Last Weekend
          </div>
        </div>

        {/* Guest Count */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#18152e] to-cyan-950/40 border-2 border-cyan-500/40 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl">
              👨‍👩‍👧‍👦
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              In Park
            </span>
          </div>
          <div className="text-xs text-purple-200 font-extrabold">Active Theme Park Guests</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">6,790 / 12,000</div>
          <div className="text-[11px] text-cyan-300 font-bold mt-1.5 flex items-center gap-1">
            <span>🎡</span> 56.5% Capacity Utilization
          </div>
        </div>

        {/* Ride Uptime */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1d1624] to-amber-950/40 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
              🎢
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Safety High
            </span>
          </div>
          <div className="text-xs text-purple-200 font-extrabold">Operational Attractions</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">7 / 8 Rides</div>
          <div className="text-[11px] text-amber-300 font-bold mt-1.5 flex items-center gap-1">
            <span>🛠️</span> 1 Pit Stop Maintenance
          </div>
        </div>

        {/* FastPass Adoption */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1b122f] to-purple-950/40 border-2 border-purple-500/40 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              FastPass
            </span>
          </div>
          <div className="text-xs text-purple-200 font-extrabold">Express Queue Adoption</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">28.4%</div>
          <div className="text-[11px] text-purple-300 font-bold mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> High Guest Satisfaction
          </div>
        </div>

      </div>

      {/* SQL View 1: v_daily_revenue_analytics Table */}
      <section className="bg-gradient-to-br from-slate-900 via-[#13162a] to-purple-950/60 border-2 border-purple-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider mb-1">
              <span>📊</span> Financial View
            </div>
            <h3 className="font-black text-white text-lg">Daily Revenue Breakdown by Pass Tier</h3>
            <p className="text-xs text-purple-300">Materialized from SQL View <span className="font-mono text-emerald-400">v_daily_revenue_analytics</span></p>
          </div>
          
          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-700">
            PostgreSQL Relational VIEW
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-purple-900/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-purple-300 uppercase text-[10px] font-black border-b border-purple-900/60">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Admission Tier</th>
                <th className="py-3 px-4 text-right">Tickets Sold</th>
                <th className="py-3 px-4 text-right">Tier Revenue</th>
                <th className="py-3 px-4 text-right">Avg Order Value</th>
                <th className="py-3 px-4 text-right">Unique Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/40 font-mono text-purple-200 bg-slate-950/60">
              {views.dailyRevenue?.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-purple-950/30 transition-colors">
                  <td className="py-3 px-4 text-purple-400">{row.booking_date?.split('T')[0] || row.booking_date}</td>
                  <td className="py-3 px-4 font-black text-white font-sans text-xs flex items-center gap-2">
                    <span>🎟️</span>
                    <span>{row.tier_name}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-cyan-300 font-bold">{row.total_tickets_sold}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-black text-sm">${Number(row.tier_revenue).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-purple-300">${Number(row.avg_booking_value).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-amber-300 font-bold">{row.unique_transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid: Zone Density & Visitor Lifetime Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SQL View 2: v_zone_crowd_density */}
        <section className="bg-gradient-to-br from-slate-900 via-[#13162a] to-purple-950/60 border-2 border-purple-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-black uppercase tracking-wider mb-1">
                <span>🎡</span> Crowd Thermometer
              </div>
              <h3 className="font-black text-white text-lg">Realm Crowd Density & Capacities</h3>
              <p className="text-xs text-purple-300">Live utilization from <span className="font-mono text-cyan-400">v_zone_crowd_density</span></p>
            </div>
          </div>

          <div className="space-y-4">
            {views.zoneCrowdDensity?.map((zone: any) => {
              const pct = Number(zone.occupancy_percentage || 50);
              const isHigh = pct >= 70;
              return (
                <div key={zone.zone_id} className="bg-slate-950/80 p-4 rounded-2xl border border-purple-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">{zone.zone_name}</div>
                      <div className="text-[11px] text-purple-300">{zone.theme}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      isHigh ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {zone.crowd_status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-purple-200">
                      <span>Occupancy: {zone.current_occupancy} / {zone.max_capacity} guests</span>
                      <span className="font-black text-amber-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-purple-900">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh 
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                            : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SQL View 3: v_visitor_expenditure_analytics */}
        <section className="bg-gradient-to-br from-slate-900 via-[#13162a] to-purple-950/60 border-2 border-purple-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider mb-1">
                <span>👑</span> VIP Leaderboard
              </div>
              <h3 className="font-black text-white text-lg">Top Guests & Lifetime Spending</h3>
              <p className="text-xs text-purple-300">Queried from <span className="font-mono text-amber-300">v_visitor_expenditure_analytics</span></p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-purple-300 uppercase text-[10px] font-black border-b border-purple-900/60">
                <tr>
                  <th className="py-3 px-3">Guest Name</th>
                  <th className="py-3 px-3 text-right">Orders</th>
                  <th className="py-3 px-3 text-right">Passes</th>
                  <th className="py-3 px-3 text-right">Lifetime Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40 font-mono text-purple-200 bg-slate-950/60">
                {views.visitorExpenditure?.map((v: any, index: number) => (
                  <tr key={v.user_id} className="hover:bg-purple-950/30 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-black text-white flex items-center gap-1.5">
                        <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎟️'}</span>
                        <span>{v.full_name}</span>
                      </div>
                      <div className="text-[10px] text-purple-400 font-mono">{v.email}</div>
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-300 font-bold">{v.total_bookings_count}</td>
                    <td className="py-3 px-3 text-right text-amber-300 font-bold">{v.total_tickets_purchased}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                      ${Number(v.total_lifetime_spent).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

    </div>
  );
};
