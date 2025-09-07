import React, { useState, useEffect } from 'react';
import { salesService, MasterSalesData } from '../services/salesService';
import { Search, Download, Filter, TrendingUp, Users, DollarSign, Calendar, BarChart3, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const MasterSalesPage: React.FC = () => {
  const [salesData, setSalesData] = useState<MasterSalesData[]>([]);
  const [filteredData, setFilteredData] = useState<MasterSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedSalesReps, setSelectedSalesReps] = useState<number[]>([]);
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [clientStatus, setClientStatus] = useState<string>('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [salesReps, setSalesReps] = useState<{ id: number; name: string }[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [salesDetails, setSalesDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewType, setViewType] = useState<'sales' | 'quantity'>('sales');

  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    fetchSalesData();
  }, [selectedYear, selectedCategories, selectedSalesReps, selectedCategoryGroup, startDate, endDate, clientStatus, viewType]);

  useEffect(() => {
    fetchCategories();
    fetchSalesReps();
  }, []);

  useEffect(() => {
    filterData();
    setCurrentPage(1); // Reset to first page when data changes
  }, [salesData, searchQuery]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoryIds = selectedCategories.length > 0 ? selectedCategories : undefined;
      const salesRepIds = selectedSalesReps.length > 0 ? selectedSalesReps : undefined;
      const categoryGroup = selectedCategoryGroup || undefined;
      const startDateParam = startDate || undefined;
      const endDateParam = endDate || undefined;
      const clientStatusParam = clientStatus || undefined;
      const data = await salesService.getMasterSalesData(selectedYear, categoryIds, salesRepIds, categoryGroup, startDateParam, endDateParam, clientStatusParam, viewType);
      setSalesData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await salesService.getMasterSalesCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const data = await salesService.getMasterSalesSalesReps();
      setSalesReps(data);
    } catch (err: any) {
      console.error('Failed to fetch sales reps:', err);
    }
  };

  const fetchSalesDetails = async (clientId: number, month: string) => {
    try {
      setLoadingDetails(true);
      const monthNumber = months.indexOf(month) + 1;
      const response = await fetch(`/api/sales/client-month-details?clientId=${clientId}&month=${monthNumber}&year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setSalesDetails(data);
      } else {
        setSalesDetails([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch sales details:', err);
      setSalesDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterData = () => {
    if (!searchQuery.trim()) {
      setFilteredData(salesData);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = salesData.filter(client =>
      client.client_name.toLowerCase().includes(query)
    );
    setFilteredData(filtered);
  };

  const exportToCSV = async () => {
    try {
      setExporting(true);
      const csvContent = generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      const filterSuffix = [
        selectedYear !== new Date().getFullYear() ? `-${selectedYear}` : '',
        startDate ? `-from-${startDate}` : '',
        endDate ? `-to-${endDate}` : '',
        selectedCategories.length > 0 ? `-${selectedCategories.length}-categories` : '',
        selectedSalesReps.length > 0 ? `-${selectedSalesReps.length}-reps` : '',
        selectedCategoryGroup ? `-${selectedCategoryGroup}` : '',
        clientStatus ? `-${clientStatus}` : ''
      ].filter(Boolean).join('');
      link.setAttribute('download', `master-${viewType === 'sales' ? 'sales' : 'quantities'}-${selectedYear}-${dateStr}${filterSuffix}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const generateCSVContent = () => {
    const headers = ['Client Name', ...monthLabels, 'Total'];
    const rows = sortedData.map(client => [
      client.client_name,
      ...months.map(month => {
        const value = parseFloat(String((client as any)[month])) || 0;
        return viewType === 'sales' ? formatCurrency(value) : value.toLocaleString();
      }),
      (() => {
        const total = parseFloat(String(client.total)) || 0;
        return viewType === 'sales' ? formatCurrency(total) : total.toLocaleString();
      })()
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getSortedData = () => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let aValue, bValue;
      
      if (sortColumn === 'client_name') {
        aValue = a.client_name.toLowerCase();
        bValue = b.client_name.toLowerCase();
      } else if (sortColumn === 'total') {
        aValue = parseFloat(String(a.total)) || 0;
        bValue = parseFloat(String(b.total)) || 0;
      } else {
        // It's a month column
        aValue = parseFloat(String((a as any)[sortColumn])) || 0;
        bValue = parseFloat(String((b as any)[sortColumn])) || 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedData = getSortedData();
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleCellClick = async (client: MasterSalesData, month: string) => {
    const monthValue = parseFloat((client as any)[month]) || 0;
    if (monthValue > 0) {
      setSelectedClient({ id: client.client_id, name: client.client_name });
      setSelectedMonth(month);
      setShowSalesDetailModal(true);
      await fetchSalesDetails(client.client_id, month);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Calculate summary statistics
  const totalValue = sortedData.reduce((sum, client) => sum + (parseFloat(String(client.total)) || 0), 0);
  const totalClients = sortedData.length;
  const avgValuePerClient = totalClients > 0 ? totalValue / totalClients : 0;
  const activeFilters = [
    selectedYear !== new Date().getFullYear(),
    startDate,
    endDate,
    selectedCategories.length > 0,
    selectedSalesReps.length > 0,
    selectedCategoryGroup,
    clientStatus
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading master sales data...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your sales information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchSalesData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Master {viewType === 'sales' ? 'Sales' : 'Quantities'} Report
              </h1>
               
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              {/* View Type Toggle */}
              <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-gray-200 p-1">
                <button
                  onClick={() => setViewType('sales')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    viewType === 'sales'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Sales Value
                </button>
                <button
                  onClick={() => setViewType('quantity')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    viewType === 'quantity'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Quantities
                </button>
              </div>
              
              <button
                onClick={() => setShowFilterModal(true)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeFilters > 0
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-200 hover:bg-orange-200'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-5 w-5" />
                Filters
                {activeFilters > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting || sortedData.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {viewType === 'sales' ? 'Total Sales' : 'Total Quantities'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {viewType === 'sales' ? formatCurrency(totalValue) : totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{totalClients.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {viewType === 'sales' ? 'Avg Sales/Client' : 'Avg Quantities/Client'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {viewType === 'sales' ? formatCurrency(avgValuePerClient) : Math.round(avgValuePerClient).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Year</p>
                <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                  placeholder="Search clients by name..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 className="h-4 w-4" />
              <span>{sortedData.length} of {salesData.length} clients</span>
            </div>
          </div>
        </div>

        {/* Enhanced Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Sales Data</h2>
            <p className="text-sm text-gray-600 mt-1">Monthly breakdown for all clients</p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('client_name')}
                    >
                      <div className="flex items-center gap-2">
                      Client Name
                        {sortColumn === 'client_name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </th>
                    {monthLabels.map((month, index) => {
                      const monthKey = months[index];
                      return (
                        <th 
                          key={month} 
                          className="px-4 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                          onClick={() => handleSort(monthKey)}
                        >
                          <div className="flex items-center justify-end gap-2">
                        {month}
                            {sortColumn === monthKey ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                      </th>
                      );
                    })}
                    <th 
                      className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors duration-150"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-end gap-2">
                      Total
                        {sortColumn === 'total' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No sales data found</p>
                          <p className="text-sm">Try adjusting your filters or search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentData.map((client, index) => (
                      <tr key={client.client_id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            {client.client_name}
                          </div>
                        </td>
                        {months.map((month) => {
                          const monthValue = parseFloat(String((client as any)[month])) || 0;
                          return (
                            <td 
                              key={month} 
                              className={`whitespace-nowrap px-4 py-4 text-sm text-right text-gray-900 ${
                                monthValue > 0 ? 'cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150' : ''
                              }`}
                              onClick={() => handleCellClick(client, month)}
                            >
                              {viewType === 'sales' ? formatCurrency(monthValue) : monthValue.toLocaleString()}
                          </td>
                          );
                        })}
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-right text-blue-900 bg-blue-50">
                          {viewType === 'sales' ? formatCurrency(parseFloat(String(client.total)) || 0) : (parseFloat(String(client.total)) || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                
                                 {/* Enhanced Summary Row */}
                 {sortedData.length > 0 && (
                   <tfoot className="bg-gray-100">
                     <tr>
                       <td className="px-6 py-4 text-sm font-bold text-gray-900 sticky left-0 bg-gray-100 z-10">
                         <div className="flex items-center">
                           <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                           Grand Total
                         </div>
                       </td>
                       {months.map((month) => {
                         const monthTotal = sortedData.reduce((sum, client) => {
                           const monthValue = (client as any)[month];
                           return sum + (parseFloat(String(monthValue)) || 0);
                         }, 0);
                         return (
                           <td key={month} className="px-4 py-4 text-sm font-bold text-right text-gray-900">
                             {viewType === 'sales' ? formatCurrency(monthTotal) : monthTotal.toLocaleString()}
                           </td>
                         );
                       })}
                       <td className="px-6 py-4 text-sm font-bold text-right text-green-900 bg-green-100">
                         {viewType === 'sales' ? formatCurrency(sortedData.reduce((sum, client) => sum + (parseFloat(String(client.total)) || 0), 0)) : sortedData.reduce((sum, client) => sum + (parseFloat(String(client.total)) || 0), 0).toLocaleString()}
                       </td>
                     </tr>
                   </tfoot>
                 )}
              </table>
            </div>
          </div>
        </div>

        {/* Enhanced Pagination Controls */}
        {totalItems > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page and info */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">entries per page</span>
                </div>
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                </div>
              </div>

              {/* Enhanced Pagination buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                      disabled={page === '...'}
                      className={`px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : page === '...'
                          ? 'text-gray-400 cursor-default'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Filter Options</h2>
                    <p className="text-gray-600 mt-1">Customize your sales data view</p>
                  </div>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowFilterModal(false)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Year */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Year
                    </h3>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Date Range
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  {/* Category Group */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Category Group
                    </h3>
                    <select
                      value={selectedCategoryGroup}
                      onChange={(e) => setSelectedCategoryGroup(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                    >
                      <option value="">All Categories</option>
                      <option value="vapes">Vapes</option>
                      <option value="pouches">Pouches</option>
                    </select>
                  </div>

                  {/* Client Status */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      Client Status
                    </h3>
                    <select
                      value={clientStatus}
                      onChange={(e) => setClientStatus(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                    >
                      <option value="">All Clients</option>
                      <option value="active">Active Clients</option>
                      <option value="inactive">Inactive Clients</option>
                    </select>
                  </div>

                  {/* SKUs */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      SKUs
                    </h3>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center mb-3 cursor-pointer hover:bg-white p-2 rounded transition-colors duration-150">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category.id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                              }
                            }}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Sales Reps */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-600" />
                      Sales Representatives
                    </h3>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {salesReps.map(salesRep => (
                        <label key={salesRep.id} className="flex items-center mb-3 cursor-pointer hover:bg-white p-2 rounded transition-colors duration-150">
                          <input
                            type="checkbox"
                            checked={selectedSalesReps.includes(salesRep.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSalesReps([...selectedSalesReps, salesRep.id]);
                              } else {
                                setSelectedSalesReps(selectedSalesReps.filter(id => id !== salesRep.id));
                              }
                            }}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{salesRep.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedSalesReps([])}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedYear(new Date().getFullYear());
                      setStartDate('');
                      setEndDate('');
                      setSelectedCategoryGroup('');
                      setClientStatus('');
                      setSelectedCategories([]);
                      setSelectedSalesReps([]);
                    }}
                    className="px-6 py-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors duration-200 font-medium"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Details Modal */}
        {showSalesDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Sales Details - {selectedClient?.name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {monthLabels[months.indexOf(selectedMonth)]} {selectedYear}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {salesDetails.length} order items
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Total: {formatCurrency(salesDetails.reduce((sum, detail) => sum + (parseFloat(String(detail.line_total)) || 0), 0))}
                      </span>
                    </div>
                  </div>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowSalesDetailModal(false)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <span className="ml-4 text-gray-600">Loading sales details...</span>
                  </div>
                ) : salesDetails.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No sales details found</p>
                    <p className="text-sm text-gray-400">No individual sales records for this client and month</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Line Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sales Rep
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesDetails.map((detail, index) => (
                          <tr key={`${detail.order_id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              #{detail.order_number || detail.order_id}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(detail.order_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium">{detail.product_name}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {detail.category_name || 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {detail.quantity}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(parseFloat(String(detail.unit_price)) || 0)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(parseFloat(String(detail.line_total)) || 0)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {detail.sales_rep_name || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-sm font-bold text-gray-900 text-right">
                            Grand Total:
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 text-right">
                            {formatCurrency(salesDetails.reduce((sum, detail) => sum + (parseFloat(String(detail.line_total)) || 0), 0))}
                          </td>
                          <td className="px-4 py-4"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSalesDetailModal(false)}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterSalesPage; 