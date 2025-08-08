import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { salesService, SalesRep } from '../services/salesService';
import { saveAs } from 'file-saver';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Download, 
  BarChart3, 
  Activity, 
  Clock, 
  UserCheck, 
  UserX, 
  FileText,
  ArrowLeft,
  CalendarDays,
  Target,
  Zap
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios for authentication
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface LoginHistory {
  id: number;
  userId: number;
  sessionStart: string; // ISO datetime
  sessionEnd?: string; // ISO datetime, optional
}

interface Leave {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  status: string | number;
}

interface AttendanceRecord {
  date: string;
  status: string;
  loginTime: string;
  logoutTime: string;
  workingHours: string;
  dayOfWeek: string;
  isWeekend: boolean;
}

const SalesRepAttendancePage: React.FC = () => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Data fetching
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    console.log('SalesRepAttendancePage: Starting data fetch...');
    
    salesService.getAllSalesReps()
      .then((repsRes) => {
        console.log('SalesRepAttendancePage: Sales reps fetch successful');
        console.log('Total sales reps count:', repsRes?.length || 0);
        console.log('Active sales reps count:', repsRes?.filter(rep => rep.status === 1).length || 0);
        setSalesReps(repsRes || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sales reps:', error);
        setError(`Failed to fetch sales reps: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedRep) return;
    setLoading(true);
    setError(null);
    
    console.log('SalesRepAttendancePage: Fetching attendance data for rep:', selectedRep);
    
    Promise.all([
      axios.get(`${API_BASE_URL}/login-history`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/sales-rep-leaves/sales-rep-leaves`, { headers: getAuthHeaders() }),
    ])
      .then(([loginRes, leavesRes]) => {
        console.log('SalesRepAttendancePage: Attendance data fetch successful');
        console.log('Login history count:', loginRes.data?.length || 0);
        console.log('Leaves count:', leavesRes.data?.length || 0);
        
        setLoginHistory(loginRes.data?.filter((l: LoginHistory) => String(l.userId) === selectedRep) || []);
        setLeaves(leavesRes.data?.filter((lv: Leave) => String(lv.userId) === selectedRep && (lv.status === 1 || lv.status === '1')) || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching attendance data:', error);
        setError(`Failed to fetch attendance data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        setLoading(false);
      });
  }, [selectedRep, month]);

  // Get all days in the selected month
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthNum - 1, d);
    days.push(date.toISOString().slice(0, 10));
  }

  // Build attendance records with enhanced data
  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    return days.map(dateStr => {
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = dateObj.getDay() === 0;
      
      // Check for leave
      const onLeave = leaves.some(lv => dateObj >= new Date(lv.startDate) && dateObj <= new Date(lv.endDate));
      // Find login(s) for the day
      const logins = loginHistory.filter(lh => lh.sessionStart && lh.sessionStart.slice(0, 10) === dateStr);
      
      let status = 'Absent';
      let loginTime = '';
      let logoutTime = '';
      let workingHours = '';
      
      if (isWeekend && onLeave) {
        status = 'Weekend (Leave)';
      } else if (isWeekend) {
        status = 'Weekend';
      } else if (onLeave) {
        status = 'Leave';
      } else if (logins.length > 0) {
        status = 'Present';
        // Earliest login, latest logout
        loginTime = logins.map(lh => lh.sessionStart).sort()[0].slice(11, 16);
        if (logins.some(lh => lh.sessionEnd)) {
          logoutTime = logins.map(lh => lh.sessionEnd || '').sort().reverse()[0].slice(11, 16);
          // Calculate working hours if both present
          if (loginTime && logoutTime) {
            const inDate = new Date(`${dateStr}T${loginTime}:00`);
            const outDate = new Date(`${dateStr}T${logoutTime}:00`);
            const diffMs = outDate.getTime() - inDate.getTime();
            if (diffMs > 0) {
              const totalMinutes = Math.floor(diffMs / (1000 * 60));
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              workingHours = `${hours}h ${minutes}m`;
            }
          }
        }
      }
      
      return { 
        date: dateStr, 
        status, 
        loginTime, 
        logoutTime, 
        workingHours,
        dayOfWeek,
        isWeekend
      };
    });
  }, [days, leaves, loginHistory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPresent = attendanceRecords.filter(r => r.status === 'Present').length;
    const totalAbsent = attendanceRecords.filter(r => r.status === 'Absent').length;
    const totalLeave = attendanceRecords.filter(r => r.status === 'Leave' || r.status === 'Weekend (Leave)').length;
    const totalWeekend = attendanceRecords.filter(r => r.status === 'Weekend').length;
    const totalWorking = attendanceRecords.filter(r => !r.isWeekend).length;
    const attendancePct = totalWorking - totalLeave > 0 ? ((totalPresent / (totalWorking - totalLeave)) * 100).toFixed(1) : 'N/A';
    
    // Calculate average working hours for present days
    const presentDays = attendanceRecords.filter(r => r.status === 'Present' && r.workingHours);
    const totalWorkingMinutes = presentDays.reduce((sum, day) => {
      const [hours, minutes] = day.workingHours.split('h ').map(part => parseInt(part.replace('m', '')));
      return sum + (hours * 60 + minutes);
    }, 0);
    const avgWorkingHours = presentDays.length > 0 ? (totalWorkingMinutes / presentDays.length / 60).toFixed(1) : '0';
    
    return {
      totalPresent,
      totalAbsent,
      totalLeave,
      totalWeekend,
      totalWorking,
      attendancePct,
      avgWorkingHours
    };
  }, [attendanceRecords]);

  const exportToCSV = () => {
    const selectedRepName = salesReps.find(rep => String(rep.id) === selectedRep)?.name || 'Unknown';
    const dateRangeTitle = `Sales Rep: ${selectedRepName} - Date Range: ${month}-01 to ${month}-${String(daysInMonth).padStart(2, '0')}`;
    const headers = [
      'Date',
      'Day',
      'Status',
      'Login Time',
      'Logout Time',
      'Working Hours'
    ];
    const rows = attendanceRecords.map(rec => [
      rec.date,
      rec.dayOfWeek,
      rec.status,
      rec.loginTime,
      rec.logoutTime,
      rec.workingHours
    ]);
    const csvContent = [
      [dateRangeTitle],
      headers,
      ...rows
    ]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `sales_rep_attendance_${selectedRepName}_${month}.csv`);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get selected rep details
  const selectedRepDetails = salesReps.find(rep => String(rep.id) === selectedRep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Sales Rep Attendance
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Track individual sales representative attendance and working hours
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/sales-rep-working-days"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Working Days
              </Link>
              <button
                onClick={exportToCSV}
                disabled={!selectedRep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !selectedRep ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">Loading sales representatives...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we fetch the latest information</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <div className="text-red-600 text-2xl">⚠️</div>
            </div>
            <h3 className="mt-6 text-lg font-medium text-red-900">Error Loading Data</h3>
            <p className="mt-2 text-red-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Selection Controls */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div>
                    <label htmlFor="repSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      Sales Representative
                    </label>
                    <select
                      id="repSelect"
                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      value={selectedRep}
                      onChange={e => setSelectedRep(e.target.value)}
                    >
                      <option value="">Select Sales Rep</option>
                      {salesReps
                        .filter(rep => rep.status === 1) // Only show active sales reps
                        .map(rep => (
                          <option key={rep.id} value={String(rep.id)}>{rep.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="monthSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <input
                      id="monthSelect"
                      type="month"
                      className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      value={month}
                      onChange={e => setMonth(e.target.value)}
                    />
                  </div>
                </div>
                {selectedRepDetails && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedRepDetails.name}</p>
                      <p className="text-xs text-gray-500">{selectedRepDetails.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!selectedRep ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">👤</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Active Sales Representative</h3>
                <p className="text-gray-500">Choose an active sales rep from the dropdown above to view their attendance details.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">Loading attendance data...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we fetch the attendance information</p>
              </div>
            ) : (
              <>
                {/* Month Info */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(`${month}-01`).split(',')[1]} - {formatDate(`${month}-${String(daysInMonth).padStart(2, '0')}`).split(',')[1]}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {daysInMonth} days in {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        {stats.totalWorking} working days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
                            <UserCheck className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">Days Present</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalPresent}</p>
                          <p className="text-xs text-gray-500 mt-1">Working days attended</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-lg">
                            <UserX className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">Days Absent</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalAbsent}</p>
                          <p className="text-xs text-gray-500 mt-1">Working days missed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-lg">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">Leave Days</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalLeave}</p>
                          <p className="text-xs text-gray-500 mt-1">Approved leaves</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg">
                            <Target className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.attendancePct === 'N/A' ? 'N/A' : `${stats.attendancePct}%`}</p>
                          <p className="text-xs text-gray-500 mt-1">Overall performance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Attendance Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Daily Attendance Records
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Detailed attendance for {selectedRepDetails?.name}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">Present</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">Leave</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">Absent</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="text-xs text-gray-600">Weekend</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Day
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Login Time
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Logout Time
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Working Hours
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendanceRecords.map((rec, index) => {
                            const statusColor = rec.status === 'Present' ? 'bg-green-100 text-green-800' :
                              rec.status === 'Leave' || rec.status === 'Weekend (Leave)' ? 'bg-orange-100 text-orange-800' :
                              rec.status === 'Absent' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800';

                            return (
                              <tr key={rec.date} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{rec.date}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    rec.isWeekend ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {rec.dayOfWeek}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="text-sm text-gray-900">{rec.loginTime || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="text-sm text-gray-900">{rec.logoutTime || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="text-sm font-semibold text-gray-900">{rec.workingHours || '-'}</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">Analytics</h4>
                        <p className="text-sm text-gray-500">View detailed performance metrics</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">Working Hours</h4>
                        <p className="text-sm text-gray-500">Track time spent on field</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Zap className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">Performance</h4>
                        <p className="text-sm text-gray-500">Monitor attendance trends</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesRepAttendancePage; 