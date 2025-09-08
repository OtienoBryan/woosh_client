import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Filter, Calendar, Search, RefreshCw } from 'lucide-react';

interface JournalEntryLine {
  journal_entry_id: number;
  entry_number: string;
  entry_date: string;
  reference: string;
  journal_description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_at: string;
  line_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  line_description: string;
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const JournalEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntryLine[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('Please select an account to view journal entries');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchAccounts();
    // Don't fetch entries on initial load - require account selection first
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/accounts`);
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      // ignore
    }
  };

  const fetchEntries = async () => {
    // Require account selection first
    if (!accountId) {
      setError('Please select an account to view journal entries');
      setEntries([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (accountId) params.append('account_id', accountId);
      if (reference) params.append('reference', reference);
      if (description) params.append('description', description);
      const res = await axios.get(`${API_BASE_URL}/financial/journal-entries?${params}`);
      if (res.data.success) {
        setEntries(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch journal entries');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setAccountId('');
    setReference('');
    setDescription('');
    setEntries([]);
    setError('Please select an account to view journal entries');
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8l mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <button
            onClick={fetchEntries}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
        <form onSubmit={handleFilter} className="bg-white rounded-lg shadow p-6 mb-6 flex flex-col md:flex-row md:items-end md:space-x-6 space-y-4 md:space-y-0">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={accountId}
              onChange={e => {
                setAccountId(e.target.value);
                if (e.target.value) {
                  // Automatically fetch entries when account is selected
                  setTimeout(() => fetchEntries(), 100);
                } else {
                  setEntries([]);
                  setError('Please select an account to view journal entries');
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an Account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.account_name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reference"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description"
            />
          </div>
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-end md:space-x-2">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Search className="w-4 h-4 mr-2" />
              Clear
            </button>
          </div>
        </form>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !accountId ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-8 rounded-lg text-center">
            <div className="text-lg font-medium mb-2">Select an Account</div>
            <p className="text-sm">Please select an account from the dropdown above to view journal entries for that account.</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr key={entry.line_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.entry_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.entry_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.reference}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.account_code} - {entry.account_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.line_description || entry.journal_description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">{entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">{entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No journal entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntriesPage; 