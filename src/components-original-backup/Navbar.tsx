'use client';

import React from 'react';
import { UserRole, DEMO_USERS } from '@/lib/auth';
import { Compass, ShieldCheck, Wrench, Ticket, Users, Activity } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  crowdIndex?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  activeTab,
  onSelectTab,
  crowdIndex = 64
}) => {
  const currentUser = DEMO_USERS[currentRole];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Park Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Compass className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-300 bg-clip-text text-transparent">
                Aetheria Realm
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                Smart Operations & Experience System
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectTab('experience')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'experience'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Visitor Portal & AI Vibe
            </button>

            <button
              onClick={() => onSelectTab('operations')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'operations'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Operations & Telemetry
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              SQL Views & Analytics
            </button>

            <button
              onClick={() => onSelectTab('queries')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'queries'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="font-mono text-amber-400">&gt;_</span>
              SQL / NoSQL Console
            </button>
          </nav>

          {/* Park Status Badge & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Live Crowd Index Meter */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 font-medium">Park Crowd:</span>
              <span className="font-bold text-amber-400">{crowdIndex}%</span>
            </div>

            {/* Interactive Role Switcher */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">
                Role:
              </span>
              <select
                value={currentRole}
                onChange={(e) => onSelectRole(e.target.value as UserRole)}
                className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="VISITOR">🎟️ Visitor (Alex Johnson)</option>
                <option value="OPERATOR">🛠️ Staff (Sarah Turnstile)</option>
                <option value="ADMIN">📊 Admin (Chief Director)</option>
              </select>
            </div>
          </div>

        </div>
      </div>
      
      {/* Mobile Tab Strip */}
      <div className="flex md:hidden border-t border-slate-800 px-2 py-1.5 bg-slate-950 overflow-x-auto space-x-1">
        <button
          onClick={() => onSelectTab('experience')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium ${
            activeTab === 'experience' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Visitor Experience
        </button>
        <button
          onClick={() => onSelectTab('operations')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium ${
            activeTab === 'operations' ? 'bg-amber-600 text-white' : 'text-slate-400'
          }`}
        >
          Operations
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium ${
            activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => onSelectTab('queries')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium ${
            activeTab === 'queries' ? 'bg-purple-600 text-white' : 'text-slate-400'
          }`}
        >
          Query Console
        </button>
      </div>
    </header>
  );
};
