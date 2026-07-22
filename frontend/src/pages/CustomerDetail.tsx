import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Customer } from '../types';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Clock,
  Plus,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Add FollowUp Modal
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customer detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/customers/${id}/follow-up`, {
        note,
        followUpDate: nextFollowUpDate || undefined,
      });
      setIsFollowUpModalOpen(false);
      setNote('');
      setNextFollowUpDate('');
      fetchCustomer();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add follow-up note');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-400">Customer not found.</p>
        <Link to="/customers" className="text-sky-400 underline text-sm">
          Return to Customer List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Customer Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-100">{customer.name}</h2>
            <Badge variant={customer.status === 'ACTIVE' ? 'success' : customer.status === 'LEAD' ? 'info' : 'neutral'}>
              {customer.status}
            </Badge>
            <Badge variant="purple">{customer.customerType}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <strong>{customer.businessName}</strong>
            </span>
            <span className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span>{customer.mobile}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{customer.email}</span>
            </span>
          </div>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsFollowUpModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Follow-up Note</span>
            </button>
          </div>
        )}
      </div>

      {/* Detail Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Information */}
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-700/60 pb-2">
              Business Profile
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">GST Number</span>
                <span className="font-semibold text-slate-100">{customer.gstNumber || 'Not Provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Full Address</span>
                <div className="flex items-start space-x-1 text-slate-200 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Next Follow-up Due</span>
                <div className="text-amber-400 font-semibold flex items-center space-x-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {customer.followUpDate
                      ? new Date(customer.followUpDate).toLocaleDateString('en-US', { dateStyle: 'medium' })
                      : 'None Scheduled'}
                  </span>
                </div>
              </div>
              {customer.notes && (
                <div>
                  <span className="text-slate-400 block">Initial Account Notes</span>
                  <p className="text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40 mt-1">
                    "{customer.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Follow-up Timeline & Challans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-up Activity History */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>CRM Follow-up Timeline</span>
              </h3>
              <span className="text-xs text-slate-400">{customer.followUps?.length || 0} Entries</span>
            </div>

            <div className="space-y-4">
              {!customer.followUps || customer.followUps.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No follow-up notes recorded yet.</p>
              ) : (
                customer.followUps.map((f) => (
                  <div key={f.id} className="p-4 bg-slate-900/70 border border-slate-700/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-400">{f.createdBy?.name || 'Sales Rep'}</span>
                      <span className="text-slate-500">
                        {new Date(f.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">{f.note}</p>
                    {f.followUpDate && (
                      <div className="text-[11px] text-amber-400 font-medium flex items-center space-x-1 pt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Next Date Set: {new Date(f.followUpDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer's Recent Sales Challans */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Sales Challan History</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Challan #</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {!customer.salesChallans || customer.salesChallans.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">
                        No sales challans created for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    customer.salesChallans.map((ch) => (
                      <tr key={ch.id} className="hover:bg-slate-700/30">
                        <td className="p-3 font-semibold text-sky-400">
                          <Link to={`/challans/${ch.id}`}>{ch.challanNumber}</Link>
                        </td>
                        <td className="p-3 text-slate-300">{ch.totalQuantity}</td>
                        <td className="p-3 font-semibold text-slate-100">${ch.totalAmount.toFixed(2)}</td>
                        <td className="p-3">
                          <Badge variant={ch.status === 'CONFIRMED' ? 'success' : ch.status === 'DRAFT' ? 'warning' : 'danger'}>
                            {ch.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Follow Up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Add Follow-Up Log"
      >
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Follow-up Note *</label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              placeholder="e.g. Discussed bulk pricing options. Sent revised proposal."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Next Follow-up Date (Optional)</label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsFollowUpModalOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/20"
            >
              Save Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
