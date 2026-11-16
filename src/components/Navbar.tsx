'use client';

import React from 'react';
import Link from 'next/link';
import { UserRole, DEMO_USERS } from '@/lib/auth';
import { 
  Sparkles, 
  Wrench, 
  Ticket, 
  Activity, 
  Crown, 
  Sun, 
  Flame, 
  Terminal,
  ChevronDown
} from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-indigo-900/40 text-white shadow-xl shadow-purple-950/20">
      
      {/* Festive Top Marquee Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-[11px] font-bold px-4 py-1 flex items-center justify-between tracking-wide shadow-inner">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold animate-pulse">
            🎡 Park Open Today
          </span>
          <span className="hidden sm:inline">
            ✨ Welcome to Aetheria Wonderland! 8 Thrill Rides Across 4 Themed Realms • 🎆 Grand Fireworks at 9:30 PM!
          </span>
          <span className="sm:hidden">
            ✨ Aetheria Wonderland Open Now • Fireworks 9:30 PM!
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:flex items-center gap-1 text-[11px] text-amber-100 font-medium">
            <Sun className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" /> 76°F Clear Skies
          </span>
          
          {/* Switch to Original Tech Frontend button */}
          <Link
            href="/original"
            className="bg-slate-900/80 hover:bg-slate-900 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all hover:scale-105"
            title="Switch back to original developer console view"
          >
            <Terminal className="w-3 h-3 text-amber-400" />
            <span>Classic Tech View</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          
          {/* Park Logo & Branding */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl select-none">🎢</span>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 items-center justify-center text-[8px] text-black font-black">★</span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 bg-clip-text text-transparent">
                  Aetheria Wonderland
                </span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
              </div>
              <div className="text-[11px] text-purple-300 font-semibold tracking-wide flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">★</span>
                <span>The Magic Kingdom of Thrills & Wonders</span>
              </div>
            </div>
          </Link>

          {/* Playful Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-purple-900/50 shadow-inner">
            <button
              onClick={() => onSelectTab('experience')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'experience'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <span className="text-sm">🎪</span>
              <span>Rides & Magic Vibe</span>
            </button>

            <button
              onClick={() => onSelectTab('operations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'operations'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <span className="text-sm">🕹️</span>
              <span>Ride Control Arcade</span>
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <span className="text-sm">👑</span>
              <span>Kingdom Command</span>
            </button>

            <button
              onClick={() => onSelectTab('queries')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'queries'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <span className="text-sm">📜</span>
              <span>Magic Query Lab</span>
            </button>
          </nav>

          {/* Park Status Badge & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Live Crowd Meter */}
            <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-slate-900 to-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/50 text-xs">
              <span className="text-base animate-bounce">🎡</span>
              <div>
                <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Park Crowd</div>
                <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1">
                  <span>{crowdIndex}%</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">• Bustling & Fun</span>
                </div>
              </div>
            </div>

            {/* Playful Interactive Role Switcher */}
            <div className="flex items-center bg-gradient-to-r from-purple-950/90 to-slate-900 p-1 rounded-2xl border border-purple-700/60 shadow-md">
              <span className="text-[11px] text-amber-300 font-extrabold px-2.5 hidden sm:flex items-center gap-1">
                <span>🎭</span> Role:
              </span>
              <div className="relative">
                <select
                  value={currentRole}
                  onChange={(e) => onSelectRole(e.target.value as UserRole)}
                  className="bg-slate-900 text-amber-200 text-xs font-black rounded-xl pl-3 pr-8 py-1.5 border border-purple-600/50 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer appearance-none shadow-inner"
                >
                  <option value="VISITOR">🎟️ Alex Johnson (VIP Guest)</option>
                  <option value="OPERATOR">🛠️ Sarah (Ride Captain)</option>
                  <option value="ADMIN">👑 Park Director (Kingdom Admin)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

        </div>
      </div>
      
      {/* Mobile Tab Strip */}
      <div className="flex md:hidden border-t border-purple-900/60 px-2 py-2 bg-slate-950 overflow-x-auto space-x-1.5 scrollbar-none">
        <button
          onClick={() => onSelectTab('experience')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-black flex items-center gap-1.5 ${
            activeTab === 'experience'
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
              : 'text-slate-300 bg-slate-900/80 border border-slate-800'
          }`}
        >
          <span>🎪</span>
          <span>Rides & Vibe</span>
        </button>
        <button
          onClick={() => onSelectTab('operations')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-black flex items-center gap-1.5 ${
            activeTab === 'operations'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
              : 'text-slate-300 bg-slate-900/80 border border-slate-800'
          }`}
        >
          <span>🕹️</span>
          <span>Ride Arcade</span>
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-black flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-300 bg-slate-900/80 border border-slate-800'
          }`}
        >
          <span>👑</span>
          <span>Command</span>
        </button>
        <button
          onClick={() => onSelectTab('queries')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-black flex items-center gap-1.5 ${
            activeTab === 'queries'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
              : 'text-slate-300 bg-slate-900/80 border border-slate-800'
          }`}
        >
          <span>📜</span>
          <span>Query Lab</span>
        </button>
      </div>
    </header>
  );
};
