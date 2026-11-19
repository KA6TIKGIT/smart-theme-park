'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/original/Navbar';
import { PersonalizedExperience } from '@/components/original/PersonalizedExperience';
import { OperatorOperations } from '@/components/original/OperatorOperations';
import { AnalyticsDashboard } from '@/components/original/AnalyticsDashboard';
import { QueryConsole } from '@/components/original/QueryConsole';
import { UserRole, DEMO_USERS } from '@/lib/auth';
import { Database, CheckCircle2, Compass, Sparkles, ArrowRight } from 'lucide-react';

export default function OriginalHome() {
  const [currentRole, setCurrentRole] = useState<UserRole>('VISITOR');
  const [activeTab, setActiveTab] = useState<string>('experience');
  const [userWallet, setUserWallet] = useState<number>(450.00);

  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    setUserWallet(DEMO_USERS[role].walletBalance);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner with Switcher to Playful View */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono">
            Original Frontend
          </span>
          <span>You are viewing the original tech-oriented console.</span>
        </div>
        <Link
          href="/"
          className="bg-white text-slate-900 hover:bg-amber-100 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow transition-transform hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Switch to Playful Theme Park Wonderland
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Multi-Paradigm Architecture Callout Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>DBMS Level 3 Multi-Paradigm Architecture Active:</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Relational (SQL)
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                  <CheckCircle2 className="w-3 h-3" /> NoSQL (MongoDB)
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                  <CheckCircle2 className="w-3 h-3" /> Vector (pgvector)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Current active view: <strong className="text-white">{DEMO_USERS[currentRole].fullName}</strong> ({currentRole})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Quick View:</span>
            <button
              onClick={() => handleSelectRole('VISITOR')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'VISITOR' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Visitor
            </button>
            <button
              onClick={() => handleSelectRole('OPERATOR')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'OPERATOR' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => handleSelectRole('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'ADMIN' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

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

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="font-extrabold text-slate-300">Smart Theme Park Operations & Personalized Visitor Experience</span>
          </div>
          <div>
            Original Frontend View | PostgreSQL + pgvector + MongoDB + Next.js
          </div>
        </div>
      </footer>
    </div>
  );
}
