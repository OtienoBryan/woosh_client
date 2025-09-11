import React, { useEffect, useState } from 'react';
import { inventoryTransactionsService } from '../services/financialService';
import { productsService } from '../services/financialService';
import axios from 'axios';

interface InventoryTransaction {
  id: number;
  product_id: number;
  reference: string;
  amount_in: number;
  amount_out: number;
  balance: number;
  date_received: string;
  store_id: number;
  staff_id: number;
  product_name?: string;
  store_name?: string;
  staff_name?: string;
}

interface Product {
  id: number;
  product_code: string;
  product_name: string;
}

interface Store {
  id: number;
  store_name: string;
}

const InventoryTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(50);

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [selectedProduct, selectedStore, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedProduct) params.product_id = selectedProduct;
      if (selectedStore) params.store_id = selectedStore;
      params.page = page;
      params.limit = pageSize;
      params.orderBy = 'id';
      params.orderDirection = 'DESC';
      const response = await inventoryTransactionsService.getAll(params);
      if (response.success && response.data) {
        setTransactions(response.data);
        if (response.pagination && response.pagination.totalPages) setTotalPages(response.pagination.totalPages);
        else setTotalPages(1);
      } else {
        setError(response.error || 'Failed to fetch inventory transactions');
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch inventory transactions');
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch {}
  };

  const fetchStores = async () => {
    try {
      // Directly fetch stores since there is no storeService
      const response = await axios.get('/api/financial/stores');
      if (response.data.success && response.data.data) {
        setStores(response.data.data);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Inventory Transactions</h1>
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="product-select" className="text-sm font-medium text-gray-700">Product:</label>
            <select
              id="product-select"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="store-select" className="text-sm font-medium text-gray-700">Store:</label>
            <select
              id="store-select"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
            >
              <option value="">All Stores</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.store_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center">
              <div className="mb-2">{error}</div>
              <button onClick={fetchTransactions} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Retry</button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-gray-500 text-center">No inventory transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date Received</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-green-700 uppercase">Amount In</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-red-700 uppercase">Amount Out</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-indigo-700 uppercase bg-indigo-50">Balance</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tx.date_received ? new Date(tx.date_received).toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tx.product_name || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tx.reference || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-green-700 text-right font-medium">{tx.amount_in ? tx.amount_in.toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-700 text-right font-medium">{tx.amount_out ? tx.amount_out.toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-indigo-900 font-bold text-right bg-indigo-50">{tx.balance.toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tx.store_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTransactionsPage; 