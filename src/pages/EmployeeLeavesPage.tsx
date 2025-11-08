import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface LeaveRequest {
  id: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
  attachment_url?: string; // Added attachment_url to the interface
}

const EmployeeLeavesPage: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/leave-requests/employee-leaves');
        setLeaveRequests(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch leave requests');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveRequests();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: number) => {
    try {
      await api.patch(`/leave-requests/${id}/status`, { status: newStatus });
      setLeaveRequests((prev) => prev.map(lr => lr.id === id ? { ...lr, status: String(newStatus) } : lr));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="max-w-8xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Employee Leaves</h1>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-600">{error}</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No leave requests found.</td>
                </tr>
              ) : (
                leaveRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{req.employee_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{req.leave_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{
                      req.start_date ? new Date(req.start_date).toLocaleDateString('en-CA') : ''
                    }</td>
                    <td className="px-6 py-4 whitespace-nowrap">{
                      req.end_date ? new Date(req.end_date).toLocaleDateString('en-CA') : ''
                    }</td>
                    <td className="px-6 py-4 whitespace-nowrap">{
                      req.status === '1' ? 'Approved' : req.status === '2' ? 'Declined' : req.status
                    }</td>
                    <td className="px-6 py-4 whitespace-nowrap">{req.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req.attachment_url ? (
                        <a href={req.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2 disabled:opacity-50"
                        disabled={req.status === '1'}
                        onClick={() => handleUpdateStatus(req.id, 1)}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
                        disabled={req.status === '2'}
                        onClick={() => handleUpdateStatus(req.id, 2)}
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeavesPage; 