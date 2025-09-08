import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { upliftSaleService } from '../services/upliftSaleService';
import { UpliftSale, UpliftSaleItem, OutletAccount, SalesRep } from '../types/financial';

const formatCurrency = (amount: number) => 
  (amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' });

const formatDate = (date: string) => new Date(date).toLocaleDateString();

const getStatusBadge = (status: string) => {
  const statusClasses = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const UpliftSalesPage: React.FC = () => {
  const [upliftSales, setUpliftSales] = useState<UpliftSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    outletAccountId: '',
    salesRepId: '',
    startDate: '',
    endDate: '',
  });
  const [outletAccounts, setOutletAccounts] = useState<OutletAccount[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    completedCount: 0,
  });
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<UpliftSale | null>(null);
  const [saleItems, setSaleItems] = useState<UpliftSaleItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const loadUpliftSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.outletAccountId && { outletAccountId: parseInt(filters.outletAccountId) }),
        ...(filters.salesRepId && { salesRepId: parseInt(filters.salesRepId) }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const response = await upliftSaleService.getUpliftSales(params);
      
      if (response.success) {
        setUpliftSales(response.data || []);
        setTotalPages(response.pagination?.total_pages || 1);
        setTotal(response.pagination?.total_items || 0);
      } else {
        setError('Failed to load uplift sales');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load uplift sales');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status && { status: filters.status }),
      };

      const response = await upliftSaleService.getUpliftSalesSummary(params);
      
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const loadOutletAccounts = async () => {
    try {
      const response = await upliftSaleService.getOutletAccounts();
      
      if (response.success) {
        setOutletAccounts(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load outlet accounts:', err);
    }
  };

  const loadSalesReps = async () => {
    try {
      const response = await upliftSaleService.getSalesReps();
      
      if (response.success) {
        setSalesReps(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load sales reps:', err);
    }
  };

  useEffect(() => {
    loadUpliftSales();
  }, [page, limit, filters]);

  useEffect(() => {
    loadSummary();
  }, [filters]);

  useEffect(() => {
    loadOutletAccounts();
    loadSalesReps();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await upliftSaleService.updateUpliftSale(id, { status: newStatus as any });
      
      if (response.success) {
        await loadUpliftSales();
        await loadSummary();
      } else {
        setError('Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this uplift sale?')) {
      return;
    }

    try {
      const response = await upliftSaleService.deleteUpliftSale(id);
      
      if (response.success) {
        await loadUpliftSales();
        await loadSummary();
      } else {
        setError('Failed to delete uplift sale');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete uplift sale');
    }
  };

  const handleViewItems = async (sale: UpliftSale) => {
    setSelectedSale(sale);
    setShowItemsModal(true);
    setItemsError(null);
    
    try {
      setItemsLoading(true);
      const response = await upliftSaleService.getUpliftSaleItems(sale.id);
      
      if (response.success) {
        setSaleItems(response.data || []);
      } else {
        setItemsError('Failed to load sale items');
      }
    } catch (err: any) {
      setItemsError(err.message || 'Failed to load sale items');
    } finally {
      setItemsLoading(false);
    }
  };

  const closeItemsModal = () => {
    setShowItemsModal(false);
    setSelectedSale(null);
    setSaleItems([]);
    setItemsError(null);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: '',
      outletAccountId: '',
      salesRepId: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.status || filters.search || filters.outletAccountId || filters.salesRepId || filters.startDate || filters.endDate;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Uplift Sales</h1>
             
          </div>
           
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalSales}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
          </div>
          {/* <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</p>
          </div> */}
          {/* <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{summary.completedCount}</p>
          </div> */}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Account</label>
              <select
                value={filters.outletAccountId}
                onChange={(e) => setFilters(prev => ({ ...prev, outletAccountId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Outlet Accounts</option>
                {outletAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
              <select
                value={filters.salesRepId}
                onChange={(e) => setFilters(prev => ({ ...prev, salesRepId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Sales Reps</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search client or sales rep..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales Rep
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upliftSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          No uplift sales found
                        </td>
                      </tr>
                    ) : (
                      upliftSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            #{sale.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {sale.client_name || sale.client?.name || `Client ${sale.clientId}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {sale.user_name || sale.salesRep?.name || `Sales Rep ${sale.userId}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewItems(sale)}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                View Items
                              </button>
                              {sale.status === 'pending' && (
                                <>
                                  {/* <button
                                    onClick={() => handleStatusChange(sale.id, 'approved')}
                                    className="text-green-600 hover:text-green-900 text-xs"
                                  >
                                    Approve
                                  </button> */}
                                  <button
                                    onClick={() => handleStatusChange(sale.id, 'rejected')}
                                    className="text-red-600 hover:text-red-900 text-xs"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {sale.status === 'approved' && (
                                <button
                                  onClick={() => handleStatusChange(sale.id, 'completed')}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                >
                                  Complete
                                </button>
                              )}
                              {/* <button
                                onClick={() => handleDelete(sale.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Delete
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages} • {total} records
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={limit}
                    onChange={(e) => {
                      setPage(1);
                      setLimit(parseInt(e.target.value) || 25);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sale Items Modal */}
        {showItemsModal && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sale Items - #{selectedSale.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedSale.client_name} • {selectedSale.user_name} • {formatDate(selectedSale.createdAt)}
                  </p>
                </div>
                <button
                  onClick={closeItemsModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {itemsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : itemsError ? (
                  <div className="text-center py-8 text-red-600">{itemsError}</div>
                ) : saleItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No items found for this sale</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {saleItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">
                                  {item.product_name || `Product ${item.productId}`}
                                </div>
                                {item.product_code && (
                                  <div className="text-xs text-gray-500">
                                    Code: {item.product_code}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            Grand Total:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {formatCurrency(saleItems.reduce((sum, item) => sum + item.total, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpliftSalesPage;
