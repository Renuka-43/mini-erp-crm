import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCheck, Shield } from 'lucide-react';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    SALES: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    WAREHOUSE: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    ACCOUNTS: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };

  return (
    <header className="bg-slate-950/70 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: App Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/25">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-tight tracking-wide">
              Mini <span className="text-sky-400">ERP + CRM</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Wholesale Operations Hub</p>
          </div>
        </div>

        {/* Middle: Secure Admin-Only Context Switcher */}
        {user?.role === 'ADMIN' && (
          <div className="hidden md:flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800 space-x-1">
            <span className="text-[11px] font-semibold text-purple-400 px-2 flex items-center">
              <UserCheck className="w-3 h-3 mr-1" /> Switcher:
            </span>
            <button
              onClick={() => quickSwitchRole('ADMIN')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => quickSwitchRole('SALES')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all"
            >
              Sales
            </button>
            <button
              onClick={() => quickSwitchRole('WAREHOUSE')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
            >
              Warehouse
            </button>
            <button
              onClick={() => quickSwitchRole('ACCOUNTS')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
            >
              Accounts
            </button>
          </div>
        )}

        {/* Right: Active User Details & Logout */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
            <div className="flex items-center justify-end mt-0.5">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleColors[user?.role || 'SALES']}`}>
                {user?.role}
              </span>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
