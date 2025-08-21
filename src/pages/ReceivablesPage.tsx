import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface AgingReceivable {
  customer_id: number;
  client_name: string;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_receivable: number;
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
}

interface Receipt {
  id: number;
  customer_id: number;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  payment_method: string;
  account_id: number;
  reference: string;
  notes: string;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ReceivablesPage: React.FC = () => {
  const [receivables, setReceivables] = useState<AgingReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/receivables/aging`);
      if (res.data.success) {
        // Validate and clean the data
        const validatedData = res.data.data.map((item: any) => ({
          ...item,
          current: Number(item.current) || 0,
          days_1_30: Number(item.days_1_30) || 0,
          days_31_60: Number(item.days_31_60) || 0,
          days_61_90: Number(item.days_61_90) || 0,
          days_90_plus: Number(item.days_90_plus) || 0,
          total_receivable: Number(item.total_receivable) || 0
        }));
        
        console.log('Receivables data:', validatedData);
        setReceivables(validatedData);
      } else {
        setError(res.data.error || 'Failed to fetch receivables');
      }
    } catch (err: any) {
      console.error('Error fetching receivables:', err);
      setError(err.message || 'Failed to fetch receivables');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(amount);

  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-8xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Aging Receivables</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs font-medium text-gray-500">Total Receivables</div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(receivables.reduce((sum, r) => sum + (r.total_receivable || 0), 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs font-medium text-gray-500">Current (0 days)</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(receivables.reduce((sum, r) => sum + (r.current || 0), 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs font-medium text-gray-500">1-30 Days</div>
            <div className="text-lg font-bold text-yellow-600">
              {formatCurrency(receivables.reduce((sum, r) => sum + (r.days_1_30 || 0), 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs font-medium text-gray-500">31-60 Days</div>
            <div className="text-lg font-bold text-orange-600">
              {formatCurrency(receivables.reduce((sum, r) => sum + (r.days_31_60 || 0), 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs font-medium text-gray-500">61-90 Days</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(receivables.reduce((sum, r) => sum + (r.days_61_90 || 0), 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs font-medium text-gray-500">90+ Days</div>
            <div className="text-lg font-bold text-red-700">
              {formatCurrency(receivables.reduce((sum, r) => sum + (r.days_90_plus || 0), 0))}
            </div>
          </div>
          {/* <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs font-medium text-gray-500">Overdue (31+ Days)</div>
            <div className="text-lg font-bold text-red-800">
              {formatCurrency(receivables.reduce((sum, r) => sum + (r.days_31_60 || 0) + (r.days_61_90 || 0) + (r.days_90_plus || 0), 0))}
            </div>
          </div> */}
        </div>
        
       
        {/* No Data Message */}
        {receivables.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Receivables Found</h3>
              <p className="text-gray-500">There are currently no outstanding receivables to display.</p>
            </div>
          </div>
        )}
        
        {/* Receivables Table - Only show if there's data */}
        {receivables.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">1-30 Days</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">31-60 Days</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">61-90 Days</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">90+ Days</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receivables.map((r) => (
                <tr key={r.customer_id} onClick={() => navigate(`/receivables/customer/${r.customer_id}`)} className="cursor-pointer hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.client_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 text-right">{formatCurrency(r.current)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700 bg-yellow-50 text-right">{formatCurrency(r.days_1_30)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-700 bg-orange-50 text-right">{formatCurrency(r.days_31_60)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 bg-red-50 text-right">{formatCurrency(r.days_61_90)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white bg-red-700 text-right">{formatCurrency(r.days_90_plus)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">{formatCurrency(r.total_receivable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default ReceivablesPage; 