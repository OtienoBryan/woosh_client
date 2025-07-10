import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface ProfitLossData {
  period: string;
  revenue: {
    sales_revenue: number;
    other_income: number;
    total_revenue: number;
  };
  expenses: {
    cost_of_goods_sold: number;
    operating_expenses_breakdown: {
      account_code: string;
      account_name: string;
      balance: number;
    }[];
    total_operating_expenses: number;
    total_expenses: number;
  };
  net_profit: number;
  gross_profit: number;
  gross_margin: number;
  net_margin: number;
}

interface AccountBalance {
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProfitLossReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);

  useEffect(() => {
    fetchProfitLossReport();
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    if (reportData) {
      console.log('Report Data Updated:', reportData);
      console.log('Net Profit Value:', reportData.net_profit, 'Type:', typeof reportData.net_profit);
    }
  }, [reportData]);

  const fetchProfitLossReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('start_date', customStartDate);
        params.append('end_date', customEndDate);
      } else {
        params.append('period', period);
      }

      const res = await axios.get(`${API_BASE_URL}/financial/reports/profit-loss?${params}`);
      if (res.data.success) {
        console.log('Profit & Loss API Response:', res.data.data);
        setReportData(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch profit and loss report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profit and loss report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'current_month':
        return 'Current Month';
      case 'last_month':
        return 'Last Month';
      case 'current_quarter':
        return 'Current Quarter';
      case 'current_year':
        return 'Current Year';
      case 'custom':
        return `Custom Period (${customStartDate} to ${customEndDate})`;
      default:
        return 'Current Month';
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvContent = [
      ['Profit and Loss Report', getPeriodLabel()],
      [''],
      ['Revenue'],
      ['Sales Revenue', formatCurrency(reportData.revenue.sales_revenue)],
      ['Other Income', formatCurrency(reportData.revenue.other_income)],
      ['Total Revenue', formatCurrency(reportData.revenue.total_revenue)],
      [''],
      ['Cost of Goods Sold', formatCurrency(reportData.expenses.cost_of_goods_sold)],
      ['Gross Profit', formatCurrency(reportData.gross_profit)],
      ['Gross Margin', formatPercentage(reportData.gross_margin)],
      [''],
      ['Operating Expenses'],
      ['Advertising Expense', formatCurrency(reportData.expenses.advertising_expense)],
      ['Rent Expense', formatCurrency(reportData.expenses.rent_expense)],
      ['Utilities Expense', formatCurrency(reportData.expenses.utilities_expense)],
      ['Wages Expense', formatCurrency(reportData.expenses.wages_expense)],
      ['Insurance Expense', formatCurrency(reportData.expenses.insurance_expense)],
      ['Office Supplies', formatCurrency(reportData.expenses.office_supplies)],
      ['Depreciation Expense', formatCurrency(reportData.expenses.depreciation_expense)],
      ['Miscellaneous Expense', formatCurrency(reportData.expenses.miscellaneous_expense)],
      ['Total Operating Expenses', formatCurrency(reportData.expenses.total_expenses)],
      [''],
      ['Net Profit', formatCurrency(reportData.net_profit)],
      ['Net Margin', formatPercentage(reportData.net_margin)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-report-${getPeriodLabel().toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Report</h1>
              <p className="text-gray-600 mt-1">Financial performance analysis</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="custom">Custom Period</option>
            </select>

            {period === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.revenue.total_revenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.gross_profit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.expenses.total_expenses)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${reportData.net_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <DollarSign className={`w-6 h-6 ${reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className={`text-2xl font-bold ${reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.net_profit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Profit & Loss Statement - {getPeriodLabel()}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Revenue</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sales Revenue</span>
                        <span className="font-medium">{formatCurrency(reportData.revenue.sales_revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Other Income</span>
                        <span className="font-medium">{formatCurrency(reportData.revenue.other_income)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="font-semibold text-gray-900">Total Revenue</span>
                        <span className="font-bold text-gray-900">{formatCurrency(reportData.revenue.total_revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost of Goods Sold */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Cost of Goods Sold</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cost of Goods Sold</span>
                      <span className="font-medium">{formatCurrency(reportData.expenses.cost_of_goods_sold)}</span>
                    </div>
                  </div>

                  {/* Gross Profit */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Gross Profit</span>
                      <span className="font-bold text-gray-900">{formatCurrency(reportData.gross_profit)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">Gross Margin</span>
                      <span className="text-sm font-medium text-gray-500">{formatPercentage(reportData.gross_margin)}</span>
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Operating Expenses</h4>
                    <div className="space-y-3">
                      {reportData.expenses.operating_expenses_breakdown && reportData.expenses.operating_expenses_breakdown.length > 0 ? (
                        reportData.expenses.operating_expenses_breakdown.map((exp) => (
                          <div key={exp.account_code} className="flex justify-between items-center">
                            <span className="text-gray-600">{exp.account_name} ({exp.account_code})</span>
                            <span className="font-medium">{formatCurrency(exp.balance)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No operating expenses found.</div>
                      )}
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="font-semibold text-gray-900">Total Operating Expenses</span>
                        <span className="font-bold text-gray-900">{formatCurrency(reportData.expenses.total_operating_expenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-gray-900">Net Profit</span>
                      <span className={`font-bold text-lg ${reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.net_profit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">Net Margin</span>
                      <span className={`text-sm font-medium ${reportData.net_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(reportData.net_margin)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfitLossReportPage; 