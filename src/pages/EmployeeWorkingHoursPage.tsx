import React, { useEffect, useState } from 'react';

interface WorkingHourRecord {
  id: number;
  name: string;
  department: string;
  date: string;
  checkin_time: string | null;
  checkout_time: string | null;
  time_spent: string;
  status: string; // Present, Leave, Absent
}

const EmployeeWorkingHoursPage: React.FC = () => {
  const [records, setRecords] = useState<WorkingHourRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    return firstDay.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    return lastDay.toISOString().slice(0, 10);
  });
  const [staffId, setStaffId] = useState('');
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    // Fetch staff list for filter dropdown
    fetch('/api/staff')
      .then(res => res.json())
      .then(setStaffList)
      .catch(() => setStaffList([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (staffId) params.append('staff_id', staffId);
    fetch(`/api/employee-working-hours?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch working hours');
        return res.json();
      })
      .then(setRecords)
      .catch(err => setError(err.message || 'Failed to fetch working hours'))
      .finally(() => setLoading(false));
  }, [startDate, endDate, staffId]);

  const clearFilters = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    setStartDate(firstDay.toISOString().slice(0, 10));
    setEndDate(lastDay.toISOString().slice(0, 10));
    setStaffId('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Employee Working Hours</h1>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
          <select
            className="border rounded px-2 py-1"
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
          >
            <option value="">All Staff</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Department</th>
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">Check-in</th>
                <th className="px-2 py-1 text-left">Check-out</th>
                <th className="px-2 py-1 text-left">Time Spent</th>
                <th className="px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-2">No records found.</td></tr>
              )}
              {records.map(r => (
                <tr key={`${r.id}-${r.date}`} className="border-t">
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1">{r.department}</td>
                  <td className="px-2 py-1">{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                  <td className="px-2 py-1">{r.checkin_time ? new Date(r.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td className="px-2 py-1">{r.checkout_time ? new Date(r.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td className="px-2 py-1">{r.time_spent}</td>
                  <td className="px-2 py-1">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeWorkingHoursPage; 