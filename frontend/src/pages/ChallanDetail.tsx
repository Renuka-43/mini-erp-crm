import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { SalesChallan } from '../types';
import { Badge } from '../components/Common/Badge';
import { ArrowLeft, Download, CheckCircle2, XCircle, FileText, User, Building2, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChallan = async () => {
    try {
      const res = await api.get(`/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching challan detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!challan) return;
    try {
      const response = await api.get(`/challans/${challan.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Challan_${challan.challanNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF invoice');
    }
  };

  const handleStatusChange = async (newStatus: 'CONFIRMED' | 'CANCELLED') => {
    if (!challan) return;
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      const res = await api.patch(`/challans/${challan.id}/status`, { status: newStatus });
      if (res.data.success) {
        alert(`Status updated to ${newStatus}`);
        fetchChallan();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading sales challan details...</div>;
  }

  if (!challan) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-400">Sales Challan not found.</p>
        <Link to="/challans" className="text-sky-400 underline text-sm">
          Return to Challans List
        </Link>
      </div>
    );
  }

  const customerSnapshot = JSON.parse(challan.customerSnapshot || '{}');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/challans"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales Challans</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-100">{challan.challanNumber}</h2>
            <Badge variant={challan.status === 'CONFIRMED' ? 'success' : challan.status === 'DRAFT' ? 'warning' : 'danger'}>
              {challan.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generated on {new Date(challan.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} • By{' '}
            <span className="text-slate-200 font-semibold">{challan.createdBy?.name || 'System User'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold text-xs rounded-xl shadow transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Download PDF Invoice</span>
          </button>

          {challan.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('CONFIRMED')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Deduct Stock</span>
            </button>
          )}

          {challan.status === 'CONFIRMED' && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <button
              onClick={() => handleStatusChange('CANCELLED')}
              className="px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel & Restore Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Snapshot Section */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 pb-2">
          Customer Billing Snapshot
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Customer Name</span>
            <span className="font-semibold text-slate-100">{customerSnapshot.name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Business</span>
            <span className="font-semibold text-slate-100">{customerSnapshot.businessName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Contact Phone</span>
            <span className="font-semibold text-sky-400">{customerSnapshot.mobile || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">GST Number</span>
            <span className="font-semibold text-slate-100">{customerSnapshot.gstNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl space-y-4">
        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Challan Itemized Breakdown</span>
          </h3>
          <span className="text-xs text-slate-400">{challan.items.length} Line Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Product Name & SKU</th>
                <th className="p-4 text-center">Quantity</th>
                <th className="p-4 text-right">Unit Price</th>
                <th className="p-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {challan.items.map((item, idx) => {
                const prodSnapshot = JSON.parse(item.productSnapshot || '{}');
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-700/30">
                    <td className="p-4 text-xs text-slate-500">{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{prodSnapshot.name || 'Product'}</div>
                      <div className="text-xs text-sky-400 font-mono">{prodSnapshot.sku || 'SKU'}</div>
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-200">{item.quantity}</td>
                    <td className="p-4 text-right text-slate-300">${item.unitPrice.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-slate-100">${item.subtotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-slate-900/80 border-t border-slate-700/60 flex justify-between items-center">
          <div className="text-xs text-slate-400">
            Total Units Dispatched: <strong className="text-slate-100">{challan.totalQuantity}</strong>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Amount</span>
            <span className="text-2xl font-bold text-sky-400">${challan.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
