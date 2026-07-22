import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  History,
  PlusCircle,
  FolderTree,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'SALES';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { label: 'Customer CRM', path: '/customers', icon: Users, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { label: 'Products & Inventory', path: '/products', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { label: 'Stock Movement Log', path: '/stock-log', icon: History, roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'] },
    { label: 'Sales Challans', path: '/challans', icon: FileText, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  ];

  return (
    <aside className="w-64 bg-slate-800/50 border-r border-slate-700/60 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">
            Core Modules
          </p>
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.roles.includes(role))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                        isActive
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* Quick Actions per Role */}
        {(role === 'ADMIN' || role === 'SALES') && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">
              Quick Creation
            </p>
            <div className="space-y-2 px-1">
              <NavLink
                to="/challans/new"
                className="flex items-center justify-center space-x-2 w-full py-2 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Sales Challan</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between font-semibold text-slate-300">
          <span>System Mode</span>
          <span className="text-emerald-400">Online</span>
        </div>
        <div className="text-[10px] text-slate-500">v1.0.0 • SQLite/Postgres Ready</div>
      </div>
    </aside>
  );
};
