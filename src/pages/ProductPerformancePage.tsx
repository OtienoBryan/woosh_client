import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3, 
  Filter, 
  Download, 
  Calendar, 
  MapPin, 
  Tag,
  Search,
  X,
  RefreshCw,
  Award,
  Target,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';

interface ProductPerformance {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  total_quantity_sold: number;
  total_sales_value: number;
}

// Modern Statistics Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    green: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          {icon}
        </div>
      </div>
    </div>
  );
};


const ProductPerformancePage: React.FC = () => {
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    return `${year}-${month.toString().padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of current month
    return `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
  });
  const [productType, setProductType] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [region, setRegion] = useState<string>('');
  const [salesRep, setSalesRep] = useState<string>('');
  const [salesReps, setSalesReps] = useState<{id: number, name: string}[]>([]);
  const [client, setClient] = useState<string>('');
  const [clients, setClients] = useState<{id: number, name: string}[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [sku, setSku] = useState<string>('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof ProductPerformance>('total_sales_value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [tempProductType, setTempProductType] = useState<string>('');
  const [tempCountry, setTempCountry] = useState<string>('');
  const [tempRegion, setTempRegion] = useState<string>('');
  const [tempSalesRep, setTempSalesRep] = useState<string>('');
  const [tempClient, setTempClient] = useState<string>('');
  const [tempClientSearchQuery, setTempClientSearchQuery] = useState('');
  const [tempSku, setTempSku] = useState<string>('');

  const fetchData = async (start?: string, end?: string, type?: string, countryName?: string, regionName?: string, salesRepId?: string, clientId?: string, skuId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/financial/reports/product-performance';
      const params: Record<string, string> = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      if (type) params.productType = type;
      if (countryName) params.country = countryName;
      if (regionName) params.region = regionName;
      if (salesRepId) params.salesRep = salesRepId;
      if (clientId) params.client = clientId;
      if (skuId) params.sku = skuId;
      const query = new URLSearchParams(params).toString();
      if (query) url += `?${query}`;
      const response = await api.get(url);
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        setError('Failed to fetch product performance data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(startDate, endDate, productType, country, region, salesRep, client, sku);
  }, [startDate, endDate, productType, country, region, salesRep, client, sku]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isClientDropdownOpen && !target.closest('.client-dropdown-container')) {
        setIsClientDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClientDropdownOpen]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await api.get('/countries');
        if (res.data.success) {
          setCountries(res.data.data.map((row: { name: string }) => row.name));
        }
      } catch {}
    };
    const fetchRegions = async () => {
      try {
        const res = await api.get('/regions');
        if (res.data.success) {
          setRegions(res.data.data.map((row: { name: string }) => row.name));
        }
      } catch {}
    };
    const fetchSalesReps = async () => {
      try {
        const res = await api.get('/financial/sales-reps');
        if (res.data.success) {
          setSalesReps(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching sales reps:', error);
      }
    };
    const fetchClients = async () => {
      try {
        console.log('Fetching clients...');
        const res = await api.get('/clients?limit=10000'); // Get all clients
        console.log('Clients response:', res.data);
        console.log('Response status:', res.status);
        
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          const clientsData = res.data.data
            .filter((client: {id: number, name: string}) => client && client.id && client.name) // Filter out null/undefined clients
            .map((client: {id: number, name: string}) => ({
              id: client.id,
              name: client.name
            }));
          console.log('Mapped clients:', clientsData);
          setClients(clientsData);
        } else {
          console.error('Invalid response format:', res.data);
          console.error('Expected: { data: [...] }, Got:', typeof res.data, res.data);
        }
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await api.get('/financial/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error: any) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCountries();
    fetchRegions();
    fetchSalesReps();
    fetchClients();
    fetchCategories();
  }, []);



  // Filtered clients for modal based on temp search
  const filteredClientsForModal = useMemo(() => {
    if (!tempClientSearchQuery.trim()) {
      return clients;
    }
    return clients.filter(client =>
      client && client.name && client.name.toLowerCase().includes(tempClientSearchQuery.toLowerCase())
    );
  }, [clients, tempClientSearchQuery]);

  // Filtered and sorted products
  const processedProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort products
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [products, searchQuery, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const totalQuantity = processedProducts.reduce((sum, p) => sum + (Number(p.total_quantity_sold) || 0), 0);
    const totalSalesValue = processedProducts.reduce((sum, p) => sum + (Number(p.total_sales_value) || 0), 0);
    const avgSalesValue = processedProducts.length > 0 ? totalSalesValue / processedProducts.length : 0;
    const topPerformer = processedProducts.length > 0 ? processedProducts[0] : null;

    return {
      totalProducts: processedProducts.length,
      totalQuantity,
      totalSalesValue,
      avgSalesValue,
      topPerformer
    };
  }, [processedProducts]);

  const handleSort = (field: keyof ProductPerformance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Category', 'Quantity Sold', 'Sales Value'];
    const csvContent = [
      headers.join(','),
      ...processedProducts.map(p => [
        `"${p.product_name}"`,
        `"${p.category_name || 'N/A'}"`,
        p.total_quantity_sold,
        p.total_sales_value
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    // Reset to default date values (current month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    setStartDate(firstDay);
    setEndDate(lastDayStr);
    setProductType('');
    setCountry('');
    setRegion('');
    setSalesRep('');
    setClient('');
    setIsClientDropdownOpen(false);
    setSku('');
    setSearchQuery('');
  };


  // Handle modal opening
  const handleModalOpen = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempProductType(productType);
    setTempCountry(country);
    setTempRegion(region);
    setTempSalesRep(salesRep);
    setTempClient(client);
    // Set the client search query to the selected client's name if a client is selected
    if (client && clients.length > 0) {
      const selectedClient = clients.find(c => c.id.toString() === client);
      setTempClientSearchQuery(selectedClient ? selectedClient.name : '');
    } else {
      setTempClientSearchQuery('');
    }
    setTempSku(sku);
    setModalOpen(true);
  };

  // Handle modal closing
  const handleModalClose = () => {
    setModalOpen(false);
  };

  // Handle applying filters from modal
  const handleApplyFilters = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setProductType(tempProductType);
    setCountry(tempCountry);
    setRegion(tempRegion);
    setSalesRep(tempSalesRep);
    setClient(tempClient);
    setSku(tempSku);
    setIsClientDropdownOpen(false);
    setModalOpen(false);
  };

  // Handle clearing all filters from modal
  const handleClearFilters = () => {
    // Reset to default date values (current month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    setStartDate(firstDay);
    setEndDate(lastDayStr);
    setProductType('');
    setCountry('');
    setRegion('');
    setSalesRep('');
    setClient('');
    setIsClientDropdownOpen(false);
    setSku('');
    setSearchQuery('');
    setModalOpen(false);
  };

  // Check if there are any active filters (excluding default date values)
  const getDefaultDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    return { firstDay, lastDayStr };
  };

  const { firstDay: defaultStartDate, lastDayStr: defaultEndDate } = getDefaultDateRange();
  const hasActiveFilters = 
    (startDate !== defaultStartDate) || 
    (endDate !== defaultEndDate) || 
    productType || 
    country || 
    region || 
    salesRep || 
    client || 
    sku || 
    searchQuery;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading product performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <button
            onClick={() => fetchData(startDate, endDate, productType, country, region)}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Performance</h1>
              <p className="text-gray-600 mt-2">Analyze product sales performance and identify top performers</p>
        </div>
            <div className="flex items-center gap-3">
          <button
                onClick={exportToCSV}
                disabled={processedProducts.length === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
                <Download className="w-4 h-4" />
                Export CSV
          </button>
          <Link
            to="/dashboard/reports/product-performance-graph"
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
          >
                <BarChart3 className="w-4 h-4" />
            View Graph
          </Link>
        </div>
      </div>
        </div>


        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Package className="w-6 h-6" />}
            color="blue"
            subtitle={`${products.length} total in database`}
          />
          <StatsCard
            title="Total Quantity Sold"
            value={stats.totalQuantity.toLocaleString()}
            icon={<Target className="w-6 h-6" />}
            color="green"
            subtitle="Units sold"
          />
          <StatsCard
            title="Total Sales Value"
            value={stats.totalSalesValue.toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
            icon={<DollarSign className="w-6 h-6" />}
            color="purple"
            subtitle="Revenue generated"
          />
          <StatsCard
            title="Average Sales Value"
            value={stats.avgSalesValue.toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
            subtitle="Per product"
          />
        </div>

        {/* Filter Button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleModalOpen}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                  {[
                    startDate !== defaultStartDate ? 'startDate' : null,
                    endDate !== defaultEndDate ? 'endDate' : null,
                    productType,
                    country,
                    region,
                    salesRep,
                    client,
                    sku
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Filter Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={handleModalClose}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-4">Filter Product Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={e => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={e => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Product Type
                  </label>
                  <select
                    value={tempProductType}
                    onChange={e => setTempProductType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Types</option>
                    <option value="vape">Vapes</option>
                    <option value="pouch">Pouches</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Country
                  </label>
                  <select
                    value={tempCountry}
                    onChange={e => setTempCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Countries</option>
                    {countries.map((c: string) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Region
                  </label>
                  <select
                    value={tempRegion}
                    onChange={e => setTempRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Regions</option>
                    {regions.map((r: string) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Sales Rep
                  </label>
                  <select
                    value={tempSalesRep}
                    onChange={e => setTempSalesRep(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Sales Reps</option>
                    {salesReps.map((rep) => (
                      <option key={rep.id} value={rep.id.toString()}>{rep.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Client
                  </label>
                  <div className="relative client-dropdown-container">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={tempClientSearchQuery}
                      onChange={e => {
                        setTempClientSearchQuery(e.target.value);
                        if (e.target.value === '') {
                          setTempClient('');
                        }
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 pr-8"
                    />
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                    
                    {/* Dropdown List */}
                    {isClientDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div
                          className="px-3 py-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setTempClient('');
                            setTempClientSearchQuery('');
                            setIsClientDropdownOpen(false);
                          }}
                        >
                          All Clients
                        </div>
                        {filteredClientsForModal.map((clientItem) => (
                          <div
                            key={clientItem.id}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              setTempClient(clientItem.id.toString());
                              setTempClientSearchQuery(clientItem.name);
                              setIsClientDropdownOpen(false);
                            }}
                          >
                            {clientItem.name}
                          </div>
                        ))}
                        {filteredClientsForModal.length === 0 && tempClientSearchQuery && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No clients found matching "{tempClientSearchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="w-4 h-4 inline mr-1" />
                    SKU (Category)
                  </label>
                  <select
                    value={tempSku}
                    onChange={e => setTempSku(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All SKUs</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                  onClick={handleClearFilters}
                >
                  Clear All
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        {processedProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 text-gray-400 mx-auto mb-4">
              <Package className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || hasActiveFilters ? 'Try adjusting your search or filters' : 'No product performance data available'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('product_name')}
                    >
                      <div className="flex items-center gap-2">
                      Product Name
                        {sortField === 'product_name' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th 
                      className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('total_quantity_sold')}
                    >
                      <div className="flex items-center justify-end gap-2">
                      Quantity Sold
                        {sortField === 'total_quantity_sold' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('total_sales_value')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Sales Value (KES)
                        {sortField === 'total_sales_value' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedProducts.map((product, index) => {
                    const isTopPerformer = index === 0 && sortField === 'total_sales_value' && sortDirection === 'desc';
                    
                    return (
                      <tr key={product.product_id} className={`hover:bg-gray-50 transition-colors duration-200 ${isTopPerformer ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {isTopPerformer && <Award className="w-4 h-4 text-yellow-500 mr-2" />}
                            <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                          </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {product.category_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                        {product.total_quantity_sold.toLocaleString()}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                          {product.total_sales_value.toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-6 py-4 text-left text-blue-900">
                      Total ({processedProducts.length} products)
                    </td>
                    <td className="px-6 py-4 text-left text-blue-900">
                      -
                    </td>
                    <td className="px-6 py-4 text-right text-blue-900">
                      {stats.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-blue-900">
                      {stats.totalSalesValue.toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductPerformancePage; 