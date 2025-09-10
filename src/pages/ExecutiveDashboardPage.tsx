import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  PackageIcon, 
  AlertTriangleIcon,
  FileTextIcon,
  CreditCardIcon,
  BuildingIcon,
  BarChart3Icon,
  BoxIcon,
  ClockIcon,
  ChevronRightIcon,
  ActivityIcon,
  ZapIcon,
  NotebookIcon,
  CalculatorIcon,
  PiggyBankIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  AwardIcon,
  TargetIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../services/financialService';
import { API_CONFIG } from '../config/api';
import type { DashboardStats } from '../types/financial';

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
  badge?: React.ReactNode;
}

interface SalesData {
  date: string;
  order_count: number;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
}

interface SalesSummary {
  total_orders: number;
  total_sales: number;
  avg_order_value: number;
  first_order_date: string;
  last_order_date: string;
  growth_percentage: number;
  previous_month_sales: number;
}

interface CategoryPerformance {
  name: string;
  value: number;
  percentage: string;
  orderCount: number;
  totalQuantity: number;
  avgSaleValue: number;
  color: string;
}

interface CategorySummary {
  totalCategories: number;
  topCategory: string | null;
  topCategoryPercentage: string;
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
  onClick,
  badge
}) => {
  return (
    <div className="relative">
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
                  {change.positive ? (
                    <ArrowUpRightIcon className="h-4 w-4 text-green-300" />
                  ) : (
                    <ArrowDownRightIcon className="h-4 w-4 text-red-300" />
                  )}
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
      {badge && (
        <div className="absolute -top-2 -right-2">
          {badge}
        </div>
      )}
    </div>
  );
};

const FinancialDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [newCreditNotesCount, setNewCreditNotesCount] = useState<number>(0);
  const [hasNewChat, setHasNewChat] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryPerformance[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardService.getStats()
      .then(res => {
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setError(res.error || 'Failed to load dashboard stats');
        }
      })
      .catch(() => setError('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Fetch count of new (my_status = 0) orders for badge on Customer Orders card
    const fetchNewOrders = async () => {
      try {
        const url = API_CONFIG.getUrl('/financial/sales-orders-all');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok && data && data.success && Array.isArray(data.data)) {
          const count = data.data.filter((o: any) => String(o.my_status || '0') === '0').length;
          setNewOrdersCount(count);
        }
      } catch {}
    };
    
    // Fetch count of new (my_status = 0) credit notes for badge on Credit Notes card
    const fetchNewCreditNotes = async () => {
      try {
        const url = API_CONFIG.getUrl('/financial/credit-notes');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok && data && data.success && Array.isArray(data.data)) {
          // Count credit notes with my_status = 0 (new/unprocessed)
          const count = data.data.filter((cn: any) => String(cn.my_status || '0') === '0').length;
          setNewCreditNotesCount(count);
        }
      } catch {}
    };
    
    const fetchChatLatest = async () => {
      try {
        const url = API_CONFIG.getUrl('/chat/latest');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok && data && data.success) {
          const lastMessage = data.last_message_at ? new Date(data.last_message_at).getTime() : 0;
          const lastVisited = Number(localStorage.getItem('chat_last_visited_ts') || 0);
          setHasNewChat(lastMessage > lastVisited);
        }
      } catch {}
    };
    fetchNewOrders();
    fetchNewCreditNotes();
    fetchChatLatest();
  }, []);

  useEffect(() => {
    // Fetch current month sales data
    const fetchSalesData = async () => {
      setSalesLoading(true);
      setSalesError(null);
      try {
        const url = API_CONFIG.getUrl('/financial/sales-orders/current-month-data');
        const res = await fetch(url, { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        const data = await res.json();
        if (res.ok && data && data.success) {
          setSalesData(data.data.dailyData);
          setSalesSummary(data.data.summary);
        } else {
          setSalesError(data.error || 'Failed to load sales data');
        }
      } catch (err) {
        setSalesError('Failed to load sales data');
      } finally {
        setSalesLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  useEffect(() => {
    // Fetch category performance data
    const fetchCategoryData = async () => {
      setCategoryLoading(true);
      setCategoryError(null);
      try {
        const url = API_CONFIG.getUrl('/financial/sales-orders/category-performance');
        const res = await fetch(url, { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        const data = await res.json();
        if (res.ok && data && data.success) {
          setCategoryData(data.data.chartData);
          setCategorySummary(data.data.summary);
        } else {
          setCategoryError(data.error || 'Failed to load category data');
        }
      } catch (err) {
        setCategoryError('Failed to load category data');
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const navigationItems = [
    //{ to: '/financial/purchase-order', label: 'New Purchase', icon: <ShoppingCartIcon className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    //{ to: '/financial/create-customer-order', label: 'Create Order', icon: <PackageIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { to: '/financial/customer-orders', label: 'Customer Orders', icon: <PackageIcon className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
  { to: '/reports', label: 'Financial Reports', icon: <BarChart3Icon className="h-4 w-4" />, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
    { to: '/suppliers', label: 'Vendors', icon: <BuildingIcon className="h-4 w-4" />, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    //{ to: '/riders', label: 'Riders', icon: <UsersIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { to: '/clients', label: 'Customers', icon: <UsersIcon className="h-4 w-4" />, color: 'bg-lime-100 text-lime-700 hover:bg-lime-200' },
    { to: '/store-inventory', label: 'Store Inventory', icon: <PackageIcon className="h-4 w-4" />, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
    { to: '/assets', label: 'Assets', icon: <BoxIcon className="h-4 w-4" />, color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
    //{ to: '/expenses', label: 'Expenses', icon: <DollarSignIcon className="h-4 w-4" />, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
    { to: '/expense-summary', label: 'Expenses Summary', icon: <BarChart3Icon className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { to: '/products', label: 'Products', icon: <BoxIcon className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: <ShoppingCartIcon className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    //{ to: '/all-orders', label: 'Sales Orders', icon: <DollarSignIcon className="h-4 w-4" />, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { to: '/invoice-list', label: 'Invoice List', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/credit-note-summary', label: 'Credit Notes', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { to: '/dashboard/reports/product-performance', label: 'Products Performance', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    //{ to: '/receipts', label: 'Receipts', icon: <ReceiptIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { to: '/payroll-management', label: 'Payroll', icon: <CreditCardIcon className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    //{ to: '/journal-entries', label: 'Journal Entries', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { to: '/payables', label: 'Payables', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
    { to: '/receivables', label: 'Receivables', icon: <PiggyBankIcon className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/pending-payments', label: 'Pending Payments', icon: <ClockIcon className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { to: '/sales-rep-performance', label: 'Sales Rep Performance', icon: <TrendingUpIcon className="h-4 w-4" />, color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
    { to: '/overall-attendance', label: 'Sales Rep Report', icon: <BarChart3Icon className="h-4 w-4" />, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
    { to: '/uplift-sales', label: 'Uplift Sales', icon: <TrendingUpIcon className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/unconfirmed-payments', label: 'Unconfirmed Payments', icon: <ClockIcon className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { to: '/sales-reps', label: 'Sales Reps', icon: <UsersIcon className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { to: '/chat-room', label: 'Chat Room', icon: <NotebookIcon className="h-4 w-4" />, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
    { to: '/notices', label: 'Notices', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { to: '/tasks', label: 'Tasks', icon: <TargetIcon className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { to: '/master-sales', label: 'Master Sales Report', icon: <AwardIcon className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { to: '/document-list', label: 'Documents', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { to: '/dashboard/staff-list', label: 'Employees', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { to: '/employee-working-hours', label: 'Employees Attendance', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { to: '/employee-working-days', label: 'Employees Working Days', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
       
    
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 opacity-70">
          <StatCard
            title="Total Sales"
            value={stats ? formatCurrency(stats.totalSales) : '$0.00'}
            icon={<FileTextIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-green-600 to-green-700"
            onClick={() => navigate('/invoice-list')}
            change={{ value: 12.5, positive: true }}
          />
          
          <StatCard
            title="Total Purchases"
            value={stats ? formatCurrency(stats.totalPurchases) : '$0.00'}
            icon={<ShoppingCartIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
            onClick={() => navigate('/purchase-orders')}
            change={{ value: 8.3, positive: true }}
          />

          <StatCard
            title="Receivables"
            value={stats ? formatCurrency(stats.totalReceivables) : '$0.00'}
            icon={<PiggyBankIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-amber-600 to-amber-700"
            onClick={() => navigate('/receivables')}
            change={{ value: 5.2, positive: false }}
          />

          <StatCard
            title="Payables"
            value={stats ? formatCurrency(stats.totalPayables) : '0.00'}
            icon={<FileTextIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-red-600 to-red-700"
            onClick={() => navigate('/payables')}
            change={{ value: 3.1, positive: false }}
          />
        </div>

        {/* Quick Actions Row */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <ZapIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button 
              onClick={() => navigate('/financial/purchase-order')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
            >
              <ShoppingCartIcon className="w-5 h-5 text-blue-600 mb-2" />
              <span className="text-xs font-medium text-center text-blue-700">New Purchase</span>
            </button>
            
            <button 
              onClick={() => navigate('/financial/create-customer-order')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300"
            >
              <PackageIcon className="w-5 h-5 text-green-600 mb-2" />
              <span className="text-xs font-medium text-center text-green-700">Create Order</span>
            </button>
            
            <button 
              onClick={() => navigate('/create-invoice')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
            >
              <FileTextIcon className="w-5 h-5 text-emerald-600 mb-2" />
              <span className="text-xs font-medium text-center text-emerald-700">Create Invoice</span>
            </button>
            
            <button 
              onClick={() => navigate('/invoice-list')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-teal-200 bg-teal-50 hover:bg-teal-100 hover:border-teal-300"
            >
              <FileTextIcon className="w-5 h-5 text-teal-600 mb-2" />
              <span className="text-xs font-medium text-center text-teal-700">Invoice List</span>
            </button>
            
            <button 
              onClick={() => navigate('/add-expense')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
            >
              <DollarSignIcon className="w-5 h-5 text-red-600 mb-2" />
              <span className="text-xs font-medium text-center text-red-700">Add Expense</span>
            </button>
            
            <button 
              onClick={() => navigate('/add-journal-entry')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300"
            >
              <FileTextIcon className="w-5 h-5 text-purple-600 mb-2" />
              <span className="text-xs font-medium text-center text-purple-700">Journal Entry</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className={`${item.color} relative flex flex-col items-center justify-center p-4 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-md`}
              >
                {item.icon}
                <span className="mt-2 text-center">{item.label}</span>
                {item.to === '/financial/customer-orders' && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full text-xs font-semibold bg-red-600 text-white shadow">
                    {newOrdersCount}
                  </span>
                )}
                {item.to === '/credit-note-summary' && newCreditNotesCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full text-xs font-semibold bg-orange-600 text-white shadow">
                    {newCreditNotesCount}
                  </span>
                )}
                {item.to === '/chat-room' && hasNewChat && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-3 w-3 rounded-full bg-emerald-500 shadow ring-2 ring-white" />
                )}
              </Link>
            ))}
          </div>
            </div>

        {/* Sales Graph Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Month Sales</h3>
              <p className="text-sm text-gray-600">Daily sales performance for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            {salesSummary && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesSummary.total_sales)}
                </div>
                <div className="flex items-center text-sm">
                  {salesSummary.growth_percentage >= 0 ? (
                    <ArrowUpRightIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRightIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={salesSummary.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {salesSummary.growth_percentage >= 0 ? '+' : ''}{salesSummary.growth_percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
            )}
          </div>

          {salesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : salesError ? (
            <div className="text-red-500 text-center h-64 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                <p>{salesError}</p>
              </div>
            </div>
          ) : salesData.length === 0 ? (
            <div className="text-gray-500 text-center h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3Icon className="h-8 w-8 mx-auto mb-2" />
                <p>No sales data available for this month</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    formatter={(value: number, name: string) => [
                      name === 'total_amount' ? formatCurrency(value) : value,
                      name === 'total_amount' ? 'Sales' : 'Orders'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_amount" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sales Summary Cards */}
          {salesSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{salesSummary.total_orders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(salesSummary.avg_order_value)}</div>
                <div className="text-sm text-gray-600">Avg Order Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {salesData.length > 0 ? (salesSummary.total_orders / salesData.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-gray-600">Orders/Day</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {salesSummary.growth_percentage >= 0 ? '+' : ''}{salesSummary.growth_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Growth Rate</div>
              </div>
            </div>
          )}
        </div>

        {/* Category Performance Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
              <p className="text-sm text-gray-600">Sales distribution by product category for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            {categorySummary && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {categorySummary.totalCategories} Categories
                </div>
                <div className="text-sm text-gray-600">
                  Top: {categorySummary.topCategory} ({categorySummary.topCategoryPercentage}%)
                </div>
              </div>
            )}
          </div>

          {categoryLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : categoryError ? (
            <div className="text-red-500 text-center h-64 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                <p>{categoryError}</p>
              </div>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="text-gray-500 text-center h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3Icon className="h-8 w-8 mx-auto mb-2" />
                <p>No category data available for this month</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [
                        formatCurrency(value),
                        'Sales'
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-600">
                            {category.orderCount} orders • {category.totalQuantity} units
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(category.value)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {category.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Summary Stats */}
          {categorySummary && categoryData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{categorySummary.totalCategories}</div>
                <div className="text-sm text-gray-600">Total Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{categorySummary.topCategory}</div>
                <div className="text-sm text-gray-600">Top Category</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{categorySummary.topCategoryPercentage}%</div>
                <div className="text-sm text-gray-600">Top Category Share</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 hidden">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <ZapIcon className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/financial/purchase-order')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-blue-200 group-hover:bg-blue-300">
                    <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-blue-700">New Purchase</span>
                </button>
                
                <button 
                  onClick={() => navigate('/financial/create-customer-order')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-green-200 group-hover:bg-green-300">
                    <PackageIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-green-700">Create Order</span>
                </button>
                
                <button 
                  onClick={() => navigate('/create-invoice')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-emerald-200 group-hover:bg-emerald-300">
                    <FileTextIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-emerald-700">Create Invoice</span>
                </button>
                
                <button 
                  onClick={() => navigate('/add-expense')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-red-200 group-hover:bg-red-300">
                    <DollarSignIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-red-700">Add Expense</span>
                </button>
                
                <button 
                  onClick={() => navigate('/equity/entries')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-purple-200 group-hover:bg-purple-300">
                    <CalculatorIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-purple-700">Equity Entries</span>
                </button>
                
                  <button 
                  onClick={() => navigate('/add-journal-entry')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-amber-200 group-hover:bg-amber-300">
                    <FileTextIcon className="w-5 h-5 text-amber-600" />
                    </div>
                  <span className="text-sm font-medium text-center text-amber-700">Journal Entry</span>
                  </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <ActivityIcon className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New sale recorded</p>
                    <p className="text-xs text-gray-500">Invoice #INV-2024-001 • $2,450.00</p>
                    <p className="text-xs text-gray-400">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Purchase order created</p>
                    <p className="text-xs text-gray-500">PO #PO-2024-032 • Supplier ABC</p>
                    <p className="text-xs text-gray-400">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Payment received</p>
                    <p className="text-xs text-gray-500">Customer XYZ • $1,200.00</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Inventory update</p>
                    <p className="text-xs text-gray-500">12 items marked as low stock</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Expense recorded</p>
                    <p className="text-xs text-gray-500">Office supplies • $350.00</p>
                    <p className="text-xs text-gray-400">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Management Cards */}
        <div className="mb-8 hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <button
              onClick={() => navigate('/payables')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-rose-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">💸</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payables</h3>
              <p className="text-sm text-gray-600 mb-3">View & manage supplier payables</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/receivables')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-emerald-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Receivables</h3>
              <p className="text-sm text-gray-600 mb-3">View & manage customer receivables</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/financial/customer-orders')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-indigo-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Orders</h3>
              <p className="text-sm text-gray-600 mb-3">View all customer orders</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/pending-payments')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-amber-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Payments</h3>
              <p className="text-sm text-gray-600 mb-3">Review & confirm payments</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

              <button
              onClick={() => navigate('/cash-equivalents')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-blue-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">🏦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash & Equivalents</h3>
              <p className="text-sm text-gray-600 mb-3">View all cash accounts</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                  <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
                </div>
              </button>
          </div>
        </div>

        {/* Business Operations */}
        <div hidden>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => navigate('/chart-of-accounts')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                  <BarChart3Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chart of Accounts</h3>
              <p className="text-sm text-gray-600 mb-4">Manage accounting structure</p>
              <div className="flex items-center text-sm text-indigo-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <BarChart3Icon className="w-6 h-6 text-blue-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Reports</h3>
              <p className="text-sm text-gray-600 mb-4">View financial reporting</p>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/suppliers')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                  <BuildingIcon className="w-6 h-6 text-slate-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendors</h3>
              <p className="text-sm text-gray-600 mb-4">Manage vendor information</p>
              <div className="flex items-center text-sm text-slate-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/clients')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <UsersIcon className="w-6 h-6 text-green-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers</h3>
              <p className="text-sm text-gray-600 mb-4">Manage customer database</p>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/store-inventory')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <PackageIcon className="w-6 h-6 text-purple-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Inventory</h3>
              <p className="text-sm text-gray-600 mb-4">Track inventory levels</p>
              <div className="flex items-center text-sm text-purple-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/assets')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-teal-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <BoxIcon className="w-6 h-6 text-teal-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Assets</h3>
              <p className="text-sm text-gray-600 mb-4">View and manage all assets</p>
              <div className="flex items-center text-sm text-teal-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/expenses')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                  <DollarSignIcon className="w-6 h-6 text-red-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expenses</h3>
              <p className="text-sm text-gray-600 mb-4">View all expenses</p>
              <div className="flex items-center text-sm text-red-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

              <button
              onClick={() => navigate('/products')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-teal-300 transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <BoxIcon className="w-6 h-6 text-teal-600" />
                  </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Products</h3>
              <p className="text-sm text-gray-600 mb-4">View and manage all products</p>
              <div className="flex items-center text-sm text-teal-600 font-medium">
                  <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
                </div>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboardPage;
