import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type LedgerEntry = {
  id: number;
  date: string;
  description: string;
  reference_type: string;
  reference_id: number;
  debit: number;
  credit: number;
  running_balance: number;
};

const formatCurrency = (n: number) => (n || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' });
const formatDate = (d: string) => new Date(d).toLocaleDateString();

const SupplierLedgerPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (query.trim()) params.append('q', query.trim());
        params.append('page', String(page));
        params.append('limit', String(limit));
        const url = API_CONFIG.getUrl(`/financial/suppliers/${supplierId}/ledger`) + (params.toString() ? `?${params.toString()}` : '');
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
        setSupplier(data.data.supplier);
        setEntries(data.data.entries || []);
        if (data.data.pagination) {
          setTotal(data.data.pagination.total);
          setTotalPages(data.data.pagination.total_pages);
        } else {
          setTotal((data.data.entries || []).length);
          setTotalPages(1);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load supplier ledger');
      } finally {
        setLoading(false);
      }
    };
    if (supplierId) load();
  }, [supplierId, startDate, endDate, query, page, limit]);

  const summary = useMemo(() => {
    const totalDebit = entries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    const balance = entries.length ? entries[entries.length - 1].running_balance : totalCredit - totalDebit;
    return { totalDebit, totalCredit, balance };
  }, [entries]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Ledger</h1>
            <p className="text-gray-600">{supplier ? supplier.company_name : 'Loading supplier...'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!tableRef.current) return;
                const canvas = await html2canvas(tableRef.current, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pageWidth * 0.95;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                const xOffset = (pageWidth - pdfWidth) / 2;
                pdf.addImage(imgData, 'PNG', xOffset, 20, pdfWidth, pdfHeight);
                pdf.save(`supplier_ledger_${supplierId}.pdf`);
              }}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-900 text-sm"
            >
              Export PDF
            </button>
            <button
              onClick={async () => {
                // fetch all pages with current filters
                const all: LedgerEntry[] = [];
                let cur = 1;
                let pages = 1;
                do {
                  const params = new URLSearchParams();
                  if (startDate) params.append('start_date', startDate);
                  if (endDate) params.append('end_date', endDate);
                  if (query.trim()) params.append('q', query.trim());
                  params.append('page', String(cur));
                  params.append('limit', '200');
                  const url = API_CONFIG.getUrl(`/financial/suppliers/${supplierId}/ledger`) + `?${params.toString()}`;
                  const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                  const data = await res.json();
                  if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
                  all.push(...(data.data.entries || []));
                  pages = data.data.pagination?.total_pages || 1;
                  cur += 1;
                } while (cur <= pages);

                const headers = ['Date', 'Description', 'Reference Type', 'Reference ID', 'Debit', 'Credit', 'Running Balance'];
                const rows = all.map(e => [
                  new Date(e.date).toISOString().slice(0,10),
                  (e.description || '').replace(/\n|\r/g, ' ').trim(),
                  e.reference_type || '',
                  String(e.reference_id || ''),
                  String(e.debit || 0),
                  String(e.credit || 0),
                  String(e.running_balance || 0)
                ]);
                const csvEscape = (s: string) => (s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s);
                const metaRows: string[][] = [
                  ['Supplier ID', String((supplier && supplier.id) || supplierId || '')],
                  ['Company', String((supplier && supplier.company_name) || '')],
                  ['Contact Person', String((supplier && supplier.contact_person) || '')],
                  ['Email', String((supplier && supplier.email) || '')],
                  ['Phone', String((supplier && supplier.phone) || '')],
                  ['Tax PIN', String((supplier && supplier.tax_id) || '')],
                  ['Address', String((supplier && supplier.address) || '')],
                  ['Date Range', `${startDate || 'All'} to ${endDate || 'All'}`],
                  ['Search', query || ''],
                  ['Generated At', new Date().toISOString()],
                ];
                const csv = [
                  ...metaRows.map(r => r.map(v => csvEscape(String(v))).join(',')),
                  '',
                  headers.map(csvEscape).join(','),
                  ...rows.map(r => r.map(v => csvEscape(String(v))).join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `supplier_ledger_${supplierId}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
            >
              Export CSV
            </button>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                type="text"
                placeholder="Search description or ref..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm w-56"
              />
              {(startDate || endDate || query) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setQuery(''); }}
                  className="ml-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
              )}
            </div>
            <Link to="/suppliers" className="text-blue-600 hover:underline">Back to Suppliers</Link>
          </div>
        </div>

        {loading ? (
          <div className="p-6 bg-white border border-gray-200 rounded-lg">Loading...</div>
        ) : error ? (
          <div className="p-6 bg-white border border-red-200 rounded-lg text-red-700">{error}</div>
        ) : (
          <>
            <div ref={tableRef}>
            {/* Supplier Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Company</p>
                <p className="text-lg font-semibold text-gray-900">{supplier.company_name}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Contact</p>
                <p className="text-lg font-semibold text-gray-900">{supplier.contact_person || '-'}</p>
                <p className="text-sm text-gray-600">{supplier.email || '-'}</p>
                <p className="text-sm text-gray-600">{supplier.phone || '-'}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Tax / Address</p>
                <p className="text-sm text-gray-700">PIN: {supplier.tax_id || '-'}</p>
                <p className="text-sm text-gray-700 break-words">{supplier.address || '-'}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Debit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalDebit)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Credit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalCredit)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.balance)}</p>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No ledger entries</td>
                      </tr>
                    ) : (
                      entries.map((e) => (
                        <tr key={e.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatDate(e.date)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{e.description}</td>
                          <td className={`px-4 py-2 text-sm text-right ${Number(e.debit) > 0 ? 'text-green-600 font-medium' : 'text-gray-900'}`}>{formatCurrency(Number(e.debit || 0))}</td>
                          <td className={`px-4 py-2 text-sm text-right ${Number(e.credit) > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>{formatCurrency(Number(e.credit || 0))}</td>
                          <td className={`px-4 py-2 text-sm text-right font-semibold ${Number(e.running_balance) < 0 ? 'text-red-700' : Number(e.running_balance) > 0 ? 'text-blue-700' : 'text-gray-900'}`}>{formatCurrency(Number(e.running_balance || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls */}
              <div className="flex items-center justify-between p-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages} • {total} entries
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={limit}
                    onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierLedgerPage;

