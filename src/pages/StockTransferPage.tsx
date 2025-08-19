import React, { useEffect, useState } from 'react';
import { stockTransferService } from '../services/financialService';
import axios from 'axios';

interface StockTransferPageProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

const StockTransferPage: React.FC<StockTransferPageProps> = ({ onSuccess, isModal }) => {
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({
    from_store_id: '',
    to_store_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    staff_id: 1, // Replace with actual user ID in production
    reference: '',
    notes: '',
    items: [
      { product_id: '', quantity: '' }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);

  const fetchStores = async () => {
    const res = await axios.get('/api/financial/stores');
    if (res.data.success) setStores(res.data.data);
  };
  const fetchProducts = async () => {
    const res = await axios.get('/api/financial/products');
    if (res.data.success) setProducts(res.data.data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [e.target.name]: e.target.value };
    setForm({ ...form, items: newItems });
  };
  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: '' }] });
  };
  const removeItem = (index: number) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const data = {
        ...form,
        items: form.items.map(item => ({
          product_id: item.product_id,
          quantity: Number(item.quantity)
        }))
      };
      // Add details?: any[] to the local response type
      const res: typeof stockTransferService.transfer extends (data: any) => Promise<infer R> ? R & { details?: any[] } : any = await stockTransferService.transfer(data);
      if (res.success) {
        setSuccess('Stock transfer recorded successfully!');
        setForm({ ...form, reference: '', notes: '', items: [{ product_id: '', quantity: '' }] });
        if (onSuccess) onSuccess();
      } else {
        // Check for insufficient quantity error
        if (
          res &&
          typeof res === 'object' &&
          'details' in res &&
          Array.isArray((res as any).details)
        ) {
          const details = (res as any).details;
          const idToName = Object.fromEntries(products.map((p: any) => [String(p.id), p.product_name]));
          const msg = details.map((d: any) => {
            const name = idToName[String(d.product_id)] || `Product ID ${d.product_id}`;
            return `${name}: requested ${d.requested}, available ${d.available}`;
          }).join('\n');
          setError(`Insufficient quantity for:\n${msg}`);
        } else {
          setError(res.error || 'Failed to record stock transfer');
        }
      }
    } catch (err) {
      setError('Failed to record stock transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isModal ? '' : 'min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'}>
      <div className={isModal ? '' : 'max-w-3xl mx-auto'}>
        {!isModal && <h1 className="text-3xl font-bold text-gray-900 mb-6">Stock Transfer</h1>}
        <form onSubmit={handleSubmit} className={`bg-white rounded-lg shadow p-6 mb-8${isModal ? '' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Store</label>
              <select name="from_store_id" value={form.from_store_id} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="">Select Store</option>
                {stores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Store</label>
              <select name="to_store_id" value={form.to_store_id} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="">Select Store</option>
                {stores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Products to Transfer</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select name="product_id" value={item.product_id} onChange={e => handleItemChange(idx, e)} required className="border rounded px-3 py-2">
                    <option value="">Select Product</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
                  <input type="number" name="quantity" value={item.quantity} onChange={e => handleItemChange(idx, e)} required min={1} className="border rounded px-3 py-2 w-32" placeholder="Quantity" />
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-600 px-2">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-blue-600 mt-2">+ Add Product</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="transfer_date" value={form.transfer_date} onChange={handleChange} required className="w-full border rounded px-3 py-2" max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input type="text" name="reference" value={form.reference} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700" disabled={loading}>
            {loading ? 'Transferring...' : 'Transfer Stock'}
          </button>
          {error && (
            <div className="mt-2 text-red-600 whitespace-pre-line">{error}</div>
          )}
          {success && <div className="mt-2 text-green-600">{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default StockTransferPage; 