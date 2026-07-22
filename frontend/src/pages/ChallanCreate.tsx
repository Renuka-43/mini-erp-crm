import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Customer, Product } from '../types';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle, FileText, ShoppingBag } from 'lucide-react';

interface SelectedItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const ChallanCreate: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100'),
        ]);
        if (cRes.data.success) setCustomers(cRes.data.data.customers);
        if (pRes.data.success) setProducts(pRes.data.data.products);
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      }
    };
    loadData();
  }, []);

  const addItemRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd.id,
        quantity: 1,
        unitPrice: defaultProd.unitPrice,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SelectedItem, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        unitPrice: prod ? prod.unitPrice : 0,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setItems(updated);
  };

  const totalQuantity = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const totalAmount = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0), 0);

  const handleSubmit = async (targetStatus: 'DRAFT' | 'CONFIRMED') => {
    setErrorMsg('');
    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Please add at least one product line item.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        items,
        status: targetStatus,
      };

      const res = await api.post('/challans', payload);
      if (res.data.success) {
        navigate(`/challans/${res.data.data.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create sales challan');
    } flex: {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/challans"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challans</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-sky-400" />
          <span>Generate Sales Challan</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select customer, specify product quantities, and save as Draft or Confirmed (triggers stock deduction)
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Customer Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Select Customer *</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="">-- Choose Customer from CRM --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.businessName}) • {c.customerType}
              </option>
            ))}
          </select>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Line Items</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-semibold rounded-xl border border-sky-500/30 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product Item</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-700/60 rounded-2xl text-slate-500 text-xs space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-600" />
              <p>No products added yet. Click "Add Product Item" above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.productId);
                const subtotal = item.quantity * item.unitPrice;
                const isStockInsufficient = selectedProd ? selectedProd.currentStock < item.quantity : false;

                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900/60 border border-slate-700/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
                  >
                    {/* Product Select */}
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">Product SKU</label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — Stock: {p.currentStock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-full md:w-32">
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-full md:w-32">
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>

                    {/* Subtotal & Stock Alert */}
                    <div className="w-full md:w-36 text-right">
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">Subtotal</label>
                      <div className="font-bold text-slate-100 text-sm">${subtotal.toFixed(2)}</div>
                      {isStockInsufficient && (
                        <div className="text-[10px] text-rose-400 font-semibold">
                          Stock shortfall! ({selectedProd?.currentStock} avail)
                        </div>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors mt-4 md:mt-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calculation Summary Footer */}
        <div className="p-4 bg-slate-900/90 border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-400">
            Total Items: <strong className="text-slate-200">{items.length}</strong> • Total Quantity:{' '}
            <strong className="text-slate-200">{totalQuantity} Units</strong>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Grand Total</span>
            <span className="text-2xl font-bold text-sky-400">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('DRAFT')}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('CONFIRMED')}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm & Deduct Stock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
