import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  availabilityReportService, 
  AvailabilityReport, 
  AvailabilityReportFilters 
} from '../services/availabilityReportService';
import {
  BarChart3Icon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PackageIcon,
  TrendingUpIcon,
  FilterIcon,
  DownloadIcon,
  EyeIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from 'lucide-react';

const AvailabilityReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AvailabilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AvailabilityReportFilters>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [salesReps, setSalesReps] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchReports();
    fetchFilterData();
  }, [filters, page, limit, search]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await availabilityReportService.getAvailabilityReports(
        filters,
        page,
        limit,
        search
      );
      setReports(response.reports);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch availability reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [countriesData, salesRepsData] = await Promise.all([
        availabilityReportService.getAvailabilityCountries(),
        availabilityReportService.getAvailabilitySalesReps()
      ]);
      setCountries(countriesData);
      setSalesReps(salesRepsData);
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  };

  const handleFilterChange = (key: keyof AvailabilityReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExport = async () => {
    try {
      const blob = await availabilityReportService.exportAvailabilityReports(filters, search);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `availability-reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export reports');
      console.error('Error exporting reports:', err);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Group reports by client (outlet) and date
  const getGroupedReports = () => {
    const grouped = reports.reduce((acc, report) => {
      const dateKey = report.createdAt.split('T')[0]; // Get date part only
      const groupKey = `${report.clientId}-${dateKey}`;
      
      if (!acc[groupKey]) {
        acc[groupKey] = {
          clientId: report.clientId,
          clientName: report.clientName,
          countryName: report.countryName,
          salesRepName: report.salesRepName,
          reportDate: dateKey,
          createdAt: report.createdAt,
          products: []
        };
      }
      acc[groupKey].products.push({
        productName: report.productName,
        quantity: report.quantity,
        comment: report.comment,
        createdAt: report.createdAt
      });
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a, b) => {
      // Sort by date (newest first), then by client name
      const dateComparison = new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.clientName.localeCompare(b.clientName);
    });
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!reports.length) return null;

    const totalOutlets = new Set(reports.map(r => r.clientId)).size;
    const totalProducts = reports.length;
    const totalCountries = new Set(reports.map(r => r.countryName || 'Unknown')).size;
    const totalSalesReps = new Set(reports.map(r => r.salesRepName || 'Unknown')).size;
    
    // Calculate availability status
    const availableProducts = reports.filter(r => r.quantity > 0).length;
    const unavailableProducts = reports.filter(r => r.quantity === 0).length;
    const availabilityRate = totalProducts > 0 ? (availableProducts / totalProducts * 100).toFixed(1) : 0;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReports = reports.filter(r => new Date(r.createdAt) >= sevenDaysAgo).length;

    return {
      totalOutlets,
      totalProducts,
      totalCountries,
      totalSalesReps,
      availableProducts,
      unavailableProducts,
      availabilityRate,
      recentReports
    };
  }, [reports]);

  // Calculate country distribution
  const countryDistribution = useMemo(() => {
    if (!reports.length) return [];
    
    const countryCounts = reports.reduce((acc, report) => {
      const countryName = report.countryName || 'Unknown';
      acc[countryName] = (acc[countryName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reports]);

  // Calculate product availability trends
  const availabilityTrends = useMemo(() => {
    if (!reports.length) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayReports = reports.filter(r => 
        r.createdAt.startsWith(date)
      );
      const available = dayReports.filter(r => r.quantity > 0).length;
      const total = dayReports.length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        available,
        total,
        rate: total > 0 ? (available / total * 100).toFixed(1) : 0
      };
    });
  }, [reports]);

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Availability Reports</h1>
              <p className="text-gray-600 mt-2">Track product availability across all outlets</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/visibility-report')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Visibility Reports</span>
              </button>
              <button
                onClick={() => navigate('/feedback-reports')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <BarChart3Icon className="h-4 w-4" />
                <span>Feedback Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <PackageIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <MapPinIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Outlets</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalOutlets}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <TrendingUpIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Availability Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryMetrics.availabilityRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryMetrics.recentReports}</p>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 hidden">
          {/* Country Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-3">
              {countryDistribution.map((item, index) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${index * 60}, 70%, 60%)` }}></div>
                    <span className="text-sm font-medium text-gray-700">{item.country}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count} reports</span>
                </div>
              ))}
            </div>
          </div>

          {/* Availability Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Trends (7 Days)</h3>
            <div className="space-y-3">
              {availabilityTrends.map((item, index) => (
                <div key={item.date} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.date}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{item.available}/{item.total}</span>
                    <span className="text-sm font-medium text-green-600">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by outlet, comment, country, or sales rep..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <FilterIcon className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(Object.values(filters).some(v => v) || search) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => 
                value && (
                  <span
                    key={key}
                    className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium"
                  >
                    {key}: {value}
                  </span>
                )
              )}
              {search && (
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                  search: {search}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-red-600 text-xs hover:text-red-800 font-medium"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Reports</h3>
            <p className="text-sm text-gray-600 mt-1">Showing {reports.length} of {total} reports</p>
          </div>
          <div className="p-6">
            {getGroupedReports().map((group) => (
              <div key={`${group.clientId}-${group.reportDate}`} className="mb-8 last:mb-0">
                {/* Outlet Header */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{group.clientName}</h4>
                      <p className="text-sm text-gray-600">Outlet</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{group.countryName}</p>
                      <p className="text-sm text-gray-600">Country</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{group.salesRepName}</p>
                      <p className="text-sm text-gray-600">Sales Rep</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{new Date(group.reportDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Report Date</p>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comment
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.products.map((product: any) => (
                        <tr key={`${group.clientId}-${group.reportDate}-${product.productName}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.productName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.quantity > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.quantity > 0 ? (
                                <>
                                  <CheckCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {product.quantity}
                                </>
                              ) : (
                                <>
                                  <AlertCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Out of Stock
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                            <div className="truncate" title={product.comment}>
                              {product.comment || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(product.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          
          {reports.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-900">No availability reports found</h3>
              <p className="text-sm text-gray-500">No reports match the selected filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, total)}
                  </span>{' '}
                  of <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Show:</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={total}>All</option>
                  </select>
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outlet
                    </label>
                    <input
                      type="text"
                      value={filters.outlet || ''}
                      onChange={(e) => handleFilterChange('outlet', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter outlet name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment
                    </label>
                    <input
                      type="text"
                      value={filters.comment || ''}
                      onChange={(e) => handleFilterChange('comment', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter comment"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={filters.country || ''}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Countries</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sales Rep
                    </label>
                    <select
                      value={filters.salesRep || ''}
                      onChange={(e) => handleFilterChange('salesRep', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Sales Reps</option>
                      {salesReps.map((rep) => (
                        <option key={rep} value={rep}>
                          {rep}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      clearFilters();
                      setShowFilterModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    Clear All
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

export default AvailabilityReportPage;