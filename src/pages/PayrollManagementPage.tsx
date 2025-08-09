import React, { useEffect, useMemo, useState } from 'react';
import { API_CONFIG } from '../config/api';
import { SearchIcon, FilterIcon, UsersIcon, WalletIcon, CalendarIcon } from 'lucide-react';

interface StaffItem {
  id: number;
  name: string;
  role?: string;
  salary?: number | null;
}

const API_BASE = API_CONFIG.getUrl('/payroll');

const PayrollManagementPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Reserved for future inline salary edits; disable to avoid unused warnings
  // const [salaryEdits, setSalaryEdits] = useState<{ [id: number]: string }>({});
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [runPayrollLoading, setRunPayrollLoading] = useState(false);
  const [runPayrollResult, setRunPayrollResult] = useState<any>(null);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [overrideSalaries, setOverrideSalaries] = useState<{ [id: number]: string }>({});
  const [notes, setNotes] = useState('');
  const [showHistoryStaffId, setShowHistoryStaffId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [allHistoryLoading, setAllHistoryLoading] = useState(false);
  const [allHistoryData, setAllHistoryData] = useState<any[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<string>('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = API_CONFIG.getUrl('/staff/staff');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const normalized: StaffItem[] = (Array.isArray(data) ? data : []).map((s: any) => ({
          id: Number(s.id),
          name: s.name,
          role: s.role,
          salary: s.salary !== undefined && s.salary !== null ? Number(s.salary) : null,
        }));
        setStaff(normalized);
        // Inline salary edits initialization omitted for now
      } catch (err: any) {
        setError('Failed to fetch staff');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  // Fetch payment accounts
  useEffect(() => {
    const fetchPaymentAccounts = async () => {
      try {
        const res = await fetch(`${API_BASE}/payment-accounts`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const json = await res.json();
        if (json.success) {
          setPaymentAccounts(json.data || []);
          // Set default payment account if available
          if (json.data && json.data.length > 0) {
            setSelectedPaymentAccount(String(json.data[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment accounts:', err);
      }
    };
    fetchPaymentAccounts();
  }, []);

  // Fetch payroll history for a staff member
  const fetchHistory = async (staffId: number) => {
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const res = await fetch(`${API_BASE}/history?staff_id=${staffId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      setHistoryData(json.data || []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch all payroll history
  const fetchAllHistory = async () => {
    setAllHistoryLoading(true);
    setAllHistoryData([]);
    try {
      const res = await fetch(`${API_BASE}/history`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      setAllHistoryData(json.data || []);
    } catch {
      setAllHistoryData([]);
    } finally {
      setAllHistoryLoading(false);
    }
  };

  // Handle Run Payroll
  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunPayrollLoading(true);
    setRunPayrollResult(null);
    try {
      const body: any = {
        pay_date: payDate,
        notes,
      };
      if (selectedStaffIds.length > 0) body.staff_ids = selectedStaffIds;
      // Only send overrides for staff with a value
      const overrides: { [id: number]: number } = {};
      Object.entries(overrideSalaries).forEach(([id, val]) => {
        if (val && !isNaN(Number(val))) overrides[Number(id)] = Number(val);
      });
      if (Object.keys(overrides).length > 0) body.overrides = overrides;
      if (selectedPaymentAccount) body.payment_account_id = Number(selectedPaymentAccount);
      const res = await fetch(`${API_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setRunPayrollResult(json);
      if (json.success) {
        setShowRunPayroll(false);
        fetchAllHistory();
      }
    } catch (err) {
      setRunPayrollResult({ success: false, error: 'Failed to run payroll' });
    } finally {
      setRunPayrollLoading(false);
    }
  };

  // Example deduction functions (Kenya context, adjust as needed)
  function calculatePAYE(gross: number): number {
    // Simple tiered example, replace with actual tax bands
    if (gross <= 24000) return 0;
    if (gross <= 32333) return (gross - 24000) * 0.25;
    return (8333 * 0.25) + (gross - 32333) * 0.3;
  }

  function calculateNSSF(gross: number): number {
    // Flat rate or percentage, adjust as per law
    return Math.min(gross * 0.06, 1080); // Example: 6% capped at 1080
  }

  function calculateNHIF(gross: number): number {
    // Example: flat bands, replace with actual NHIF bands
    if (gross < 6000) return 150;
    if (gross < 8000) return 300;
    if (gross < 12000) return 400;
    return 500;
  }

  function calculateDeductions(gross: number) {
    const paye = calculatePAYE(gross);
    const nssf = calculateNSSF(gross);
    const nhif = calculateNHIF(gross);
    const total = paye + nssf + nhif;
    return { paye, nssf, nhif, total, net: gross - total };
  }

  // Filtering and pagination
  const filteredStaff = useMemo(() => {
    let list = staff;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q));
    }
    if (roleFilter) list = list.filter(s => (s.role || '') === roleFilter);
    return list;
  }, [staff, search, roleFilter]);

  const roles = useMemo(() => {
    return Array.from(new Set(staff.map(s => s.role).filter(Boolean))) as string[];
  }, [staff]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // KPI summaries
  const totalEmployees = filteredStaff.length;
  const estimatedNetMonthly = filteredStaff.reduce((sum, s) => {
    const gross = s.salary ? Number(s.salary) : 0;
    const { net } = calculateDeductions(gross);
    return sum + net;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage staff salaries, run payroll, and review history</p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            onClick={() => setShowRunPayroll(true)}
          >
            Run Payroll
          </button>
          <button
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            onClick={() => { setShowAllHistory(true); fetchAllHistory(); }}
          >
            View History
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Employees</div>
            <div className="text-xl font-semibold text-gray-900">{totalEmployees}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
            <WalletIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Est. Net Monthly</div>
            <div className="text-xl font-semibold text-gray-900">{estimatedNetMonthly.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or role"
              className="pl-9 pr-3 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <FilterIcon className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All roles</option>
                {roles.map(r => (
                  <option key={r} value={r || ''}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-gray-500">Rows</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-2 text-sm"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Payroll Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Salary</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="text-center text-red-600 py-4">{error}</td></tr>
            ) : filteredStaff.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4">No staff found</td></tr>
            ) : pageItems.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.role}</td>
                <td className="px-4 py-2">{s.salary !== undefined && s.salary !== null ? Number(s.salary).toLocaleString('en-US', { minimumFractionDigits: 2 }) : <span className="text-gray-400">N/A</span>}</td>
                <td className="px-4 py-2">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => { setShowHistoryStaffId(s.id); fetchHistory(s.id); }}
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="text-gray-600">Page {currentPage} of {totalPages}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border border-gray-200 rounded-lg bg-white disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border border-gray-2 00 rounded-lg bg-white disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Run Payroll Modal */}
      {showRunPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative border border-gray-200">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowRunPayroll(false)}>&times;</button>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Run Payroll</h2>
            </div>
            <form onSubmit={handleRunPayroll}>
              <div className="mb-4">
                <label className="block font-medium mb-1">Pay Date</label>
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="border rounded px-2 py-1" required />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Select Staff (optional)</label>
                <select
                  multiple
                  value={selectedStaffIds.map(String)}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
                    setSelectedStaffIds(options);
                  }}
                  className="border rounded px-2 py-1 w-full h-24"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">Leave empty to run for all staff</div>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Override Salaries (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id)).map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="w-32 truncate">{s.name}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={s.salary !== undefined && s.salary !== null ? Number(s.salary).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                        value={overrideSalaries[s.id] || ''}
                        onChange={e => setOverrideSalaries({ ...overrideSalaries, [s.id]: e.target.value })}
                        className="border rounded px-2 py-1 w-24"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Payment Account</label>
                <select
                  value={selectedPaymentAccount}
                  onChange={e => setSelectedPaymentAccount(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  required
                >
                  <option value="">Select Payment Account</option>
                  {paymentAccounts.map(pa => (
                    <option key={pa.id} value={pa.id}>
                      {pa.account_code} - {pa.account_name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">Select the account to pay wages from.</div>
              </div>
              {/* Deductions Preview Table */}
              <div className="mb-4">
                <label className="block font-medium mb-1">Deductions Preview</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-200 rounded">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 border-b">Name</th>
                        <th className="px-2 py-1 border-b">Gross</th>
                        <th className="px-2 py-1 border-b">PAYE</th>
                        <th className="px-2 py-1 border-b">NSSF</th>
                        <th className="px-2 py-1 border-b">NHIF</th>
                        <th className="px-2 py-1 border-b">Total Deductions</th>
                        <th className="px-2 py-1 border-b">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id)).map(s => {
                        const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                        const ded = calculateDeductions(gross);
                        return (
                          <tr key={s.id}>
                            <td className="px-2 py-1">{s.name}</td>
                            <td className="px-2 py-1">{gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-2 py-1">{ded.paye.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-2 py-1">{ded.nssf.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-2 py-1">{ded.nhif.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-2 py-1">{ded.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-2 py-1 font-semibold">{ded.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border rounded px-2 py-1 w-full" rows={2} />
              </div>
              <div className="flex gap-4 items-center">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={runPayrollLoading}>
                  {runPayrollLoading ? 'Processing...' : 'Run Payroll'}
                </button>
                {runPayrollResult && (
                  <span className={runPayrollResult.success ? 'text-green-600' : 'text-red-600'}>
                    {runPayrollResult.success ? runPayrollResult.message : runPayrollResult.error}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Payroll History Modal */}
      {showHistoryStaffId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowHistoryStaffId(null)}>&times;</button>
            <h2 className="text-xl font-semibold mb-4">Payroll History</h2>
            {historyLoading ? (
              <div>Loading...</div>
            ) : historyData.length === 0 ? (
              <div className="text-gray-500">No payroll history found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Pay Date</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((h: any) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2">{h.pay_date}</td>
                      <td className="px-4 py-2">{Number(h.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2">{h.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* All Payroll History Modal */}
      {showAllHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowAllHistory(false)}>&times;</button>
            <h2 className="text-xl font-semibold mb-4">All Payroll History</h2>
            {allHistoryLoading ? (
              <div>Loading...</div>
            ) : allHistoryData.length === 0 ? (
              <div className="text-gray-500">No payroll history found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Pay Date</th>
                    <th className="px-4 py-2 text-left">Staff</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allHistoryData.map((h: any) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2">{h.pay_date}</td>
                      <td className="px-4 py-2">{h.staff_name}</td>
                      <td className="px-4 py-2">{h.role}</td>
                      <td className="px-4 py-2">{Number(h.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2">{h.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagementPage; 