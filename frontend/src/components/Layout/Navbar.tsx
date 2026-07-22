import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCheck, Shield } from 'lucide-react';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    SALES: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    WAREHOUSE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    ACCOUNTS: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };

  return (
    <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700/60 sticky top-0 z-40 px-4 py-2.5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: App Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-lg leading-tight tracking-wide">
              Mini <span className="text-sky-400">ERP + CRM</span> Portal
            </h1>
            <p className="text-xs text-slate-400">Wholesale Operations Hub</p>
          </div>
        </div>

        {/* Middle: Secure Admin-Only Context Switcher */}
        {user?.role === 'ADMIN' && (
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-purple-500/30 space-x-1">
            <span className="text-xs font-semibold text-purple-300 px-2 flex items-center">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-purple-400" /> Admin Switcher:
            </span>
            <button
              onClick={() => quickSwitchRole('ADMIN')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                user?.role === 'ADMIN' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => quickSwitchRole('SALES')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-800 transition-all"
            >
              Sales
            </button>
            <button
              onClick={() => quickSwitchRole('WAREHOUSE')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
            >
              Warehouse
            </button>
            <button
              onClick={() => quickSwitchRole('ACCOUNTS')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-all"
            >
              Accounts
            </button>
          </div>
        )}

        {/* Right: Active User Details & Logout */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-200">{user?.name}</div>
            <div className="flex items-center justify-end space-x-1 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColors[user?.role || 'SALES']}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
