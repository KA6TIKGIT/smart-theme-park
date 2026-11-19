'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { PersonalizedExperience } from '@/components/PersonalizedExperience';
import { OperatorOperations } from '@/components/OperatorOperations';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { QueryConsole } from '@/components/QueryConsole';
import { UserRole, DEMO_USERS } from '@/lib/auth';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('VISITOR');
  const [userWallet, setUserWallet] = useState(DEMO_USERS.VISITOR.walletBalance);

  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    setUserWallet(DEMO_USERS[role].walletBalance);
  };

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900">
      <Navbar currentRole={currentRole} onSelectRole={handleSelectRole} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-sm text-slate-600">Signed in as {DEMO_USERS[currentRole].fullName}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {currentRole === 'VISITOR' && 'Plan your park day'}
            {currentRole === 'OPERATOR' && 'Operations'}
            {currentRole === 'ADMIN' && 'Park overview'}
          </h1>
        </div>

        {currentRole === 'VISITOR' && (
          <PersonalizedExperience
            currentRole={currentRole}
            userWallet={userWallet}
            onRefreshWallet={() => setUserWallet((balance) => Math.max(0, balance - 119.99))}
          />
        )}
        {currentRole === 'OPERATOR' && <OperatorOperations currentRole={currentRole} />}
        {currentRole === 'ADMIN' && (
          <div className="space-y-10">
            <AnalyticsDashboard />
            <QueryConsole />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-500">
        Aetheria Theme Park
      </footer>
    </div>
  );
}
