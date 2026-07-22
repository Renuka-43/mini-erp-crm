import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product, MovementType } from '../types';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  History,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add / Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: '',
    currentStock: '',
    minStockAlert: '10',
    location: '',
  });

  // Stock Adjustment Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantityChanged: '',
    movementType: 'IN' as MovementType,
    reason: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        lowStock: String(lowStockFilter),
      });
      const res = await api.get(`/products?${params}`);
      if (res.data.success) {
        setProducts(res.data.data.products);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, lowStockFilter]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: '',
      unitPrice: '',
      currentStock: '0',
      minStockAlert: '10',
      location: '',
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: String(p.unitPrice),
      currentStock: String(p.currentStock),
      minStockAlert: String(p.minStockAlert),
      location: p.location,
    });
    setIsProductModalOpen(true);
  };

  const openStockModal = (p: Product) => {
    setSelectedProduct(p);
    setStockForm({
      quantityChanged: '',
      movementType: 'IN',
      reason: '',
    });
    setIsStockModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
      } else {
        await api.post('/products', productForm);
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.post(`/products/${selectedProduct.id}/stock-adjustment`, stockForm);
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stock adjustment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Product & Inventory Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Catalog SKUs, current warehouse stock levels, and alert thresholds</p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/stock-log"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span>Audit Log</span>
          </Link>
          {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
            <button
              onClick={openAddProductModal}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product name, SKU code, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => {
            setLowStockFilter(!lowStockFilter);
            setPage(1);
          }}
          className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center space-x-1.5 transition-all ${
            lowStockFilter
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">SKU / Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Warehouse Location</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading products catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{p.name}</div>
                        <div className="text-xs text-sky-400 font-mono mt-0.5">{p.sku}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-300">
                        <span className="flex items-center space-x-1">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{p.category}</span>
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-100">${p.unitPrice.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-sm ${isLow ? 'text-rose-400' : 'text-slate-100'}`}>
                            {p.currentStock}
                          </span>
                          <span className="text-xs text-slate-500">(Min: {p.minStockAlert})</span>
                          {isLow && <Badge variant="danger">Low Stock</Badge>}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{p.location}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
                          <>
                            <button
                              onClick={() => openStockModal(p)}
                              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors inline-flex items-center space-x-1"
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              <span>Adjust Stock</span>
                            </button>
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product SKU' : 'Add New Product'}
        maxWidth="lg"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Industrial Drill 850W"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">SKU Code *</label>
              <input
                type="text"
                required
                disabled={!!editingProduct}
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 disabled:opacity-50 focus:outline-none focus:border-amber-500"
                placeholder="e.g. PRD-DRL-850"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Category *</label>
              <input
                type="text"
                required
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Power Tools"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="129.99"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Min Stock Alert *</label>
              <input
                type="number"
                required
                value={productForm.minStockAlert}
                onChange={(e) => setProductForm({ ...productForm, minStockAlert: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!editingProduct && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Stock On Hand</label>
                <input
                  type="number"
                  value={productForm.currentStock}
                  onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="0"
                />
              </div>
            )}
            <div className={editingProduct ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Warehouse Bin / Location *</label>
              <input
                type="text"
                required
                value={productForm.location}
                onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Warehouse Rack A-12"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20"
            >
              {editingProduct ? 'Save Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 flex justify-between text-xs">
            <span className="text-slate-400">Current Stock:</span>
            <span className="font-bold text-slate-100">{selectedProduct?.currentStock} Units</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Adjustment Type *</label>
              <select
                value={stockForm.movementType}
                onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value as MovementType })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="IN">IN (Stock Received / Return)</option>
                <option value="OUT">OUT (Damaged / Adjustment)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={stockForm.quantityChanged}
                onChange={(e) => setStockForm({ ...stockForm, quantityChanged: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Adjustment Reason *</label>
            <input
              type="text"
              required
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Purchase order delivery #PO-902"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20"
            >
              Submit Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
