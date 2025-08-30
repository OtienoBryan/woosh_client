import React, { useState, useEffect } from 'react';
import { salesOrdersService } from '../services/financialService';
import { receiptsService } from '../services/financialService';
import { SalesOrder } from '../types/financial';
import { Search, Filter, Download, Eye, FileText } from 'lucide-react';

const InvoiceListPage: React.FC = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [amountsPaid, setAmountsPaid] = useState<{[key: number]: number}>({});
  const [loadingAmounts, setLoadingAmounts] = useState(false);

  useEffect(() => {
    fetchApprovedSalesOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [salesOrders, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    if (salesOrders.length > 0) {
      fetchAmountsPaid();
    }
  }, [salesOrders]);

  const fetchApprovedSalesOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesOrdersService.getAll();
      if (response.success) {
        const orders = response.data || [];
        console.log('Fetched orders:', orders.length);
        console.log('Orders by my_status:', orders.reduce((acc, order) => {
          acc[order.my_status] = (acc[order.my_status] || 0) + 1;
          return acc;
        }, {}));
        
        // Debug: Check for invalid numeric values
        orders.forEach((order, index) => {
          if (order.subtotal === undefined || order.subtotal === null || isNaN(order.subtotal)) {
            console.warn(`Order ${index} (ID: ${order.id}) has invalid subtotal:`, order.subtotal);
          }
          if (order.tax_amount === undefined || order.tax_amount === null || isNaN(order.tax_amount)) {
            console.warn(`Order ${index} (ID: ${order.id}) has invalid tax_amount:`, order.tax_amount);
          }
          if (order.total_amount === undefined || order.total_amount === null || isNaN(order.total_amount)) {
            console.warn(`Order ${index} (ID: ${order.id}) has invalid total_amount:`, order.total_amount);
          }
        });
        
        setSalesOrders(orders);
      } else {
        setError('Failed to fetch sales orders');
      }
    } catch (err) {
      setError('Error fetching sales orders');
      console.error('Error fetching sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmountsPaid = async () => {
    try {
      setLoadingAmounts(true);
      const amounts: {[key: number]: number} = {};
      
      // Fetch amount paid for each sales order
      for (const order of salesOrders) {
        try {
          const receiptResponse = await receiptsService.getByInvoice(order.id);
          if (receiptResponse.success && receiptResponse.data) {
            amounts[order.id] = receiptResponse.data.total_amount_paid || 0;
          } else {
            amounts[order.id] = 0;
          }
        } catch (err) {
          console.error(`Error fetching receipts for order ${order.id}:`, err);
          amounts[order.id] = 0;
        }
      }
      
      setAmountsPaid(amounts);
    } catch (err) {
      console.error('Error fetching amounts paid:', err);
      // Set all amounts to 0 if there's a general error
      const amounts: {[key: number]: number} = {};
      salesOrders.forEach(order => {
        amounts[order.id] = 0;
      });
      setAmountsPaid(amounts);
    } finally {
      setLoadingAmounts(false);
    }
  };

  const refreshAmountsPaid = async () => {
    if (salesOrders.length > 0) {
      await fetchAmountsPaid();
    }
  };

  const filterOrders = () => {
    let filtered = [...salesOrders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.so_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.salesrep?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.my_status === parseInt(statusFilter));
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date);
        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === today.toDateString();
          case 'week':
            return orderDate >= sevenDaysAgo;
          case 'month':
            return orderDate >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle invalid values safely
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const safeNumber = (value: any): number => {
    if (value === undefined || value === null || value === '') {
      return 0;
    }
    // Handle string numbers
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return 0;
      const num = parseFloat(trimmed);
      return isNaN(num) ? 0 : num;
    }
    // Handle numbers
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    // Handle other types
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (myStatus: number) => {
    const statusConfig = {
      1: { label: 'APPROVED', color: 'bg-green-100 text-green-800' },
      2: { label: 'ASSIGNED', color: 'bg-blue-100 text-blue-800' },
      3: { label: 'IN TRANSIT', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[myStatus as keyof typeof statusConfig];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || `STATUS ${myStatus}`}
      </span>
    );
  };

  const getStatusBadgeText = (myStatus: number) => {
    const statusConfig = {
      1: 'APPROVED',
      2: 'ASSIGNED', 
      3: 'IN TRANSIT'
    };

    return statusConfig[myStatus as keyof typeof statusConfig] || `STATUS ${myStatus}`;
  };

  const exportToCSV = () => {
    const headers = ['SO Number', 'Customer', 'Sales Rep', 'Order Date', 'Approval Status', 'Subtotal', 'Tax', 'Total Amount', 'Amount Paid', 'Balance'];
    const csvData = filteredOrders.map(order => [
      order.so_number,
      order.customer_name || 'N/A',
      order.salesrep || 'N/A',
      formatDate(order.order_date),
      getStatusBadgeText(order.my_status || 0),
      formatCurrency(safeNumber(order.subtotal)),
      formatCurrency(safeNumber(order.tax_amount)),
      formatCurrency(safeNumber(order.total_amount)),
      formatCurrency(safeNumber(amountsPaid[order.id])),
      formatCurrency(safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id]))
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchApprovedSalesOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice List</h1>
               
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshAmountsPaid}
                disabled={loadingAmounts}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`h-4 w-4 mr-2 ${loadingAmounts ? 'animate-spin' : ''}`}>
                  {loadingAmounts ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </div>
                {loadingAmounts ? 'Loading...' : 'Refresh Payments'}
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary - Moved to top */}
        {salesOrders.length > 0 ? (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            {/* Overall Totals */}
            <div className="mb-6">
              {/* <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Financial Summary</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Overview of all sales orders regardless of current filters
              </p> */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {salesOrders.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + safeNumber(order.total_amount), 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + safeNumber(order.tax_amount), 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Tax</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + safeNumber(amountsPaid[order.id]), 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + (safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id])), 0))}
                  </div>
                  <div className="text-sm text-gray-600">Outstanding</div>
                </div>
              </div>
            </div>

            {/* Filtered Results Summary */}
            {filteredOrders.length !== salesOrders.length && (
              <div className="mb-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Filtered Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">
                      {filteredOrders.length}
                    </div>
                    <div className="text-sm text-gray-600">Filtered Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + safeNumber(order.total_amount), 0))}
                    </div>
                    <div className="text-sm text-gray-600">Filtered Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + safeNumber(order.tax_amount), 0))}
                    </div>
                    <div className="text-sm text-gray-600">Filtered Tax</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + safeNumber(amountsPaid[order.id]), 0))}
                    </div>
                    <div className="text-sm text-gray-600">Filtered Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + (safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id])), 0))}
                    </div>
                    <div className="text-sm text-gray-600">Filtered Outstanding</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Breakdown */}
            <div className="pt-6 border-t border-gray-200 hidden">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-3">Status Breakdown</div>
                <div className="flex items-center justify-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {salesOrders.filter(order => order.my_status === 1).length} Approved
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {salesOrders.filter(order => order.my_status === 2).length} Assigned
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {salesOrders.filter(order => order.my_status === 3).length} In Transit
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="text-center text-gray-500">
              <p>No sales orders available to display summary</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SO number, customer, or sales rep..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Approval Statuses</option>
                <option value="1">Approved (1)</option>
                <option value="2">Assigned (2)</option>
                <option value="3">In Transit (3)</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* Results Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
              <div className="text-lg font-semibold text-gray-900">
                {filteredOrders.length} of {salesOrders.length}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                    {loadingAmounts && (
                      <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No sales orders found</p>
                      <p className="text-gray-600">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                          ? 'Try adjusting your filters or search terms'
                          : 'Sales orders with approval status 1, 2, or 3 will appear here'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.so_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.salesrep || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.my_status || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(safeNumber(order.subtotal))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(safeNumber(order.tax_amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(safeNumber(order.total_amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loadingAmounts ? (
                          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                        ) : (
                          <span className={safeNumber(amountsPaid[order.id]) > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {formatCurrency(safeNumber(amountsPaid[order.id]))}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loadingAmounts ? (
                          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                        ) : (
                          <span className={safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id]) > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                            {formatCurrency(safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id]))}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/sales-orders/${order.id}`, '_blank')}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="View Details"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Invoice
                          </button>
                        </div>
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
  );
};

export default InvoiceListPage;
