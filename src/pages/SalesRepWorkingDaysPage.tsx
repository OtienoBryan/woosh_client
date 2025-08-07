import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { salesService, SalesRep, Country } from '../services/salesService';
import { saveAs } from 'file-saver';
import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Filter, Download, BarChart3, Activity, Clock, UserCheck, UserX, FileText } from 'lucide-react';

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

interface RepStats {
  rep: SalesRep;
  present: number;
  leave: number;
  absent: number;
  attendance: string;
  totalWorkingDays: number;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const SalesRepWorkingDaysPage: React.FC = () => {
  // Use current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(year, month, 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(year, month + 1, 0);
    return d.toISOString().slice(0, 10);
  });

  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('Kenya'); // Default to Kenya
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('1'); // Default to Active
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [pendingCountry, setPendingCountry] = useState(selectedCountry);
  const [pendingRep, setPendingRep] = useState(selectedRep);
  const [pendingStatus, setPendingStatus] = useState(selectedStatus);
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);

  // Data fetching
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    console.log('SalesRepWorkingDaysPage: Starting data fetch...');
    
    Promise.all([
      salesService.getAllSalesReps(),
      axios.get(`${API_BASE_URL}/login-history`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/sales-rep-leaves/sales-rep-leaves`, { headers: getAuthHeaders() }),
      salesService.getCountries(),
    ])
      .then(([repsRes, loginRes, leavesRes, countriesRes]) => {
        console.log('SalesRepWorkingDaysPage: Data fetch successful');
        console.log('Sales reps count:', repsRes?.length || 0);
        console.log('Login history count:', loginRes.data?.length || 0);
        console.log('Leaves count:', leavesRes.data?.length || 0);
        console.log('Countries count:', countriesRes?.length || 0);
        
        setSalesReps(repsRes || []);
        setLoginHistory(loginRes.data || []);
        setLeaves(leavesRes.data || []);
        setCountries(countriesRes || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sales rep working days data:', error);
        setError(`Failed to fetch data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        setLoading(false);
      });
  }, []);

  // Helper: get all working days in range as string yyyy-mm-dd, excluding Sundays
  const getWorkingDaysInRange = () => {
    const days: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) {
        days.push(d.toISOString().slice(0, 10));
      }
    }
    return days;
  };

  const workingDays = getWorkingDaysInRange();
  const numWorkingDays = workingDays.length;
  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);

  const filteredSalesReps = salesReps.filter(rep => {
    // Filter by country
    if (selectedCountry && rep.country !== selectedCountry) return false;
    
    // Filter by status
    if (selectedStatus) {
      const statusValue = parseInt(selectedStatus);
      if (rep.status !== statusValue) return false;
    }
    
    return true;
  });

  // Calculate stats for each sales rep
  const repStats: RepStats[] = useMemo(() => {
    return filteredSalesReps.map(rep => {
      // Days present: unique loginAt dates in range (excluding Sundays)
      const presentDays = new Set(
        loginHistory
          .filter(lh => lh.userId === rep.id &&
            lh.sessionStart &&
            new Date(lh.sessionStart) >= rangeStart && new Date(lh.sessionStart) <= rangeEnd &&
            new Date(lh.sessionStart).getDay() !== 0)
          .map(lh => lh.sessionStart.slice(0, 10))
      );
      
      // Leave days: sum of working days in range covered by approved leaves
      const repLeaves = leaves.filter(lv => String(lv.userId) === String(rep.id) && (lv.status === 1 || lv.status === '1'));
      let leaveDays = 0;
      repLeaves.forEach(lv => {
        const leaveStart = new Date(lv.startDate) < rangeStart ? rangeStart : new Date(lv.startDate);
        const leaveEnd = new Date(lv.endDate) > rangeEnd ? rangeEnd : new Date(lv.endDate);
        for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0 && d >= rangeStart && d <= rangeEnd) {
            leaveDays++;
          }
        }
      });
      
      // Days absent: total working days - present - leave
      const daysAbsent = numWorkingDays - presentDays.size - leaveDays;
      const denominator = numWorkingDays - leaveDays;
      const attendance = denominator > 0 ? ((presentDays.size / denominator) * 100).toFixed(1) : 'N/A';
      
      return {
        rep,
        present: presentDays.size,
        leave: leaveDays,
        absent: daysAbsent < 0 ? 0 : daysAbsent,
        attendance,
        totalWorkingDays: numWorkingDays
      };
    });
  }, [filteredSalesReps, loginHistory, leaves, numWorkingDays, rangeStart, rangeEnd]);

  const sortedRepStats = [...repStats].sort((a, b) => {
    if (a.attendance === 'N/A' && b.attendance === 'N/A') return 0;
    if (a.attendance === 'N/A') return 1;
    if (b.attendance === 'N/A') return -1;
    return parseFloat(b.attendance) - parseFloat(a.attendance);
  });

  const filteredRepStats = selectedRep
    ? sortedRepStats.filter(stat => String(stat.rep.id) === selectedRep)
    : sortedRepStats;

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalReps = filteredRepStats.length;
    const totalPresent = filteredRepStats.reduce((sum, stat) => sum + stat.present, 0);
    const totalAbsent = filteredRepStats.reduce((sum, stat) => sum + stat.absent, 0);
    const totalLeave = filteredRepStats.reduce((sum, stat) => sum + stat.leave, 0);
    const avgAttendance = filteredRepStats
      .filter(stat => stat.attendance !== 'N/A')
      .reduce((sum, stat) => sum + parseFloat(stat.attendance), 0) / 
      filteredRepStats.filter(stat => stat.attendance !== 'N/A').length;

    return {
      totalReps,
      totalPresent,
      totalAbsent,
      totalLeave,
      avgAttendance: isNaN(avgAttendance) ? 0 : avgAttendance.toFixed(1)
    };
  }, [filteredRepStats]);

  const exportToCSV = () => {
    const dateRangeTitle = `Date Range: ${startDate} to ${endDate}`;
    const headers = [
      'Sales Rep',
      'Country',
      'Days Present',
      'Days Absent',
      'Leave Days',
      '% Attendance'
    ];
    const rows = filteredRepStats.map(stat => [
      stat.rep.name,
      stat.rep.country || 'N/A',
      stat.present,
      stat.absent,
      stat.leave,
      stat.attendance === 'N/A' ? 'N/A' : `${stat.attendance}%`
    ]);
    const csvContent = [
      [dateRangeTitle],
      headers,
      ...rows
    ]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'sales_rep_working_days.csv');
  };

  const openFilterModal = () => {
    setPendingCountry(selectedCountry);
    setPendingRep(selectedRep);
    setPendingStatus(selectedStatus);
    setPendingStartDate(startDate);
    setPendingEndDate(endDate);
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedCountry(pendingCountry);
    setSelectedRep(pendingRep);
    setSelectedStatus(pendingStatus);
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    setPendingCountry('Kenya'); // Reset to Kenya instead of empty
    setPendingRep('');
    setPendingStatus('1'); // Reset to Active instead of empty
    setPendingStartDate(() => {
      const d = new Date(year, month, 1);
      return d.toISOString().slice(0, 10);
    });
    setPendingEndDate(() => {
      const d = new Date(year, month + 1, 0);
      return d.toISOString().slice(0, 10);
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Sales Rep Working Days
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Track attendance, leaves, and performance metrics
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/sales-rep-attendance"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Activity className="h-4 w-4 mr-2" />
                Attendance View
              </Link>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={openFilterModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">Loading working days data...</p>
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
            {/* Date Range Info */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Date Range: {formatDate(startDate)} - {formatDate(endDate)}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {numWorkingDays} working days (excluding Sundays)
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(startDate).split(',')[1]} - {formatDate(endDate).split(',')[1]}
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
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Sales Reps</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.totalReps}</p>
                      <p className="text-xs text-gray-500 mt-1">Active team members</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Present Days</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.totalPresent.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Days worked</p>
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
                      <p className="text-sm font-medium text-gray-600">Total Leave Days</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.totalLeave.toLocaleString()}</p>
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
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">{overallStats.avgAttendance}%</p>
                      <p className="text-xs text-gray-500 mt-1">Team average</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Working Days Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Sales Representative Performance
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Showing {filteredRepStats.length} sales representatives
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
                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Active</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                       <span className="text-xs text-gray-600">Inactive</span>
                     </div>
                   </div>
                </div>
              </div>
              
              <div className="overflow-hidden">
                {filteredRepStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-500">No sales representatives found for the selected filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                                                 <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Sales Representative
                           </th>
                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Country
                           </th>
                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Status
                           </th>
                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Days Present
                           </th>
                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Days Absent
                           </th>
                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Leave Days
                           </th>
                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Attendance %
                           </th>
                           <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Performance
                           </th>
                         </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRepStats.map((stat, index) => {
                          const attendance = parseFloat(stat.attendance);
                          const performanceLevel = stat.attendance === 'N/A' ? 'N/A' : 
                            attendance >= 90 ? 'Excellent' : 
                            attendance >= 75 ? 'Good' : 
                            attendance >= 60 ? 'Fair' : 'Poor';
                          
                          const performanceColor = performanceLevel === 'Excellent' ? 'bg-green-100 text-green-800' :
                            performanceLevel === 'Good' ? 'bg-blue-100 text-blue-800' :
                            performanceLevel === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                            performanceLevel === 'Poor' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800';

                          const attendanceColor = stat.attendance === 'N/A' ? 'text-gray-500' :
                            attendance >= 90 ? 'text-green-600' :
                            attendance >= 75 ? 'text-blue-600' :
                            attendance >= 60 ? 'text-yellow-600' : 'text-red-600';

                          return (
                            <tr key={stat.rep.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-full">
                                      <Users className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{stat.rep.name}</div>
                                    <div className="text-sm text-gray-500">{stat.rep.email}</div>
                                  </div>
                                </div>
                              </td>
                                                             <td className="px-6 py-4 whitespace-nowrap text-center">
                                 <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                   {stat.rep.country || 'N/A'}
                                 </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-center">
                                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                   stat.rep.status === 1 
                                     ? 'bg-green-100 text-green-800' 
                                     : 'bg-red-100 text-red-800'
                                 }`}>
                                   {stat.rep.status === 1 ? 'Active' : 'Inactive'}
                                 </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-center">
                                 <div className="text-sm font-semibold text-green-600">
                                   {stat.present}
                                 </div>
                                 <div className="text-xs text-gray-500">days</div>
                               </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-semibold text-red-600">
                                  {stat.absent}
                                </div>
                                <div className="text-xs text-gray-500">days</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-semibold text-orange-600">
                                  {stat.leave}
                                </div>
                                <div className="text-xs text-gray-500">days</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className={`text-sm font-semibold ${attendanceColor}`}>
                                  {stat.attendance === 'N/A' ? 'N/A' : `${stat.attendance}%`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  of {stat.totalWorkingDays - stat.leave} days
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${performanceColor}`}>
                                  {performanceLevel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Attendance</h4>
                    <p className="text-sm text-gray-500">Daily attendance tracking</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Leave Management</h4>
                    <p className="text-sm text-gray-500">Track approved leaves</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Filter Working Days</h2>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
                         <div className="space-y-6">
               <div>
                 <label htmlFor="countryFilter" className="block text-sm font-medium text-gray-700 mb-2">
                   Country
                 </label>
                 <select
                   id="countryFilter"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                   value={pendingCountry}
                   onChange={e => setPendingCountry(e.target.value)}
                 >
                   <option value="">All Countries</option>
                   {countries.map(c => (
                     <option key={c.id} value={c.name}>{c.name}</option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                   Status
                 </label>
                 <select
                   id="statusFilter"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                   value={pendingStatus}
                   onChange={e => setPendingStatus(e.target.value)}
                 >
                   <option value="">All Statuses</option>
                   <option value="1">Active</option>
                   <option value="0">Inactive</option>
                 </select>
               </div>
               
               <div>
                 <label htmlFor="repFilter" className="block text-sm font-medium text-gray-700 mb-2">
                   Sales Representative
                 </label>
                 <select
                   id="repFilter"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                   value={pendingRep}
                   onChange={e => setPendingRep(e.target.value)}
                 >
                   <option value="">All Sales Reps</option>
                   {filteredSalesReps.map(rep => (
                     <option key={rep.id} value={String(rep.id)}>{rep.name}</option>
                   ))}
                 </select>
               </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={pendingStartDate}
                  onChange={e => setPendingStartDate(e.target.value)}
                  max={pendingEndDate}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={pendingEndDate}
                  onChange={e => setPendingEndDate(e.target.value)}
                  min={pendingStartDate}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                onClick={clearFilters}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRepWorkingDaysPage; 