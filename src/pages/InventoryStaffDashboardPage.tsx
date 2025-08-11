import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { productsService, categoriesService } from '../services/financialService';
import { creditNoteService } from '../services/creditNoteService';
import { StockSummaryData } from '../services/storeService';
import { StoreInventory, StoreInventorySummary } from '../types/financial';
import { CreditNote } from '../services/creditNoteService';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';

interface InventoryStats {
  totalProducts: number;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    product_name: string;
    quantity_sold: number;
    sales_value: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InventoryStaffDashboardPage: React.FC = () => {
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingProducts: []
  });
  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([]);
  const [storeSummary, setStoreSummary] = useState<StoreInventorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | 'all'>('all');
  const [stores, setStores] = useState<{ id: number; store_name: string; store_code: string }[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [stockSummaryData, setStockSummaryData] = useState<StockSummaryData | null>(null);
  const [stockSummaryCategoryFilter, setStockSummaryCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [creditNoteStats, setCreditNoteStats] = useState({
    totalCreditNotes: 0,
    pendingReceiving: 0,
    received: 0
  });
  const [approvedOrdersCount, setApprovedOrdersCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedStore !== 'all') {
      fetchStoreSpecificData(selectedStore);
    }
  }, [selectedStore]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        inventoryResponse,
        salesResponse,
        storesResponse,
        storeSummaryResponse,
        monthlySalesResponse,
        categoryResponse,
        stockSummaryResponse,
        categoriesResponse,
        creditNotesResponse
      ] = await Promise.all([
        storeService.getAllStoresInventory(),
        axios.get('/api/financial/sales-orders'),
        storeService.getAllStores(),
        storeService.getInventorySummaryByStore(),
        axios.get('/api/financial/sales-orders'),
        axios.get('/api/financial/products'),
        storeService.getStockSummary(),
        categoriesService.getAll(),
        creditNoteService.getAll()
      ]);

      // Process inventory data
      if (inventoryResponse.success) {
        const inventory = inventoryResponse.data || [];
        setStoreInventory(inventory);
        
        // Calculate inventory stats
        const totalProducts = new Set(inventory.map(item => item.product_id)).size;
        const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalValue = inventory.reduce((sum, item) => sum + (item.inventory_value || 0), 0);
        const lowStockItems = inventory.filter(item => (item.quantity || 0) <= 10).length;
        const outOfStockItems = inventory.filter(item => (item.quantity || 0) === 0).length;
        
        setInventoryStats({
          totalProducts,
          totalItems,
          totalValue,
          lowStockItems,
          outOfStockItems
        });

        // Process category distribution
        const categoryMap = new Map();
        inventory.forEach(item => {
          const category = item.category || 'Uncategorized';
          const current = categoryMap.get(category) || 0;
          categoryMap.set(category, current + (item.quantity || 0));
        });
        
        const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
        setCategoryDistribution(categoryData);
      }

      // Process sales data
      if (salesResponse.data.success) {
        const orders = salesResponse.data.data || [];
        const totalSales = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        // Calculate approved orders count (my_status = 1)
        const approvedOrders = orders.filter((order: any) => order.my_status === 1).length;
        setApprovedOrdersCount(approvedOrders);
        
        // Get top selling products (simplified - in real app you'd get this from sales_order_items)
        const topSellingProducts = await fetchTopSellingProducts();
        
        setSalesSummary({
          totalSales,
          totalOrders,
          averageOrderValue,
          topSellingProducts
        });

        // Process monthly sales data
        const monthMap = new Map();
        orders.forEach((order: any) => {
          if (order.order_date && order.total_amount) {
            const date = new Date(order.order_date);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const current = monthMap.get(key) || 0;
            monthMap.set(key, current + (order.total_amount || 0));
          }
        });

        const monthlyData = Array.from(monthMap.entries())
          .map(([key, value]) => {
            const [year, month] = key.split('-');
            return {
              month: `${getMonthName(parseInt(month))} ${year}`,
              sales: value
            };
          })
          .sort((a, b) => {
            const [aMonth, aYear] = a.month.split(' ');
            const [bMonth, bYear] = b.month.split(' ');
            if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
            return getMonthIndex(aMonth) - getMonthIndex(bMonth);
          });

        setMonthlySalesData(monthlyData);
      }

      // Process stores data
      if (storesResponse.success) {
        setStores(storesResponse.data || []);
      }

      if (storeSummaryResponse.success) {
        setStoreSummary(storeSummaryResponse.data || []);
      }

      if (stockSummaryResponse.success) {
        setStockSummaryData(stockSummaryResponse.data || null);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }

      // Process credit notes data
      if (creditNotesResponse.success) {
        const creditNotes = creditNotesResponse.data || [];
        setCreditNotes(creditNotes);
        
        const totalCreditNotes = creditNotes.length;
        const pendingReceiving = creditNotes.filter(note => note.my_status !== 1).length;
        const received = creditNotes.filter(note => note.my_status === 1).length;
        
        setCreditNoteStats({
          totalCreditNotes,
          pendingReceiving,
          received
        });
      }

    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopSellingProducts = async () => {
    try {
      const response = await axios.get('/api/financial/reports/product-performance');
      if (response.data.success) {
        return response.data.data.slice(0, 5).map((item: any) => ({
          product_name: item.product_name,
          quantity_sold: item.total_quantity_sold || 0,
          sales_value: item.total_sales_value || 0
        }));
      }
    } catch (err) {
      console.error('Failed to fetch top selling products:', err);
    }
    return [];
  };

  const fetchStoreSpecificData = async (storeId: number) => {
    try {
      const response = await storeService.getStoreInventory(storeId);
      if (response.success) {
        // Update inventory stats for specific store
        const inventory = response.data || [];
        const totalProducts = inventory.length;
        const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalValue = inventory.reduce((sum, item) => sum + (item.inventory_value || 0), 0);
        const lowStockItems = inventory.filter(item => (item.quantity || 0) <= 10).length;
        const outOfStockItems = inventory.filter(item => (item.quantity || 0) === 0).length;
        
        setInventoryStats({
          totalProducts,
          totalItems,
          totalValue,
          lowStockItems,
          outOfStockItems
        });
      }
    } catch (err) {
      console.error('Failed to fetch store specific data:', err);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1] || '';
  };

  const getMonthIndex = (monthName: string) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months.indexOf(monthName);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getFilteredInventory = () => {
    if (selectedStore === 'all') {
      return storeInventory;
    }
    return storeInventory.filter(item => item.store_id === selectedStore);
  };

  const getFilteredStockSummary = () => {
    if (!stockSummaryData || !stockSummaryData.products) {
      return [];
    }
    
    let filteredProducts = stockSummaryData.products;
    
    if (stockSummaryCategoryFilter !== 'all') {
      filteredProducts = stockSummaryData.products.filter((product: any) => 
        product.category === stockSummaryCategoryFilter
      );
    }
    
    // Sort products by category alphabetically
    return filteredProducts.sort((a: any, b: any) => {
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      return categoryA.localeCompare(categoryB);
    });
  };

  const getStoreName = (storeId: number) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.store_name : 'Unknown Store';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-red-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
                <div className="mt-1 text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredInventory = getFilteredInventory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Dashboard</h1>
              
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/financial/post-receipt"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Post Receipt
              </Link>
              
              <Link
                to="/inventory-transactions"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Inventory
              </Link>
              
              <Link
                to="/stock-take"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Stock Take
              </Link>
              <Link
                to="/financial/suppliers"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Vendors
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <Link
                to="/financial/customer-orders"
                 >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Orders</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(approvedOrdersCount)}</p>
              </div>
            </div>
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(inventoryStats.totalItems)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(inventoryStats.lowStockItems)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(inventoryStats.outOfStockItems)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <Link
                to="/credit-note-summary"
                 >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credit Notes Summary</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(creditNoteStats.pendingReceiving)}</p>
              </div>
            </div>
            </Link>
          </div>
        </div>
 

        {/* Stock Summary Table */}
        {selectedStore === 'all' && stockSummaryData && stockSummaryData.products.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Stock Summary Across All Stores</h2>
                    
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex-shrink-0">
                    <label htmlFor="stock-summary-category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Category
                    </label>
                    <select
                      id="stock-summary-category-filter"
                      value={stockSummaryCategoryFilter}
                      onChange={(e) => setStockSummaryCategoryFilter(e.target.value)}
                      className="block w-64 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Filter Indicators */}
              {stockSummaryCategoryFilter !== 'all' && (
                <div className="px-6 py-3 bg-purple-50 border-b border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                      Category: {stockSummaryCategoryFilter}
                    </span>
                  </div>
                </div>
              )}

              {/* Table Content */}
              {getFilteredStockSummary().length === 0 ? (
                <div className="text-center py-16">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                  <p className="mt-2 text-gray-500">
                    {stockSummaryCategoryFilter === 'all' 
                      ? 'No products found in the stock summary.' 
                      : `No products found for category "${stockSummaryCategoryFilter}".`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                          Product
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total Stock
                        </th>
                        {stockSummaryData.stores.map((store: any) => (
                          <th key={store.id} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {store.store_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredStockSummary().map((product: any) => {
                        const totalStock = stockSummaryData.stores.reduce((total: number, store: any) => {
                          return total + (product.store_quantities[store.id] || 0);
                        }, 0);
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                              {product.product_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.product_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {product.category || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatNumber(totalStock)}
                            </td>
                            {stockSummaryData.stores.map((store: any) => {
                              const quantity = product.store_quantities[store.id] || 0;
                              return (
                                <td key={store.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    quantity <= 10 
                                      ? 'bg-red-100 text-red-800' 
                                      : quantity <= 50 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {formatNumber(quantity)}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
         
      </div>
    </div>
  );
};

export default InventoryStaffDashboardPage; 