import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { 
  ArrowRight, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  FileText,
  Building2,
  RefreshCw
} from 'lucide-react';

interface AgingPayable {
  supplier_id: number;
  company_name: string;
  total_payable: number;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

const formatCurrency = (n: number) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' });

const PayablesPage: React.FC = () => {
  const [payables, setPayables] = useState<AgingPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const fetchPayables = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = API_CONFIG.getUrl('/financial/payables/aging');
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setPayables(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payables;
    return payables.filter(p => String(p.company_name || '').toLowerCase().includes(q));
  }, [payables, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.total_payable += Number(r.total_payable || 0);
        acc.current += Number(r.current || 0);
        acc.days_1_30 += Number(r.days_1_30 || 0);
        acc.days_31_60 += Number(r.days_31_60 || 0);
        acc.days_61_90 += Number(r.days_61_90 || 0);
        acc.days_90_plus += Number(r.days_90_plus || 0);
        return acc;
      },
      { total_payable: 0, current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0 }
    );
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const startIdx = (page - 1) * limit;
  const pageRows = filtered.slice(startIdx, startIdx + limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Aging Payables</h1>
                <p className="text-xs text-gray-600 mt-0.5">Track and manage supplier payment obligations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchPayables}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-xs font-medium"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide mb-1">Total Payable</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.total_payable)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide mb-1">Current</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totals.current)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide mb-1">1-30 Days</p>
            <p className="text-lg font-bold text-yellow-600">{formatCurrency(totals.days_1_30)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide mb-1">31-60 Days</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.days_31_60)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide mb-1">61-90 Days</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totals.days_61_90)}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-3 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-red-100 uppercase tracking-wide mb-1">90+ Days</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.days_90_plus)}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                placeholder="Search suppliers by name..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{filtered.length} Suppliers</span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <div>
                <p className="text-xs font-medium text-red-800">Error Loading Payables</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-600 font-medium">Loading payables data...</p>
            </div>
          </div>
        ) : (
          /* Data Table */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      Total Payable
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      Current
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      1-30 Days
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      31-60 Days
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      61-90 Days
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      90+ Days
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="p-2 bg-gray-100 rounded-full mb-2">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium">No suppliers found</p>
                          <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr key={row.supplier_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-xs font-semibold text-gray-900">{row.company_name}</div>
                              <div className="text-[10px] text-gray-500">ID: {row.supplier_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <span className="text-xs font-bold text-gray-900">{formatCurrency(row.total_payable)}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <span className="text-xs text-green-600 font-medium">{formatCurrency(row.current)}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <span className="text-xs text-yellow-600 font-medium">{formatCurrency(row.days_1_30)}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <span className="text-xs text-orange-600 font-medium">{formatCurrency(row.days_31_60)}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <span className="text-xs text-red-600 font-medium">{formatCurrency(row.days_61_90)}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <span className="text-xs text-red-700 font-bold">{formatCurrency(row.days_90_plus)}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <Link 
                            to={`/suppliers/${row.supplier_id}/ledger`} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                          >
                            View Ledger
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageRows.length > 0 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-gray-700">
                    Showing <span className="font-semibold">{startIdx + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(startIdx + limit, filtered.length)}</span> of{' '}
                    <span className="font-semibold">{filtered.length}</span> suppliers
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={limit}
                      onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayablesPage;
