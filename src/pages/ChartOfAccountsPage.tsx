import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { chartOfAccountsService } from '../services/financialService';
import { ChartOfAccount } from '../types/financial';

// Account type mapping
const ACCOUNT_TYPES: { [key: number]: { name: string; color: string } } = {
  1: { name: 'Asset', color: 'bg-green-100 text-green-800' },
  2: { name: 'Liability', color: 'bg-red-100 text-red-800' },
  4: { name: 'Revenue', color: 'bg-blue-100 text-blue-800' },
  5: { name: 'Expense', color: 'bg-orange-100 text-orange-800' },
  9: { name: 'Cash', color: 'bg-emerald-100 text-emerald-800' },
  13: { name: 'Equity', color: 'bg-purple-100 text-purple-800' },
  16: { name: 'Expense Account', color: 'bg-amber-100 text-amber-800' },
  17: { name: 'Depreciation', color: 'bg-gray-100 text-gray-800' }
};

const ChartOfAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<number | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chartOfAccountsService.getAll();
      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        setError(response.error || 'Failed to fetch chart of accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGeneralLedger = (accountCode: string) => {
    navigate(`/dashboard/reports/general-ledger?account=${encodeURIComponent(accountCode)}`);
  };

  const exportToCSV = () => {
    if (!filteredAccounts.length) return;

    const headers = ['Account Code', 'Account Name', 'Account Type', 'Status', 'Description'];
    const rows = filteredAccounts.map(acc => [
      acc.account_code,
      acc.account_name,
      ACCOUNT_TYPES[acc.account_type]?.name || `Type ${acc.account_type}`,
      acc.is_active ? 'Active' : 'Inactive',
      acc.description || ''
    ]);

    const csvContent = [
      ['Chart of Accounts'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows
    ]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = !searchTerm || 
      acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.description && acc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || acc.account_type === filterType;
    const matchesActive = showInactive || acc.is_active;
    
    return matchesSearch && matchesType && matchesActive;
  });

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as { [key: number]: ChartOfAccount[] });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart of accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Accounts</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAccounts}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
                <p className="text-gray-600">
                  {filteredAccounts.length} of {accounts.length} accounts
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                disabled={!filteredAccounts.length}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Object.entries(ACCOUNT_TYPES).map(([typeNum, typeInfo]) => {
              const count = accounts.filter(acc => acc.account_type === parseInt(typeNum) && acc.is_active).length;
              return (
                <div key={typeNum} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">{typeInfo.name}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Code, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                {Object.entries(ACCOUNT_TYPES).map(([typeNum, typeInfo]) => (
                  <option key={typeNum} value={typeNum}>
                    {typeInfo.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Show inactive accounts
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Accounts Table - Grouped by Type */}
        {Object.entries(groupedAccounts).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No accounts found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedAccounts)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([typeNum, accountsList]) => {
              const typeInfo = ACCOUNT_TYPES[parseInt(typeNum)] || { 
                name: `Type ${typeNum}`, 
                color: 'bg-gray-100 text-gray-800' 
              };
              
              return (
                <div key={typeNum} className="bg-white rounded-lg shadow-sm mb-6">
                  {/* Type Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${typeInfo.color}`}>
                          {typeInfo.name}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {accountsList.length} account{accountsList.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accounts Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accountsList.map((account) => (
                          <tr key={account.id} className={`hover:bg-gray-50 ${!account.is_active ? 'opacity-60' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {account.account_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {account.account_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="max-w-md truncate">
                                {account.description || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {account.is_active ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              <button
                                onClick={() => handleViewGeneralLedger(account.account_code)}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                title="View General Ledger"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Ledger
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Total: {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''} displayed
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartOfAccountsPage;

