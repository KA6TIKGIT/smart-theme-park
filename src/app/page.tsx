'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PersonalizedExperience } from '@/components/PersonalizedExperience';
import { OperatorOperations } from '@/components/OperatorOperations';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { QueryConsole } from '@/components/QueryConsole';
import { UserRole, DEMO_USERS } from '@/lib/auth';
import { 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Database, 
  ChevronRight, 
  Crown, 
  Wrench, 
  Ticket,
  Sun,
  Flame,
  Zap,
  Info
} from 'lucide-react';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('VISITOR');
  const [activeTab, setActiveTab] = useState<string>('experience');
  const [userWallet, setUserWallet] = useState<number>(450.00);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    setUserWallet(DEMO_USERS[role].walletBalance);

    // Auto-switch tabs to relevant role view for smooth user flow
    if (role === 'OPERATOR') {
      setActiveTab('operations');
    } else if (role === 'ADMIN') {
      setActiveTab('analytics');
    } else {
      setActiveTab('experience');
    }
  };

  const handleRefreshWallet = () => {
    setUserWallet((prev) => Math.max(0, prev - 119.99));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white relative overflow-hidden">
      
      {/* Playful Ambient Carnival Glow Orbs in Background */}
      <div className="fixed top-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-10 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed top-1/2 right-10 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* Playful Realm Welcome & Character Control Bar */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#15122e] to-slate-900 border-2 border-purple-800/50 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-rose-500/25 shrink-0 animate-float-gentle">
              {currentRole === 'VISITOR' ? '🎟️' : currentRole === 'OPERATOR' ? '🛠️' : '👑'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">
                  Welcome to Aetheria, <span className="bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">{DEMO_USERS[currentRole].fullName}</span>!
                </span>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-amber-300 border border-amber-400/40">
                  {currentRole === 'VISITOR' ? 'VIP Guest' : currentRole === 'OPERATOR' ? 'Ride Captain' : 'Kingdom Director'}
                </span>
              </div>
              <div className="text-xs text-purple-300 mt-0.5 flex items-center gap-2">
                <span>Active Portal: <strong className="text-white capitalize">{activeTab}</strong></span>
                <span>•</span>
                <button
                  onClick={() => setShowTechDetails(!showTechDetails)}
                  className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 flex items-center gap-1 text-[11px]"
                >
                  <Info className="w-3 h-3" />
                  {showTechDetails ? 'Hide DBMS Architecture' : 'View DBMS Architecture'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Character / Role Switcher Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-300 hidden sm:inline">
              Quick Role:
            </span>
            <button
              onClick={() => handleSelectRole('VISITOR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                currentRole === 'VISITOR' 
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/30 scale-105' 
                  : 'bg-slate-900 text-purple-200 hover:text-white border border-purple-900/60'
              }`}
            >
              <span>🎟️</span>
              <span>Visitor</span>
            </button>
            <button
              onClick={() => handleSelectRole('OPERATOR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                currentRole === 'OPERATOR' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-105' 
                  : 'bg-slate-900 text-purple-200 hover:text-white border border-purple-900/60'
              }`}
            >
              <span>🛠️</span>
              <span>Staff</span>
            </button>
            <button
              onClick={() => handleSelectRole('ADMIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                currentRole === 'ADMIN' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 scale-105' 
                  : 'bg-slate-900 text-purple-200 hover:text-white border border-purple-900/60'
              }`}
            >
              <span>👑</span>
              <span>Admin</span>
            </button>
          </div>

        </div>

        {/* Collapsible DBMS Multi-Paradigm Architecture Callout Banner */}
        {showTechDetails && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-800/80 shadow-xl space-y-2 animate-fade-in text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Database className="w-4 h-4 text-amber-400" />
                <span>DBMS Level 3 Multi-Paradigm Architecture Powering the Wonderland:</span>
              </div>
              <span className="text-[10px] text-purple-300 font-sans">Evaluator Reference</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Relational SQL (PostgreSQL ACID Bookings & Views)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> NoSQL Stream (MongoDB IoT Turnstiles & Sensors)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vector AI (pgvector Cosine Similarity Matchmaking)
              </span>
            </div>
          </div>
        )}

        {/* Tab Content Display */}
        {activeTab === 'experience' && (
          <PersonalizedExperience
            currentRole={currentRole}
            userWallet={userWallet}
            onRefreshWallet={handleRefreshWallet}
          />
        )}

        {activeTab === 'operations' && (
          <OperatorOperations
            currentRole={currentRole}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'queries' && (
          <QueryConsole />
        )}

      </main>

      {/* Playful Carnival Footer */}
      <footer className="mt-20 border-t border-purple-900/60 bg-slate-950/90 py-10 relative z-10 text-xs text-purple-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-lg shadow-md">
                🎡
              </div>
              <div>
                <span className="font-black text-white text-sm tracking-tight">
                  Aetheria Wonderland
                </span>
                <div className="text-[11px] text-purple-300 font-medium">
                  Smart Theme Park Operations & Personalized Visitor Experience
                </div>
              </div>
            </div>

            {/* Quick Switch to Original Tech Frontend */}
            <div className="flex items-center gap-3">
              <Link
                href="/original"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-amber-300 hover:text-white border border-purple-700/60 transition-all font-bold text-xs"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Switch to Original Tech Console (/original)</span>
              </Link>
            </div>

          </div>

          <div className="pt-4 border-t border-purple-950/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-purple-400">
            <div>
              DBMS Experiential Learning - Level 3 Project • PostgreSQL + pgvector + MongoDB + Next.js
            </div>
            <div>
              Park Hours: 9:00 AM – 11:00 PM • Live Queue Broadcast Active
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
