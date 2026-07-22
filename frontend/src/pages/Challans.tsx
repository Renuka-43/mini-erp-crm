import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SalesChallan, ChallanStatus } from '../types';
import { Badge } from '../components/Common/Badge';
import { FileText, Search, Plus, Download, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Challans: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        status: statusFilter,
      });
      const res = await api.get(`/challans?${params}`);
      if (res.data.success) {
        setChallans(res.data.data.challans);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching sales challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [page, search, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: ChallanStatus) => {
    if (!window.confirm(`Are you sure you want to mark this challan as ${newStatus}?`)) return;
    try {
      const res = await api.patch(`/challans/${id}/status`, { status: newStatus });
      if (res.data.success) {
        alert(`Sales Challan updated to ${newStatus}`);
        fetchChallans();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDownloadPDF = async (id: string, challanNumber: string) => {
    try {
      const response = await api.get(`/challans/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Challan_${challanNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>Sales Challans & Invoices</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Generate sales dockets, confirm inventory dispatch, export PDF invoices</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <Link
            to="/challans/new"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Challan</span>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Challan # or Customer Business Name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Challans Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Challan #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total Qty</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading sales challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No sales challans recorded.
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <Link to={`/challans/${ch.id}`} className="font-bold text-sky-400 hover:underline">
                        {ch.challanNumber}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{ch.customer?.name}</div>
                      <div className="text-xs text-slate-400">{ch.customer?.businessName}</div>
                    </td>
                    <td className="p-4 text-slate-300 font-semibold">{ch.totalQuantity} Units</td>
                    <td className="p-4 font-bold text-slate-100">${ch.totalAmount.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={ch.status === 'CONFIRMED' ? 'success' : ch.status === 'DRAFT' ? 'warning' : 'danger'}>
                        {ch.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(ch.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownloadPDF(ch.id, ch.challanNumber)}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                        title="Export Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                        <span>PDF</span>
                      </button>

                      {ch.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStatusChange(ch.id, 'CONFIRMED')}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 transition-colors inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                      )}

                      {ch.status === 'CONFIRMED' && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
                        <button
                          onClick={() => handleStatusChange(ch.id, 'CANCELLED')}
                          className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors inline-flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong>
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg border border-slate-700 flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg border border-slate-700 flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
