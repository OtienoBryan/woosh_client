import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Download, 
  FileText, 
  BarChart3, 
  Calculator,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  FileText as FileTextIcon
} from 'lucide-react';
import JournalEntriesModal from '../components/JournalEntriesModal';

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
  balance: number;
  comparative_balance?: number;
  change?: number;
  change_percentage?: number;
}

interface Subtotals {
  current: number;
  nonCurrent: number;
  other: number;
  total: number;
}

interface Ratios {
  working_capital: number;
  current_ratio: number;
  debt_to_equity_ratio: number;
  debt_to_asset_ratio: number;
}

interface Note {
  id: number;
  title: string;
  content: string;
}

interface DrillDownData {
  cash_and_equivalents: Account[];
  accounts_receivable: Account[];
  inventory: Account[];
  fixed_assets: Account[];
  accounts_payable: Account[];
  accrued_expenses: Account[];
}

interface BalanceSheetData {
  as_of_date: string;
  compare_date?: string;
  assets: {
    current: Account[];
    non_current: Account[];
    other: Account[];
    subtotals: Subtotals;
    cash_and_equivalents_total?: number; // <-- add this field
  };
  liabilities: {
    current: Account[];
    non_current: Account[];
    other: Account[];
    subtotals: Subtotals;
  };
  equity: {
    accounts: Account[];
    subtotals: Subtotals;
  };
  totals: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    total_liabilities_and_equity: number;
  };
  ratios: Ratios;
  notes: Note[];
  drill_down_data: DrillDownData;
  metadata: {
    generated_at: string;
    has_comparative_data: boolean;
    total_accounts: number;
    significant_accounts: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BalanceSheetReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState('');
  const [compareDate, setCompareDate] = useState('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    currentAssets: true,
    nonCurrentAssets: true,
    currentLiabilities: true,
    nonCurrentLiabilities: true,
    equity: true,
    notes: false,
    ratios: false
  });
  const [showDrillDown, setShowDrillDown] = useState<string | null>(null);
  const [showJournalEntriesModal, setShowJournalEntriesModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetchBalanceSheetReport();
    // eslint-disable-next-line
  }, [asOfDate, compareDate]);

  const fetchBalanceSheetReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (asOfDate) params.append('as_of_date', asOfDate);
      if (compareDate) params.append('compare_date', compareDate);
      const res = await axios.get(`${API_BASE_URL}/financial/reports/balance-sheet?${params}`);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch balance sheet report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance sheet report');
    } finally {
      setLoading(false);
    }
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return '0.00%';
    return `${value.toFixed(2)}%`;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleDrillDown = (section: string) => {
    setShowDrillDown(prev => prev === section ? null : section);
  };

  const handleAccountClick = (account: Account) => {
    console.log('Account clicked:', account);
    console.log('Account ID type:', typeof account.id, 'Value:', account.id);
    console.log('Account Code:', account.account_code);
    console.log('Full account object:', JSON.stringify(account, null, 2));
    setSelectedAccount(account);
    setShowJournalEntriesModal(true);
    console.log('Modal state updated:', { selectedAccount: account, showJournalEntriesModal: true });
  };

  const closeJournalEntriesModal = () => {
    setShowJournalEntriesModal(false);
    setSelectedAccount(null);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const renderAccountRow = (account: Account, showComparative = false) => (
    <div 
      key={account.account_code || account.id} 
      className="flex justify-between items-center py-2 hover:bg-blue-50 cursor-pointer group border-l-2 border-transparent hover:border-blue-500 transition-all rounded-r px-2 bg-white hover:shadow-md"
      onClick={() => {
        console.log('Account row clicked:', account);
        handleAccountClick(account);
      }}
      title={`Click to view journal entries for ${account.account_name}`}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 w-16">{account.account_code}</span>
        <span className="text-sm text-gray-700 flex-1 group-hover:text-blue-600 transition-colors font-medium">
          {account.account_name}
        </span>
        <FileTextIcon className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center space-x-4">
        {showComparative && account.comparative_balance !== undefined && (
          <span className="text-sm text-gray-500 w-24 text-right">
            {number_format(account.comparative_balance)}
          </span>
        )}
        <span className={`text-sm font-medium w-24 text-right ${account.account_code === '1500' ? 'text-red-600' : ''}`}>
          {number_format(account.balance)}
        </span>
        {showComparative && account.change !== undefined && (
          <div className="flex items-center space-x-1 w-20">
            {getChangeIcon(account.change)}
            <span className={`text-xs ${getChangeColor(account.change)}`}>
              {number_format(Math.abs(account.change))}
            </span>
          </div>
        )}
        {showComparative && account.change_percentage !== undefined && (
          <span className={`text-xs w-16 text-right ${getChangeColor(account.change_percentage)}`}>
            {formatPercentage(account.change_percentage)}
          </span>
        )}
      </div>
    </div>
  );

  const renderSubtotal = (label: string, amount: number, showComparative = false, comparativeAmount?: number) => (
    <div className="flex justify-between items-center py-2 border-t border-gray-200 font-semibold">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center space-x-4">
        {showComparative && comparativeAmount !== undefined && (
          <span className="text-sm text-gray-500 w-24 text-right">
            {number_format(comparativeAmount)}
          </span>
        )}
        <span className="text-sm font-bold w-24 text-right">{number_format(amount)}</span>
      </div>
    </div>
  );

  const renderSection = (
    title: string, 
    accounts: Account[], 
    subtotal: number, 
    sectionKey: string,
    showComparative = false,
    comparativeSubtotal?: number,
    cashAndEquivalentsTotal?: number // <-- keep only this one
  ) => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div 
        className="px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-900">{title}</h4>
          {expandedSections[sectionKey] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </div>
      {expandedSections[sectionKey] && (
        <div className="p-4">
          {showComparative && (
            <div className="grid grid-cols-4 gap-4 mb-3 text-xs font-medium text-gray-500 border-b pb-2">
              <div className="col-span-2">Account</div>
              <div className="text-right">Previous</div>
              <div className="text-right">Current</div>
            </div>
          )}
          {/* --- Add this: Cash and Equivalents Total Row --- */}
          {sectionKey === 'currentAssets' && cashAndEquivalentsTotal !== undefined && (
            <div className="flex justify-between items-center py-1 font-semibold bg-blue-50 rounded mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-700 w-16"> </span>
                <span className="text-sm text-blue-700 flex-1">Total Cash and Equivalents</span>
              </div>
              <span className="text-sm font-bold w-24 text-right text-blue-700">
                {number_format(cashAndEquivalentsTotal)}
              </span>
            </div>
          )}
          {accounts.length > 0 ? (
            <>
              {accounts.map(account => renderAccountRow(account, showComparative))}
              {renderSubtotal(`Total ${title}`, subtotal, showComparative, comparativeSubtotal)}
            </>
          ) : (
            <div className="text-gray-500 text-sm py-2">No accounts found.</div>
          )}
        </div>
      )}
    </div>
  );

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
              <h1 className="text-3xl font-bold text-gray-900">Balance Sheet Report</h1>
              <p className="text-gray-600 mt-1">
                Assets, Liabilities, and Equity as of {reportData?.as_of_date}
                {reportData?.compare_date && ` (vs ${reportData.compare_date})`}
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
               
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-6">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">As of Date:</label>
              <input
                type="date"
                value={asOfDate}
                onChange={e => setAsOfDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Compare with:</label>
              <input
                type="date"
                value={compareDate}
                onChange={e => setCompareDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assets</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {number_format(reportData.totals.total_assets)}
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
                    <p className="text-sm font-medium text-gray-600">Total Liabilities</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {number_format(reportData.totals.total_liabilities)}
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
                    <p className="text-sm font-medium text-gray-600">Total Equity</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {number_format(reportData.totals.total_equity)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Calculator className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Working Capital</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {number_format(reportData.ratios.working_capital)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Ratios */}
            <div className="bg-white rounded-lg shadow">
              <div 
                className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('ratios')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Financial Ratios
                  </h3>
                  {expandedSections.ratios ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
              {expandedSections.ratios && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Current Ratio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.ratios.current_ratio.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Assets / Liabilities</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Debt to Equity</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(reportData.ratios.debt_to_equity_ratio * 100)}
                      </p>
                      <p className="text-xs text-gray-500">Liabilities / Equity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Debt to Assets</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(reportData.ratios.debt_to_asset_ratio * 100)}
                      </p>
                      <p className="text-xs text-gray-500">Liabilities / Assets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Working Capital</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {number_format(reportData.ratios.working_capital)}
                      </p>
                      <p className="text-xs text-gray-500">Current Assets - Current Liabilities</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Balance Sheet Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-green-700">Assets</h3>
                {renderSection(
                  'Current Assets', 
                  reportData.assets.current, 
                  reportData.assets.subtotals.current,
                  'currentAssets',
                  reportData.metadata.has_comparative_data,
                  undefined,
                  reportData.assets.cash_and_equivalents_total // <-- pass here
                )}
                {renderSection(
                  'Non-Current Assets', 
                  reportData.assets.non_current, 
                  reportData.assets.subtotals.nonCurrent,
                  'nonCurrentAssets',
                  reportData.metadata.has_comparative_data
                )}
                {reportData.assets.other.length > 0 && renderSection(
                  'Other Assets', 
                  reportData.assets.other, 
                  reportData.assets.subtotals.other,
                  'otherAssets',
                  reportData.metadata.has_comparative_data
                )}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-800">Total Assets</span>
                    <span className="text-lg font-bold text-green-800">
                      {number_format(reportData.totals.total_assets)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-red-700">Liabilities & Equity</h3>
                {renderSection(
                  'Current Liabilities', 
                  reportData.liabilities.current, 
                  reportData.liabilities.subtotals.current,
                  'currentLiabilities',
                  reportData.metadata.has_comparative_data
                )}
                {renderSection(
                  'Non-Current Liabilities', 
                  reportData.liabilities.non_current, 
                  reportData.liabilities.subtotals.nonCurrent,
                  'nonCurrentLiabilities',
                  reportData.metadata.has_comparative_data
                )}
                {reportData.liabilities.other.length > 0 && renderSection(
                  'Other Liabilities', 
                  reportData.liabilities.other, 
                  reportData.liabilities.subtotals.other,
                  'otherLiabilities',
                  reportData.metadata.has_comparative_data
                )}
                {renderSection(
                  'Equity', 
                  reportData.equity.accounts, 
                  reportData.equity.subtotals.total,
                  'equity',
                  reportData.metadata.has_comparative_data
                )}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-red-800">Total Liabilities & Equity</span>
                    <span className="text-lg font-bold text-red-800">
                      {number_format(reportData.totals.total_liabilities_and_equity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Disclosures */}
            <div className="bg-white rounded-lg shadow">
              <div 
                className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('notes')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Notes and Disclosures
                  </h3>
                  {expandedSections.notes ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
              {expandedSections.notes && (
                <div className="p-6">
                  <div className="space-y-4">
                    {reportData.notes.map(note => (
                      <div key={note.id} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-gray-900 mb-2">{note.title}</h4>
                        <p className="text-sm text-gray-600">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drill-Down Analysis */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Drill-Down Analysis
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {Object.entries(reportData.drill_down_data).map(([key, accounts]) => (
                     <div key={key} className="border rounded-lg p-4">
                       <h4 className="font-medium text-gray-900 mb-2 capitalize">
                         {key.replace(/_/g, ' ')}
                       </h4>
                       {accounts.length > 0 ? (
                         <div className="space-y-1">
                           {accounts.map((account: Account) => (
                             <div key={account.account_code} className="flex justify-between text-sm">
                               <span className="text-gray-600">{account.account_name}</span>
                               <span className="font-medium">{number_format(account.balance)}</span>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-gray-500 text-sm">No accounts found</p>
                       )}
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Generated: {new Date(reportData.metadata.generated_at).toLocaleString()}</span>
                  <span>Total Accounts: {reportData.metadata.total_accounts}</span>
                  <span>Significant Accounts: {reportData.metadata.significant_accounts}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Report includes all material balances as of the reporting date</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Journal Entries Modal */}
      <JournalEntriesModal
        isOpen={showJournalEntriesModal}
        onClose={closeJournalEntriesModal}
        account={selectedAccount}
      />
    </div>
  );
};

export default BalanceSheetReportPage; 