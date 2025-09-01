import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

interface ExpenseSummary {
  id: number;
  journal_entry_id: number;
  supplier_id: number;
  amount: number;
  created_at: string;
  supplier_name: string;
  entry_date: string;
  reference: string;
  description: string;
  total_items?: number;
}

interface Supplier {
  id: number;
  company_name: string;
}

interface JournalEntry {
  id: number;
  entry_date: string;
  reference: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_at: string;
  journal_entry_lines: JournalEntryLine[];
}

interface JournalEntryLine {
  id: number;
  account_id: number;
  account_name: string;
  account_code: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'mobile_money';
interface CashAccount { id: number; account_name: string; account_code: string; }

const ExpenseSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseSummary[]>([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  const [loadingJournal, setLoadingJournal] = useState(false);
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentExpense, setPaymentExpense] = useState<ExpenseSummary | null>(null);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAccountId, setPaymentAccountId] = useState<number | ''>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchSuppliers();
    fetchCashAccounts();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, startDate, endDate, selectedSupplier]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/financial/expense-summary');
      console.log('API Response:', response.data);
      console.log('First expense amount:', response.data.data[0]?.amount);
      setExpenses(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/financial/suppliers');
      setSuppliers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchCashAccounts = async () => {
    try {
      const response = await axios.get('/api/financial/cash-equivalents/accounts');
      setCashAccounts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching cash accounts:', err);
    }
  };

  const fetchJournalEntry = async (journalEntryId: number) => {
    try {
      setLoadingJournal(true);
      const response = await axios.get(`/api/financial/journal-entries/${journalEntryId}`);
      setSelectedJournalEntry(response.data.data);
      setShowJournalModal(true);
    } catch (err) {
      console.error('Error fetching journal entry:', err);
      alert('Failed to fetch journal entry details');
    } finally {
      setLoadingJournal(false);
    }
  };

  const closeJournalModal = () => {
    setShowJournalModal(false);
    setSelectedJournalEntry(null);
  };

  const handleExpenseClick = (journalEntryId: number) => {
    navigate(`/expense-invoice/${journalEntryId}`);
  };

  const openPaymentModal = (expense: ExpenseSummary) => {
    setPaymentExpense(expense);
    setPaymentDate(new Date(expense.entry_date).toISOString().slice(0,10));
    setPaymentMethod('cash');
    setPaymentAccountId('');
    setPaymentAmount(String(expense.amount || ''));
    setPaymentReference(expense.reference || '');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentExpense(null);
  };

  const submitPayment = async () => {
    if (!paymentExpense) return;
    if (!paymentDate || !paymentMethod || !paymentAccountId || !paymentAmount) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setSubmittingPayment(true);
      await axios.post(`/api/financial/expenses/${paymentExpense.journal_entry_id}/payments`, {
        expense_detail_id: paymentExpense.id,
        journal_entry_id: paymentExpense.journal_entry_id,
        supplier_id: paymentExpense.supplier_id,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        account_id: paymentAccountId,
        amount: parseFloat(paymentAmount),
        reference: paymentReference,
        notes: paymentNotes,
        currency: 'KES'
      });
      closePaymentModal();
      fetchExpenses();
      alert('Payment recorded');
    } catch (err) {
      console.error('Error recording payment:', err);
      alert('Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (startDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.entry_date) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.entry_date) <= new Date(endDate)
      );
    }

    if (selectedSupplier) {
      filtered = filtered.filter(expense => 
        expense.supplier_id === selectedSupplier
      );
    }

    console.log('Filtered expenses:', filtered);
    
    const totalAmount = filtered.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      console.log(`Adding amount: ${amount} (original: ${expense.amount}, type: ${typeof expense.amount})`);
      return sum + amount;
    }, 0);
    
    console.log('Total amount calculation:', totalAmount);
    
    setFilteredExpenses(filtered);
    setTotalAmount(totalAmount);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedSupplier('');
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Summary</h1>
          <p className="text-gray-600">Overview of all expenses from expense details</p>
        </div>

                 {/* Filters */}
         <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
           <div className="flex flex-wrap gap-4 items-end">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Start Date
               </label>
               <input
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 End Date
               </label>
               <input
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Supplier
               </label>
               <select
                 value={selectedSupplier}
                 onChange={(e) => setSelectedSupplier(e.target.value ? parseInt(e.target.value) : '')}
                 className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
               >
                 <option value="">All Suppliers</option>
                 {suppliers.map((supplier) => (
                   <option key={supplier.id} value={supplier.id}>
                     {supplier.company_name}
                   </option>
                 ))}
               </select>
             </div>
             <button
               onClick={clearFilters}
               className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               Clear Filters
             </button>
           </div>
         </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredExpenses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unique Suppliers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(filteredExpenses.map(e => e.supplier_id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Expense Details</h2>
          </div>
          
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {startDate || endDate ? 'Try adjusting your filters.' : 'No expenses have been recorded yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Journal Entry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr 
                      key={expense.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleExpenseClick(expense.journal_entry_id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.entry_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.reference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.supplier_name || 'Unknown Supplier'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchJournalEntry(expense.journal_entry_id);
          }}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 cursor-pointer"
          disabled={loadingJournal}
        >
          #{expense.journal_entry_id}
        </button>
      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          onClick={(e) => { e.stopPropagation(); openPaymentModal(expense); }}
          className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
        >
          Make Payment
        </button>
      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                     )}
         </div>
       </div>

       {/* Journal Entry Modal */}
       {showJournalModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
               {/* Header */}
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-gray-900">
                   Journal Entry Details
                 </h3>
                 <button
                   onClick={closeJournalModal}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {loadingJournal ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                   <p className="mt-2 text-gray-600">Loading journal entry details...</p>
                 </div>
               ) : selectedJournalEntry ? (
                 <div className="space-y-6">
                   {/* Journal Entry Header */}
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div>
                         <p className="text-sm font-medium text-gray-500">Entry ID</p>
                         <p className="text-sm text-gray-900">#{selectedJournalEntry.id}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-gray-500">Date</p>
                         <p className="text-sm text-gray-900">{formatDate(selectedJournalEntry.entry_date)}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-gray-500">Reference</p>
                         <p className="text-sm text-gray-900">{selectedJournalEntry.reference}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-gray-500">Status</p>
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           selectedJournalEntry.status === 'confirmed' 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {selectedJournalEntry.status}
                         </span>
                       </div>
                     </div>
                     {selectedJournalEntry.description && (
                       <div className="mt-3">
                         <p className="text-sm font-medium text-gray-500">Description</p>
                         <p className="text-sm text-gray-900">{selectedJournalEntry.description}</p>
                       </div>
                     )}
                   </div>

                   {/* Journal Entry Lines */}
                   <div>
                     <h4 className="text-md font-medium text-gray-900 mb-3">Journal Entry Lines</h4>
                     <div className="overflow-x-auto">
                       <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                           <tr>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                               Account
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                               Account Code
                             </th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                               Description
                             </th>
                             <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                               Debit
                             </th>
                             <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                               Credit
                             </th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {selectedJournalEntry.journal_entry_lines.map((line) => (
                             <tr key={line.id} className="hover:bg-gray-50">
                               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                 {line.account_name}
                               </td>
                               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                 {line.account_code}
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                 {line.description || '-'}
                               </td>
                               <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                 {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : '-'}
                               </td>
                               <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                 {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : '-'}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                         <tfoot className="bg-gray-50">
                           <tr>
                             <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                               Total:
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                               {formatCurrency(selectedJournalEntry.total_debit)}
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                               {formatCurrency(selectedJournalEntry.total_credit)}
                             </td>
                           </tr>
                         </tfoot>
                       </table>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <p className="text-gray-600">No journal entry details found.</p>
                 </div>
               )}

               {/* Footer */}
               <div className="flex justify-end mt-6">
                 <button
                   onClick={closeJournalModal}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
      {showPaymentModal && paymentExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Make Payment</h3>
                <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Supplier</p>
                    <p className="text-gray-900">{paymentExpense.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reference</p>
                    <p className="text-gray-900">{paymentExpense.reference || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Journal Entry</p>
                    <p className="text-gray-900">#{paymentExpense.journal_entry_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="text-gray-900">{formatCurrency(paymentExpense.amount)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Account</label>
                    <select value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select account</option>
                      {cashAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.account_code})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                    <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={closePaymentModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={submitPayment} disabled={submittingPayment} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-60">
                  {submittingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 };

export default ExpenseSummaryPage;
