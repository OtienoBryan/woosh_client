import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { API_CONFIG } from '../config/api';
import {
  TrendingUpIcon, 
  UsersIcon, 
  ShoppingCartIcon, 
  DollarSignIcon,
  BarChart3Icon,
  PieChartIcon,
  TargetIcon,
  AwardIcon,
  CalendarIcon,
  MapPinIcon,
  FileTextIcon,
  EyeIcon,
  PackageIcon,
  NotebookIcon
} from 'lucide-react';

const COLORS = [
  '#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a21caf', '#f59e42', 
  '#0ea5e9', '#f43f5e', '#16a34a', '#facc15', '#6366f1', '#f87171'
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
}

// Memoized StatCard component for better performance
const StatCard: React.FC<StatCardProps> = memo(({
  title,
  value,
  icon,
  prefix = '',
  suffix = '',
  bgColor = 'bg-gradient-to-r from-blue-600 to-blue-700',
  textColor = 'text-white',
  onClick
}) => {
  return (
    <div
      className={`${bgColor} overflow-hidden shadow-md rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-[10px] font-medium ${textColor} opacity-90`}>
              {title}
            </p>
            <p className={`text-base font-bold ${textColor} mt-0.5`}>
              {prefix}{value}{suffix}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className={`p-1 rounded-lg ${textColor} bg-white bg-opacity-20`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Skeleton components for loading states
const SkeletonCard = memo(() => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
  </div>
));

const SkeletonChart = memo(() => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';
SkeletonChart.displayName = 'SkeletonChart';

const SalesDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  
  // Core data from optimized endpoint
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeReps: 0,
    avgPerformance: 0
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; amount: number }[]>([]);
  const [topReps, setTopReps] = useState<{ name: string; overall: number }[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Secondary data (lazy loaded)
  const [productPerf, setProductPerf] = useState<any[]>([]);
  
  const navigate = useNavigate();

  // Optimized fetch function
  const fetchData = useCallback(async (endpoint: string, params?: any) => {
    const url = new URL(API_CONFIG.getUrl(endpoint), window.location.origin);
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }, []);

  // Fetch core dashboard data (optimized single endpoint)
  const fetchCoreData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[SalesDashboard] Fetching core data...');
      const startTime = performance.now();
      
      const result = await fetchData('/dashboard/sales-dashboard-data');
      
      const endTime = performance.now();
      console.log(`[SalesDashboard] Core data loaded in ${(endTime - startTime).toFixed(0)}ms`);

      if (result.success && result.data) {
        const data = result.data;
        setStats(data.stats);
        setMonthlyData(data.monthlyData || []);
        setTopReps(data.topReps || []);
        setManagers(data.managers || []);
        setPendingLeavesCount(data.pendingLeavesCount || 0);
        setNewOrdersCount(data.newOrdersCount || 0);
      }
    } catch (err: any) {
      console.error('[SalesDashboard] Error fetching core data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // Fetch secondary data (charts) - lazy loaded after core data
  const fetchChartsData = useCallback(async () => {
    try {
      console.log('[SalesDashboard] Fetching charts data...');
      const startTime = performance.now();

      // Fetch product performance and pie chart data in parallel
      const [vapesResult, pouchesResult, pieResult] = await Promise.all([
        fetchData('/dashboard/product-performance', { productType: 'vape' }),
        fetchData('/dashboard/product-performance', { productType: 'pouch' }),
        fetchData('/dashboard/current-month-pie')
      ]);

      const endTime = performance.now();
      console.log(`[SalesDashboard] Charts data loaded in ${(endTime - startTime).toFixed(0)}ms`);

      // Process product performance
      if (vapesResult.success && pouchesResult.success) {
        const vapes = vapesResult.data || [];
        const pouches = pouchesResult.data || [];
        
        const allNames = Array.from(new Set([
          ...vapes.map((p: any) => p.product_name),
          ...pouches.map((p: any) => p.product_name)
        ]));
        
        const merged = allNames.map((name: string) => {
          const v = vapes.find((p: any) => p.product_name === name) || {};
          const p = pouches.find((p: any) => p.product_name === name) || {};
          return {
            product_name: name,
            vapes_sales_value: Number(v.total_sales_value) || 0,
            vapes_quantity: Number(v.total_quantity_sold) || 0,
            pouches_sales_value: Number(p.total_sales_value) || 0,
            pouches_quantity: Number(p.total_quantity_sold) || 0,
          };
        });
        
        setProductPerf(merged);
      }

      // Process pie chart data (for future use)
      // if (pieResult.success) {
      //   // setPieChartData(pieResult.data || []);
      // }
      console.log('[SalesDashboard] Pie chart data available:', pieResult.success);

    } catch (err: any) {
      console.error('[SalesDashboard] Error fetching charts data:', err);
    } finally {
      setChartsLoading(false);
    }
  }, [fetchData]);

  // Load core data first, then charts
  useEffect(() => {
    fetchCoreData();
  }, [fetchCoreData]);

  // Load charts data after core data is loaded
  useEffect(() => {
    if (!loading) {
      // Delay chart loading slightly to prioritize rendering core UI
      const timeout = setTimeout(() => {
        fetchChartsData();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [loading, fetchChartsData]);

  // Refresh all data
  const handleRefresh = useCallback(() => {
    setChartsLoading(true);
    fetchCoreData();
  }, [fetchCoreData]);

  // Memoized navigation items
  const navigationItems = useMemo(() => [
    { to: '/dashboard/route-compliance', label: 'Sales Rep', icon: <MapPinIcon className="h-3.5 w-3.5" />, color: 'bg-lime-100 text-lime-700 hover:bg-lime-200' },
    { to: '/sales-rep-leaves', label: 'Sales Rep Leaves', icon: <CalendarIcon className="h-3.5 w-3.5" />, color: 'bg-green-100 text-green-700 hover:bg-green-200', badge: pendingLeavesCount },
    { to: '/products', label: 'Products', icon: <ShoppingCartIcon className="h-3.5 w-3.5" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
    { to: '/clients-list', label: 'Clients', icon: <UsersIcon className="h-3.5 w-3.5" />, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
    { to: '/routes', label: 'Routes', icon: <MapPinIcon className="h-3.5 w-3.5" />, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { to: '/notices', label: 'Notices', icon: <FileTextIcon className="h-3.5 w-3.5" />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { to: '/tasks', label: 'Tasks', icon: <TargetIcon className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { to: '/financial/customer-orders', label: 'Sales Report', icon: <BarChart3Icon className="h-3.5 w-3.5" />, color: 'bg-red-100 text-red-700 hover:bg-red-200', badge: newOrdersCount },
    { to: '/invoice-list', label: 'Invoices', icon: <AwardIcon className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/dashboard/reports/product-performance', label: 'Product Performance', icon: <PieChartIcon className="h-3.5 w-3.5" />, color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
    { to: '/master-sales', label: 'Master Sales Report', icon: <AwardIcon className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/sales-rep-performance', label: 'Sales Rep Performance', icon: <TrendingUpIcon className="h-3.5 w-3.5" />, color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
    { to: '/overall-attendance', label: 'Sales Rep Report', icon: <BarChart3Icon className="h-3.5 w-3.5" />, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
    { to: '/my-visibility', label: 'Visit Reports', icon: <EyeIcon className="h-3.5 w-3.5" />, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
    { to: '/dashboard/journey-plans', label: 'Route Plans', icon: <MapPinIcon className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { to: '/credit-note-summary', label: 'Credit Notes', icon: <FileTextIcon className="h-3.5 w-3.5" />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { to: '/uplift-sales', label: 'Uplift Sales', icon: <TrendingUpIcon className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/financial/create-customer-order', label: 'Add Order', icon: <PackageIcon className="h-3.5 w-3.5" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200', badge: newOrdersCount },
    { to: '/sales-reps', label: 'Sales Reps List', icon: <UsersIcon className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { to: '/instant-chat', label: 'Chat Room', icon: <NotebookIcon className="h-3.5 w-3.5" />, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' }
  ], [pendingLeavesCount, newOrdersCount]);

  // Calculate manager performance (memoized)
  const managersWithPerformance = useMemo(() => {
    return managers.map(m => ({
      name: m.name,
      value: Math.random() * 100 // Placeholder - would need actual calculation
    }));
  }, [managers]);

  // Loading state with skeleton screens
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="mb-1">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse mb-2"></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {Array.from({ length: 19 }).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="h-4 w-4 bg-gray-300 rounded mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SkeletonChart />
            <SkeletonChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-1">
          <h1 className="text-xl font-bold text-gray-900">Sales Dashboard</h1>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleRefresh}
              className="flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <TrendingUpIcon className="h-3.5 w-3.5 mr-1.5" />
              Refresh Data
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className={`${item.color} flex flex-col items-center justify-center p-2 rounded-lg font-medium text-[10px] transition-all duration-200 hover:scale-105 hover:shadow-md relative`}
              >
                {item.icon}
                <span className="mt-0.5 text-center leading-tight">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard
            title="Total Sales"
            value={stats.totalSales.toLocaleString()}
            prefix=""
            icon={<DollarSignIcon className="h-4 w-4" />}
            bgColor="bg-gradient-to-r from-green-600 to-green-700"
            onClick={() => navigate('/dashboard/reports/sales-report')}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCartIcon className="h-4 w-4" />}
            bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
            onClick={() => navigate('/dashboard/reports/sales-report')}
          />
          <StatCard
            title="Active Sales Reps"
            value={stats.activeReps}
            icon={<UsersIcon className="h-4 w-4" />}
            bgColor="bg-gradient-to-r from-purple-600 to-purple-700"
            onClick={() => navigate('/sales-reps')}
          />
          <StatCard
            title="Avg Performance"
            value={stats.avgPerformance}
            suffix="%"
            icon={<TrendingUpIcon className="h-4 w-4" />}
            bgColor="bg-gradient-to-r from-orange-600 to-orange-700"
            onClick={() => navigate('/shared-performance')}
          />
        </div>
     
        {/* Charts Section - Lazy Loaded */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Monthly Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Monthly Sales Trend</h2>
              <button
                onClick={() => navigate('/dashboard/reports/sales-report')}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                View Details →
              </button>
            </div>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-center text-sm h-64 flex items-center justify-center">
                No monthly data available
              </div>
            )}
          </div>

          {/* Product Performance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Product Performance</h2>
              <button
                onClick={() => navigate('/dashboard/reports/product-performance')}
                className="text-green-600 hover:text-green-800 text-xs font-medium"
              >
                View Details →
              </button>
            </div>
            {chartsLoading ? (
              <SkeletonChart />
            ) : productPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productPerf} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="product_name" angle={-30} textAnchor="end" interval={0} height={80} stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="vapes_sales_value" fill="#3b82f6" name="Vapes Sales" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pouches_sales_value" fill="#10b981" name="Pouches Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-center text-sm h-64 flex items-center justify-center">
                Loading product data...
              </div>
            )}
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Managers Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Managers Performance</h2>
              <button
                onClick={() => navigate('/managers-performance')}
                className="text-purple-600 hover:text-purple-800 text-xs font-medium"
              >
                View Details →
              </button>
            </div>
            {chartsLoading ? (
              <SkeletonChart />
            ) : managersWithPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={managersWithPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {managersWithPerformance.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Performance']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-center text-sm h-64 flex items-center justify-center">
                No managers data available
              </div>
            )}
          </div>

          {/* Top Sales Reps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Top 10 Sales Reps</h2>
              <button
                onClick={() => navigate('/shared-performance')}
                className="text-orange-600 hover:text-orange-800 text-xs font-medium"
              >
                View Details →
              </button>
            </div>
            {topReps.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topReps} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" type="category" interval={0} angle={-30} textAnchor="end" height={100} stroke="#6b7280" />
                  <YAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Overall Performance']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="overall" fill="#f59e0b" name="Overall %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-center text-sm h-64 flex items-center justify-center">
                No sales reps data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboardPage;
