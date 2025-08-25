import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { salesOrdersService } from '../services/financialService';
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
  SettingsIcon,
  EyeIcon,
  UserCheckIcon,
  PackageIcon,
  NotebookIcon
} from 'lucide-react';

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const COLORS = [
  '#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a21caf', '#f59e42', 
  '#0ea5e9', '#f43f5e', '#16a34a', '#facc15', '#6366f1', '#f87171'
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    positive: boolean;
  };
  prefix?: string;
  suffix?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  prefix = '',
  suffix = '',
  bgColor = 'bg-gradient-to-r from-blue-600 to-blue-700',
  textColor = 'text-white',
  onClick
}) => {
  return (
    <div
      className={`${bgColor} overflow-hidden shadow-lg rounded-xl cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor} opacity-90`}>
              {title}
            </p>
            <p className={`text-2xl font-bold ${textColor} mt-1`}>
              {prefix}{value}{suffix}
            </p>
            {change && (
              <div className="flex items-center mt-2">
                <TrendingUpIcon 
                  className={`h-4 w-4 ${change.positive ? 'text-green-300' : 'text-red-300'}`} 
                />
                <span className={`text-sm font-medium ml-1 ${change.positive ? 'text-green-300' : 'text-red-300'}`}>
                  {change.positive ? '+' : ''}{change.value}%
                </span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${textColor} bg-white bg-opacity-20`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesDashboardPage: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState<{ month: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rechartsPieData, setRechartsPieData] = useState<{ type: string; value: number }[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [repData, setRepData] = useState<any[]>([]);
  const [mpLoading, setMpLoading] = useState(true);
  const [mpError, setMpError] = useState<string | null>(null);
  const [productPerf, setProductPerf] = useState<any[]>([]);
  const [productPerfLoading, setProductPerfLoading] = useState(true);
  const [productPerfError, setProductPerfError] = useState<string | null>(null);
  const [topReps, setTopReps] = useState<{ name: string; overall: number }[]>([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeReps: 0,
    avgPerformance: 0
  });
  
  const navigate = useNavigate();

  // Custom fetch function to avoid axios
  const fetchData = async (endpoint: string, params?: any) => {
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
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch sales performance data
        const salesRes = await fetchData('/sales/performance');
        const reps = salesRes.data || [];
        
        // Calculate top reps
        const repPerf = reps.map((rep: any) => {
          const allTypes = ['distributors', 'key_accounts', 'retail'];
          let outletPctSum = 0, vapesPctSum = 0, pouchesPctSum = 0;
          allTypes.forEach(type => {
            const perf = rep[type];
            const outletPct = perf.total_outlets > 0 ? (perf.outlets_with_orders / perf.total_outlets) * 100 : 0;
            const vapesPct = perf.vapes_target > 0 ? (perf.vapes_sales / perf.vapes_target) * 100 : 0;
            const pouchesPct = perf.pouches_target > 0 ? (perf.pouches_sales / perf.pouches_target) * 100 : 0;
            outletPctSum += outletPct;
            vapesPctSum += vapesPct;
            pouchesPctSum += pouchesPct;
          });
          const n = allTypes.length;
          const overall = ((outletPctSum + vapesPctSum + pouchesPctSum) / (n * 3));
          return { name: rep.name, overall: Number(overall.toFixed(1)) };
        });
        repPerf.sort((a: { overall: number }, b: { overall: number }) => b.overall - a.overall);
        setTopReps(repPerf.slice(0, 10));
        
        // Calculate stats
        const avgPerformance = repPerf.length > 0 ? 
          repPerf.reduce((sum: number, rep: any) => sum + rep.overall, 0) / repPerf.length : 0;
        setStats(prev => ({ ...prev, activeReps: reps.length, avgPerformance: Number(avgPerformance.toFixed(1)) }));

        // Fetch sales orders for monthly data
        const ordersRes = await salesOrdersService.getAllIncludingDrafts();
        const orders = ordersRes.data || [];
        
        // Group by month
        const monthMap: { [key: string]: number } = {};
        let totalSales = 0;
        orders.forEach((order: any) => {
          if (!order.order_date || !order.total_amount) return;
          const date = new Date(order.order_date);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          const amount = Number(order.total_amount);
          monthMap[key] = (monthMap[key] || 0) + amount;
          totalSales += amount;
        });
        
        // Convert to array and sort by date
        const data = Object.entries(monthMap)
          .map(([key, amount]) => {
            const [year, monthIdx] = key.split('-');
            return {
              month: `${monthNames[Number(monthIdx)]} ${year}`,
              amount: amount as number,
            };
          })
          .sort((a, b) => {
            const [aMonth, aYear] = a.month.split(' ');
            const [bMonth, bYear] = b.month.split(' ');
            if (aYear !== bYear) return Number(aYear) - Number(bYear);
            return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
          });
        setMonthlyData(data);
        setStats(prev => ({ ...prev, totalSales, totalOrders: orders.length }));

    // Fetch pie chart data for current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        
        const [vapesRes, pouchesRes] = await Promise.all([
          fetchData('/financial/reports/product-performance', { startDate: start, endDate: end, productType: 'vape' }),
          fetchData('/financial/reports/product-performance', { startDate: start, endDate: end, productType: 'pouch' })
        ]);
        
        const vapesTotal = vapesRes.success ? vapesRes.data.reduce((sum: number, p: any) => sum + (Number(p.total_sales_value) || 0), 0) : 0;
        const pouchesTotal = pouchesRes.success ? pouchesRes.data.reduce((sum: number, p: any) => sum + (Number(p.total_sales_value) || 0), 0) : 0;
      setRechartsPieData([
        { type: 'Vapes', value: vapesTotal },
        { type: 'Pouches', value: pouchesTotal },
      ]);

        // Fetch product performance
        const [vapesPerfRes, pouchesPerfRes] = await Promise.all([
          fetchData('/financial/reports/product-performance', { productType: 'vape' }),
          fetchData('/financial/reports/product-performance', { productType: 'pouch' })
        ]);
        
        if (vapesPerfRes.success && pouchesPerfRes.success) {
          const vapes = vapesPerfRes.data.filter((p: any) => p.category_id === 1 || p.category_id === 3);
          const pouches = pouchesPerfRes.data.filter((p: any) => p.category_id === 4 || p.category_id === 5);
          const allNames = Array.from(new Set([...vapes.map((p: any) => p.product_name), ...pouches.map((p: any) => p.product_name)]));
          const merged = allNames.map((name: string) => {
            const v = vapes.find((p: any) => p.product_name === name) || {};
            const p = pouches.find((p: any) => p.product_name === name) || {};
            return {
              product_name: name,
              vapes_sales_value: v.total_sales_value || 0,
              vapes_quantity: v.total_quantity_sold || 0,
              pouches_sales_value: p.total_sales_value || 0,
              pouches_quantity: p.total_quantity_sold || 0,
            };
          });
          setProductPerf(merged);
        }

        // Fetch managers data and leaves
        const [mgrRes, repRes, leavesRes] = await Promise.all([
          fetchData('/managers'),
          fetchData('/sales/performance'),
          fetchData('/sales-rep-leaves/sales-rep-leaves')
        ]);
        setManagers(mgrRes || []);
        setRepData(repRes.data || []);
        
        // Calculate pending leaves count
        const leaves = leavesRes || [];
        const pendingCount = leaves.filter((leave: any) => leave.status === '0' || leave.status === 0).length;
        setPendingLeavesCount(pendingCount);
        
        // Calculate new orders count (orders with my_status = 0)
        console.log('Orders data structure:', orders.slice(0, 3).map(o => ({ 
          id: o.id, 
          status: o.my_status, 
          allKeys: Object.keys(o),
          sampleValues: Object.entries(o).slice(0, 5)
        })));
        
        const newOrders = orders.filter((order: any) => {
          return order.my_status === 0 || order.my_status === '0';
        });
        
        console.log('New orders calculation:', {
          totalOrders: orders.length,
          newOrdersCount: newOrders.length,
          sampleOrders: newOrders.slice(0, 3).map(o => ({ id: o.id, status: o.my_status }))
        });
        
        setNewOrdersCount(newOrders.length);
        
      } catch (err: any) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
        setMpLoading(false);
        setProductPerfLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Helper functions
  const getRepsForManager = (manager: any) => {
    return repData.filter((rep: any) => rep.region === manager.region);
  };

  const getManagerOverallPct = (manager: any) => {
    const reps = getRepsForManager(manager);
    let typeKey: 'retail' | 'key_accounts' | 'distributors';
    if (manager.managerTypeId === 1) typeKey = 'retail';
    else if (manager.managerTypeId === 2) typeKey = 'key_accounts';
    else typeKey = 'distributors';
    
    const total = reps.reduce(
      (acc: any, rep: any) => {
        const perf = rep[typeKey];
        acc.vapes_target += perf.vapes_target || 0;
        acc.pouches_target += perf.pouches_target || 0;
        acc.vapes_sales += perf.vapes_sales || 0;
        acc.pouches_sales += perf.pouches_sales || 0;
        acc.total_outlets += perf.total_outlets || 0;
        acc.outlets_with_orders += perf.outlets_with_orders || 0;
        return acc;
      },
      { vapes_target: 0, pouches_target: 0, vapes_sales: 0, pouches_sales: 0, total_outlets: 0, outlets_with_orders: 0 }
    );
    
    const outlet_pct = total.total_outlets > 0 ? (total.outlets_with_orders / total.total_outlets) * 100 : 0;
    const vapesPct = total.vapes_target > 0 ? (total.vapes_sales / total.vapes_target) * 100 : 0;
    const pouchesPct = total.pouches_target > 0 ? (total.pouches_sales / total.pouches_target) * 100 : 0;
    const overallPct = ((outlet_pct + vapesPct + pouchesPct) / 3);
    return overallPct;
  };

  const navigationItems = [
    { to: '/sales-reps', label: 'Sales Reps', icon: <UsersIcon className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { to: '/sales-rep-leaves', label: 'Sales Rep Leaves', icon: <CalendarIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200', badge: pendingLeavesCount },
    { to: '/products', label: 'Products', icon: <ShoppingCartIcon className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
    { to: '/managers', label: 'Managers', icon: <UserCheckIcon className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { to: '/clients-list', label: 'Clients', icon: <UsersIcon className="h-4 w-4" />, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
    { to: '/notices', label: 'Notices', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { to: '/tasks', label: 'Tasks', icon: <TargetIcon className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { to: '/financial/customer-orders', label: 'Sales Report', icon: <BarChart3Icon className="h-4 w-4" />, color: 'bg-red-100 text-red-700 hover:bg-red-200', badge: newOrdersCount },
    { to: '/dashboard/reports/product-performance', label: 'Product Performance', icon: <PieChartIcon className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
    { to: '/master-sales', label: 'Master Sales Report', icon: <AwardIcon className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/sales-rep-master-report', label: 'Sales Rep Report', icon: <BarChart3Icon className="h-4 w-4" />, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
    { to: '/my-visibility', label: 'Visit Reports', icon: <EyeIcon className="h-4 w-4" />, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
    { to: '/dashboard/journey-plans', label: 'Route Plans', icon: <MapPinIcon className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    //{ to: '/settings', label: 'My Account', icon: <SettingsIcon className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { to: '/financial/create-customer-order', label: 'Add Order', icon: <PackageIcon className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200', badge: newOrdersCount },
    { to: '/chat-room', label: 'Chat Room', icon: <NotebookIcon className="h-4 w-4" />, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' }
    
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Header */}
        <div className="mb-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
        </div>



        {/* Debug Info - Remove after testing */}
        {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            Debug: newOrdersCount = {newOrdersCount}, pendingLeavesCount = {pendingLeavesCount}
          </p>
        </div> */}

        {/* Navigation Menu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className={`${item.color} flex flex-col items-center justify-center p-4 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-md relative`}
              >
                {item.icon}
                <span className="mt-2 text-center">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sales"
            value={stats.totalSales.toLocaleString()}
            prefix=""
            icon={<DollarSignIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-green-600 to-green-700"
            onClick={() => navigate('/dashboard/reports/sales-report')}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCartIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
            onClick={() => navigate('/dashboard/reports/sales-report')}
          />
          <StatCard
            title="Active Sales Reps"
            value={stats.activeReps}
            icon={<UsersIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-purple-600 to-purple-700"
            onClick={() => navigate('/sales-reps')}
          />
          <StatCard
            title="Avg Performance"
            value={stats.avgPerformance}
            suffix="%"
            icon={<TrendingUpIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-orange-600 to-orange-700"
            onClick={() => navigate('/shared-performance')}
          />
      </div>
     
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Monthly Sales Trend</h2>
              <button
              onClick={() => navigate('/dashboard/reports/sales-report')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
                View Details →
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center h-64 flex items-center justify-center">{error}</div>
            ) : (
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
            )}
          </div>

          {/* Product Performance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Product Performance</h2>
              <button
              onClick={() => navigate('/dashboard/reports/product-performance')}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
                View Details →
              </button>
            </div>
            {productPerfLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : productPerfError ? (
              <div className="text-red-500 text-center h-64 flex items-center justify-center">{productPerfError}</div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Managers Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Managers Performance</h2>
              <button
              onClick={() => navigate('/managers-performance')}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                View Details →
              </button>
            </div>
            {mpLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : mpError ? (
              <div className="text-red-500 text-center h-64 flex items-center justify-center">{mpError}</div>
            ) : managers && managers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={managers.map((m: any) => ({
                      name: m.name,
                      value: getManagerOverallPct(m) || 0
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {managers.map((_: any, index: number) => (
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
              <div className="text-gray-500 text-center h-64 flex items-center justify-center">No managers data available</div>
            )}
          </div>

          {/* Top Sales Reps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Top 10 Sales Reps</h2>
              <button
              onClick={() => navigate('/shared-performance')}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
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
              <div className="text-gray-500 text-center h-64 flex items-center justify-center">No sales reps data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboardPage; 