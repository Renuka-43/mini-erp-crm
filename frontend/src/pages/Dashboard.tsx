import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/Common/StatCard';
import { Badge } from '../components/Common/Badge';
import { api } from '../services/api';
import { Customer, Product, SalesChallan } from '../types';
import { Users, Package, FileText, AlertTriangle, ArrowUpRight, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pRes, chRes] = await Promise.all([
          api.get('/customers?limit=5'),
          api.get('/products?limit=50'),
          api.get('/challans?limit=5'),
        ]);

        if (cRes.data.success) setCustomers(cRes.data.data.customers);
        if (pRes.data.success) setProducts(pRes.data.data.products);
        if (chRes.data.success) setChallans(chRes.data.data.challans);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalCustomers = customers.length;
  const leadCount = customers.filter((c) => c.status === 'LEAD').length;
  const lowStockProducts = products.filter((p) => p.isLowStock || p.currentStock <= p.minStockAlert);
  const totalRevenue = challans
    .filter((ch) => ch.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <span>Loading operations overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-800 to-slate-850 p-6 rounded-3xl border border-slate-700/60 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            Welcome back, <span className="text-sky-400">{user?.name}</span> 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Role: <span className="font-semibold text-slate-300">{user?.role}</span> • Wholesale Operations Dashboard
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <Link
            to="/challans/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Challan</span>
          </Link>
        )}
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          subtitle={`${leadCount} active leads`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Stock Alert"
          value={lowStockProducts.length}
          subtitle="Products below minimum"
          icon={AlertTriangle}
          color={lowStockProducts.length > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Confirmed Revenue"
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="From confirmed challans"
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Catalog Items"
          value={products.length}
          subtitle="Active SKUs"
          icon={Package}
          color="amber"
        />
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-200">
                {lowStockProducts.length} Product(s) Require Replenishment
              </h4>
              <p className="text-xs text-rose-300/80">
                {lowStockProducts.map((p) => `${p.name} (${p.currentStock} left)`).join(', ')}
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center space-x-1 underline"
          >
            <span>Manage Inventory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Recent Challans & Upcoming Followups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Challans Table */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Recent Sales Challans</span>
            </h3>
            <Link to="/challans" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3">Challan #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 text-xs">
                      No sales challans recorded yet.
                    </td>
                  </tr>
                ) : (
                  challans.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-200">
                        <Link to={`/challans/${c.id}`} className="hover:text-sky-400">
                          {c.challanNumber}
                        </Link>
                      </td>
                      <td className="p-3 text-slate-300">{c.customer?.businessName || c.customer?.name}</td>
                      <td className="p-3 text-slate-300">{c.totalQuantity}</td>
                      <td className="p-3 font-semibold text-slate-100">${c.totalAmount.toFixed(2)}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            c.status === 'CONFIRMED'
                              ? 'success'
                              : c.status === 'DRAFT'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Follow-up Reminder Feed */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Pending CRM Follow-ups</span>
            </h3>
            <Link to="/customers" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
              CRM Portal →
            </Link>
          </div>

          <div className="space-y-3">
            {customers
              .filter((c) => c.followUpDate)
              .slice(0, 4)
              .map((c) => (
                <div key={c.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">{c.name}</span>
                    <Badge variant="info">{c.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{c.businessName}</p>
                  {c.followUpDate && (
                    <div className="text-[11px] text-amber-400 font-medium flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>Due: {new Date(c.followUpDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
