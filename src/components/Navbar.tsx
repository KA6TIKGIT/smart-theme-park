'use client';

import { UserRole } from '@/lib/auth';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export function Navbar({ currentRole, onSelectRole }: NavbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <a href="/" className="text-base font-semibold text-slate-950">Aetheria Theme Park</a>
          <p className="text-xs text-slate-500">Park management</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          View
          <select
            value={currentRole}
            onChange={(event) => onSelectRole(event.target.value as UserRole)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          >
            <option value="VISITOR">Visitor</option>
            <option value="OPERATOR">Operations</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
      </div>
    </header>
  );
}
