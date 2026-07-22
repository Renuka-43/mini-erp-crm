import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StockMovement } from '../types';
import { Badge } from '../components/Common/Badge';
import { History, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, User } from 'lucide-react';

export const StockMovements: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/movements/log?page=${page}&limit=15`);
      if (res.data.success) {
        setMovements(res.data.data.movements);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <History className="w-5 h-5 text-sky-400" />
          <span>Stock Movement Audit Log</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Complete historical record of inventory IN / OUT adjustments and sales deductions</p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Product / SKU</th>
                <th className="p-4">Movement Type</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Reason / Notes</th>
                <th className="p-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading stock logs...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 text-xs text-slate-400 font-mono">
                      {new Date(m.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{m.product?.name || 'Unknown Product'}</div>
                      <div className="text-xs text-sky-400 font-mono">{m.product?.sku}</div>
                    </td>
                    <td className="p-4">
                      {m.movementType === 'IN' ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>IN (Stock Added)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-400 font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>OUT (Deducted)</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-100 text-sm">
                      {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`}
                    </td>
                    <td className="p-4 text-xs text-slate-300">{m.reason}</td>
                    <td className="p-4 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{m.createdBy?.name || 'System User'}</span>
                      </span>
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
