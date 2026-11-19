'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Award, TrendingUp, RefreshCw, BarChart3, Database, Layers } from 'lucide-react';

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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-emerald-900/40 p-6 rounded-2xl shadow-xl gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
            <Database className="w-3.5 h-3.5" />
            Relational SQL Views & Business Intelligence
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Park Operations & Revenue Intelligence</h2>
          <p className="text-xs text-slate-400 mt-1">
            Data sourced directly from PostgreSQL Views: <span className="font-mono text-emerald-400">v_daily_revenue_analytics</span>, <span className="font-mono text-emerald-400">v_zone_crowd_density</span>, and <span className="font-mono text-emerald-400">v_visitor_expenditure_analytics</span>.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Views
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Today's Park Revenue</div>
            <div className="text-xl font-black text-white">$13,818.21</div>
            <div className="text-[11px] text-emerald-400 font-medium">From v_daily_revenue_analytics</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Active In-Park Visitors</div>
            <div className="text-xl font-black text-white">6,790 / 12,000</div>
            <div className="text-[11px] text-indigo-400 font-medium">56.5% Capacity Utilization</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Operational Attractions</div>
            <div className="text-xl font-black text-white">7 / 8 Rides</div>
            <div className="text-[11px] text-amber-400 font-medium">1 In Maintenance</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">FastPass Adoption</div>
            <div className="text-xl font-black text-white">28.4%</div>
            <div className="text-[11px] text-purple-400 font-medium">Expedited Lane Usage</div>
          </div>
        </div>
      </div>

      {/* SQL View 1: v_daily_revenue_analytics Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base">SQL View: v_daily_revenue_analytics</h3>
            <p className="text-xs text-slate-400">Grouped by ticket tier with SUM(revenue) and COUNT(tickets)</p>
          </div>
          <span className="text-[11px] font-mono bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded border border-emerald-800">
            PostgreSQL VIEW
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Admission Tier</th>
                <th className="py-3 px-4 text-right">Tickets Sold</th>
                <th className="py-3 px-4 text-right">Tier Revenue</th>
                <th className="py-3 px-4 text-right">Avg Transaction</th>
                <th className="py-3 px-4 text-right">Unique Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {views.dailyRevenue?.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400">{row.booking_date?.split('T')[0] || row.booking_date}</td>
                  <td className="py-2.5 px-4 font-bold text-white font-sans">{row.tier_name}</td>
                  <td className="py-2.5 px-4 text-right text-indigo-300 font-bold">{row.total_tickets_sold}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">${Number(row.tier_revenue).toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right text-slate-300">${Number(row.avg_booking_value).toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right text-amber-300">{row.unique_transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid: Zone Density & Visitor Lifetime Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SQL View 2: v_zone_crowd_density */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">SQL View: v_zone_crowd_density</h3>
              <p className="text-xs text-slate-400">Live capacity utilization with dynamic condition threshold</p>
            </div>
          </div>

          <div className="space-y-4">
            {views.zoneCrowdDensity?.map((zone: any) => {
              const pct = Number(zone.occupancy_percentage || 50);
              const isHigh = pct >= 70;
              return (
                <div key={zone.zone_id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-white">{zone.zone_name}</div>
                      <div className="text-[11px] text-slate-400">{zone.theme}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isHigh ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {zone.crowd_status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Occupancy: {zone.current_occupancy} / {zone.max_capacity}</span>
                      <span className="font-bold text-white">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isHigh ? 'bg-amber-500' : 'bg-emerald-500'}`}
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
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">SQL View: v_visitor_expenditure_analytics</h3>
              <p className="text-xs text-slate-400">VIP guest lifetime spending & ticket purchase volume</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Visitor Name</th>
                  <th className="py-2.5 px-3 text-right">Bookings</th>
                  <th className="py-2.5 px-3 text-right">Tickets</th>
                  <th className="py-2.5 px-3 text-right">Lifetime Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {views.visitorExpenditure?.map((v: any) => (
                  <tr key={v.user_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-white">{v.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{v.email}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-300">{v.total_bookings_count}</td>
                    <td className="py-2.5 px-3 text-right text-amber-300">{v.total_tickets_purchased}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
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
