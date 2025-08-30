import React, { useEffect, useState } from 'react';
import { myVisibilityReportService, MyVisibilityReport } from '../services/myVisibilityReportService';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Calendar, 
  MapPin, 
  User, 
  MessageSquare, 
  Image, 
  ArrowRight, 
  Search,
  Download,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const MyVisibilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<MyVisibilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  // Set current date as default
  const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  useEffect(() => {
    fetchReports();
  }, []);

    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await myVisibilityReportService.getAll();
        setReports(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch my visibility reports');
      }
      setLoading(false);
    };

  // Get unique outlets and countries for filters
  const outlets = [...new Set(reports.map(report => report.outletName || report.outlet).filter(Boolean))];
  const countries = [...new Set(reports.map(report => report.country).filter(Boolean))];

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    const outletName = report.outletName || report.outlet;
    const matchesSearch = searchQuery === '' || 
      outletName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.comment.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesOutlet = selectedOutlet === '' || outletName === selectedOutlet;
    const matchesCountry = selectedCountry === '' || report.country === selectedCountry;
    
    // Date range filtering
    let matchesDateRange = true;
    if (startDate || endDate) {
      const reportDate = new Date(report.createdAt);
      const reportDateOnly = reportDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      if (startDate && endDate) {
        matchesDateRange = reportDateOnly >= startDate && reportDateOnly <= endDate;
      } else if (startDate) {
        matchesDateRange = reportDateOnly >= startDate;
      } else if (endDate) {
        matchesDateRange = reportDateOnly <= endDate;
      }
    }
    
    return matchesSearch && matchesOutlet && matchesCountry && matchesDateRange;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['Outlet', 'Company', 'Country', 'Sales Rep', 'Comment', 'Created At'];
    const csvData = filteredReports.map(report => [
      report.outletName || report.outlet || '',
      report.companyName || '',
      report.country || '',
      report.salesRep || '',
      report.comment,
      formatDate(report.createdAt)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-visibility-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedOutlet('');
    setSelectedCountry('');
    setStartDate(today);
    setEndDate(today);
  };

  const hasActiveFilters = searchQuery || selectedOutlet || selectedCountry || startDate !== today || endDate !== today;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Visibility Reports</h1>
                <p className="text-sm text-gray-600">Track and manage your product visibility reports</p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/feedback-reports')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback Reports
        </button>
        <button
          onClick={() => navigate('/availability-reports')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Availability Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Outlets</p>
                <p className="text-2xl font-bold text-gray-900">{outlets.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Countries</p>
                <p className="text-2xl font-bold text-gray-900">{countries.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(report => {
                    const reportDate = new Date(report.createdAt);
                    const reportDateOnly = reportDate.toISOString().split('T')[0];
                    return reportDateOnly === today;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col gap-4 flex-1">
              {/* First Row: Search and Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search outlets or comments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Outlet Filter */}
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Outlets</option>
                  {outlets.map(outlet => (
                    <option key={outlet} value={outlet}>{outlet}</option>
                  ))}
                </select>

                {/* Country Filter */}
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Second Row: Date Range */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Date Range:</span>
                </div>
                
                {/* Start Date */}
                <div className="flex-1 max-w-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Start Date"
                  />
                </div>

                {/* End Date */}
                <div className="flex-1 max-w-xs">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="End Date"
                  />
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset to Today
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchReports}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredReports.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
        </button>
      </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-600">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchQuery}"
                  </span>
                )}
                {selectedOutlet && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Outlet: {selectedOutlet}
                  </span>
                )}
                {selectedCountry && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Country: {selectedCountry}
                  </span>
                )}
                {startDate && endDate && startDate === endDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Date: {startDate}
                  </span>
                )}
                {startDate && endDate && startDate !== endDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Date: {startDate} to {endDate}
                  </span>
                )}
                {(startDate && !endDate) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    From: {startDate}
                  </span>
                )}
                {(!startDate && endDate) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Until: {endDate}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reports Table */}
      {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading visibility reports...</p>
            </div>
          </div>
      ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading reports</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Eye className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No visibility reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters 
                ? 'Try adjusting your search or filters.' 
                : `No visibility reports found for today (${today}).`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Rep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                  </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-150">
                      {/* Image Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {report.imageUrl ? (
                            <div className="relative">
                              <img
                                src={report.imageUrl}
                                alt="Visibility Report"
                                className="h-16 w-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(report.imageUrl)}
                              />
                              <div className="absolute -top-1 -right-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Eye className="h-3 w-3 mr-1" />
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <Image className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Outlet Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.outletName || report.outlet || 'Unknown Outlet'}
                        </div>
                        {report.companyName && (
                          <div className="text-xs text-gray-500 mt-1">
                            {report.companyName}
                          </div>
                        )}
                      </td>

                      {/* Country Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.country ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{report.country}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>

                      {/* Sales Rep Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.salesRep ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{report.salesRep}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>

                      {/* Comment Column */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="flex items-start">
                            <MessageSquare className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {report.comment || 'No comment provided'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Created At Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatDate(report.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleImageClick(report.imageUrl)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900 transition-colors duration-150"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Image
                        </button>
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {filteredReports.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredReports.length} of {reports.length} visibility reports
                {hasActiveFilters && (
                  <span className="text-gray-400"> (filtered)</span>
                )}
                {!hasActiveFilters && (
                  <span className="text-gray-400"> for today</span>
                )}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>• Click on images to view full size</span>
                <span>• Use filters to narrow down results</span>
              </div>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MyVisibilityPage; 