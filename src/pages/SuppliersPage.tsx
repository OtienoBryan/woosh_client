import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';

const SupplierEditModal: React.FC<{
  open: boolean;
  supplier: any;
  onClose: () => void;
  onSave: () => void;
}> = ({ open, supplier, onClose, onSave }) => {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && supplier) {
      setForm({ ...supplier });
      setError(null);
    }
  }, [open, supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_CONFIG.getUrl(`/financial/suppliers/${supplier.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          supplier_code: form.supplier_code,
          company_name: form.company_name,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone,
          address: form.address,
          tax_id: form.tax_id,
          payment_terms: form.payment_terms,
          credit_limit: form.credit_limit
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setLoading(false);
      onSave();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to update supplier');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Edit Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input name="company_name" value={form.company_name || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" required disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Code</label>
              <input name="supplier_code" value={form.supplier_code || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" required disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
              <input name="contact_person" value={form.contact_person || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input name="email" value={form.email || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="email" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax ID</label>
              <input name="tax_id" value={form.tax_id || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" disabled={loading} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <textarea name="address" value={form.address || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" rows={2} disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms (days)</label>
              <input name="payment_terms" value={form.payment_terms || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="number" min={0} disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Credit Limit</label>
              <input name="credit_limit" value={form.credit_limit || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="number" min={0} disabled={loading} />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-50" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SupplierAddModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState<any>({
    supplier_code: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    payment_terms: '',
    credit_limit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_CONFIG.getUrl('/financial/suppliers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          supplier_code: form.supplier_code,
          company_name: form.company_name,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone,
          address: form.address,
          tax_id: form.tax_id,
          payment_terms: form.payment_terms,
          credit_limit: form.credit_limit
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setLoading(false);
      onSave();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to add supplier');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Add Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input name="company_name" value={form.company_name} onChange={handleChange} className="border rounded px-2 py-1 w-full" required disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Code</label>
              <input name="supplier_code" value={form.supplier_code} onChange={handleChange} className="border rounded px-2 py-1 w-full" required disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
              <input name="contact_person" value={form.contact_person} onChange={handleChange} className="border rounded px-2 py-1 w-full" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="email" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="border rounded px-2 py-1 w-full" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax ID</label>
              <input name="tax_id" value={form.tax_id} onChange={handleChange} className="border rounded px-2 py-1 w-full" disabled={loading} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} className="border rounded px-2 py-1 w-full" rows={2} disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms (days)</label>
              <input name="payment_terms" value={form.payment_terms} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="number" min={0} disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Credit Limit</label>
              <input name="credit_limit" value={form.credit_limit} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="number" min={0} disabled={loading} />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-50" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_CONFIG.getUrl('/financial/suppliers'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data || []);
      } else {
        setError('Failed to fetch suppliers');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? suppliers.filter((s: any) =>
          [s.company_name, s.contact_person, s.email, s.phone, s.supplier_code]
            .filter(Boolean)
            .some((v: string) => v.toLowerCase().includes(q))
        )
      : suppliers;
    return base;
  }, [suppliers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const totalBalance = useMemo(() => {
    return suppliers.reduce((sum, s: any) => sum + (Number(s.balance) || 0), 0);
  }, [suppliers]);

  const handleEdit = (supplier: any) => {
    setEditSupplier(supplier);
    setEditOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage supplier profiles and view invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow"
            onClick={() => setAddOpen(true)}
          >
            Add Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Filtered</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="text-2xl font-bold text-gray-900">{totalBalance.toLocaleString(undefined, { style: 'currency', currency: 'KES' })}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax ID</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">No suppliers found</td>
                  </tr>
                ) : (
                  paged.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      navigate(`/suppliers/${s.id}/invoices`);
                    }}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.company_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.supplier_code || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.contact_person || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.email || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.phone || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.tax_id || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-semibold text-blue-700">
                        {s.balance != null && !isNaN(Number(s.balance))
                          ? Number(s.balance).toLocaleString(undefined, { style: 'currency', currency: 'KES' })
                          : 'KES\u00A00.00'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                            onClick={(e) => { e.stopPropagation(); navigate(`/suppliers/${s.id}/ledger`); }}
                          >
                            View Ledger
                          </button>
                          <button
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                            onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="text-sm text-gray-700">Page {currentPage} / {totalPages}</span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <SupplierEditModal
        open={editOpen}
        supplier={editSupplier}
        onClose={() => setEditOpen(false)}
        onSave={() => {
          setEditOpen(false);
          setEditSupplier(null);
          fetchSuppliers();
        }}
      />
      <SupplierAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={() => {
          setAddOpen(false);
          fetchSuppliers();
        }}
      />
    </div>
  );
};

export default SuppliersPage; 