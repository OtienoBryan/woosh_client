import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface Asset {
  id: number;
  account_id: number;
  name: string;
  category?: string;
  purchase_date: string;
  purchase_value: number;
  description?: string;
  created_at: string;
  updated_at: string;
  total_depreciation?: number;
  current_value?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/financial/assets-with-depreciation`);
        if (res.data.success) {
          setAssets(res.data.data);
        } else {
          setError(res.data.error || 'Failed to fetch assets');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };
    const fetchTotalValue = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/financial/assets-total-value`);
        if (res.data.success) {
          setTotalValue(res.data.total_value);
        }
      } catch {}
    };
    fetchAssets();
    fetchTotalValue();
  }, []);

  // Helper to format date as 'MMM dd, yyyy'
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  // Filtered assets based on search
  const filteredAssets = assets.filter(asset => {
    const searchLower = search.toLowerCase();
    return (
      asset.name.toLowerCase().includes(searchLower) ||
      (asset.description?.toLowerCase().includes(searchLower) ?? false) ||
      asset.purchase_date.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">All Assets</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {totalValue !== null && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 inline-block shadow">
            <div className="text-gray-700 text-sm font-medium mb-1">Total Current Value of All Assets</div>
            <div className="text-2xl font-bold text-blue-800">{
              new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(totalValue)
            }</div>
          </div>
        )}
        <Link
          to="/assets/add"
          className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-4 py-2 shadow hover:bg-blue-50 transition-colors"
          style={{ minWidth: 0 }}
        >
          <Plus className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">Add Asset</span>
        </Link>

        <Link
          to="/assets/depreciation"
          className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-4 py-2 shadow hover:bg-blue-50 transition-colors"
          style={{ minWidth: 0 }}
        >
          <Plus className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">Asset Depreciation Report</span>
        </Link>
      </div>
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search assets..."
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {loading ? (
        <div className="text-gray-600">Loading assets...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b text-left">Name</th>
                <th className="px-4 py-2 border-b text-left">Category</th>
                <th className="px-4 py-2 border-b text-left">Purchase Date</th>
                <th className="px-4 py-2 border-b text-left">Purchase Value</th>
                <th className="px-4 py-2 border-b text-left">Total Depreciation</th>
                <th className="px-4 py-2 border-b text-left">Current Value</th>
                <th className="px-4 py-2 border-b text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">No assets found.</td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    <td className="px-4 py-2 border-b">{asset.name}</td>
                    <td className="px-4 py-2 border-b">{asset.category || '-'}</td>
                    <td className="px-4 py-2 border-b">{formatDate(asset.purchase_date)}</td>
                    <td className="px-4 py-2 border-b">{asset.purchase_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 border-b">{asset.total_depreciation?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}</td>
                    <td className="px-4 py-2 border-b">{asset.current_value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? asset.purchase_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 border-b">{asset.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssetsPage; 