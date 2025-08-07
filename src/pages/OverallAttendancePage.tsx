import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { salesService, Country, SalesRep } from '../services/salesService';
import { Calendar, Users, MapPin, TrendingUp, Filter, Download, BarChart3, Activity } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios for authentication
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface LoginHistory {
  id: number;
  userId: number;
  sessionStart: string;
  sessionEnd?: string;
}

interface JourneyPlan {
  id: number;
  userId: number;
  clientId: number;
  date: string; // yyyy-mm-dd
  checkinTime?: string;
  checkInTime?: string;
  startTime?: string;
  checkoutTime?: string;
  checkOutTime?: string;
  endTime?: string;
}

interface Client {
  id: number;
  name: string;
  checkinTime?: string;
  checkoutTime?: string;
}

interface AttendanceRow {
  date: string;
  clientsVisited: number;
  activeSalesReps: number;
}

interface DashboardStats {
  totalActiveDays: number;
  totalClientsVisited: number;
  totalActiveSalesReps: number;
  averageAttendanceRate: number;
}

const OverallAttendancePage: React.FC = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const defaultStart = new Date(year, month, 1).toISOString().slice(0, 10);
  const defaultEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [journeyPlans, setJourneyPlans] = useState<JourneyPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [pendingCountry, setPendingCountry] = useState('');
  const [pendingStartDate, setPendingStartDate] = useState(defaultStart);
  const [pendingEndDate, setPendingEndDate] = useState(defaultEnd);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [salesRepsModalOpen, setSalesRepsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeSalesRepsForDate, setActiveSalesRepsForDate] = useState<(SalesRep & { sessionStart: string; sessionEnd?: string })[]>([]);
  const [modalCountryFilter, setModalCountryFilter] = useState<string>('');
  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [clientsForDate, setClientsForDate] = useState<Client[]>([]);

  // Data fetching
  useEffect(() => {
    setLoading(true);
    setError(null); // Reset error state
    
    console.log('OverallAttendancePage: Starting data fetch...');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    Promise.all([
      axios.get(`${API_BASE_URL}/login-history`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/journey-plans`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/clients?limit=10000`, { headers: getAuthHeaders() }),
      salesService.getCountries(),
      salesService.getAllSalesReps(),
    ])
      .then(([loginRes, journeyRes, clientsRes, countriesRes, salesRepsRes]) => {
        console.log('OverallAttendancePage: Data fetch successful');
        console.log('Login history count:', loginRes.data?.length || 0);
        console.log('Journey plans count:', journeyRes.data?.length || 0);
        console.log('Clients count:', clientsRes.data?.data?.length || 0);
        console.log('Countries count:', countriesRes?.length || 0);
        console.log('Sales reps count:', salesRepsRes?.length || 0);
        
        setLoginHistory(loginRes.data || []);
        setJourneyPlans(journeyRes.data || []);
        // Fix: Handle the paginated response structure for clients
        setClients(clientsRes.data?.data || clientsRes.data || []);
        setCountries(countriesRes || []);
        setSalesReps(salesRepsRes || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching overall attendance data:', error);
        setError(`Failed to fetch data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        setLoading(false);
      });
  }, []);

  // Build attendance rows
  useEffect(() => {
    const dateMap: Record<string, { salesReps: Set<number>; clients: Set<number> }> = {};
    loginHistory.forEach(lh => {
      if (!lh.sessionStart) return;
      const date = lh.sessionStart.slice(0, 10);
      if (!dateMap[date]) dateMap[date] = { salesReps: new Set(), clients: new Set() };
      dateMap[date].salesReps.add(lh.userId);
    });
    journeyPlans.forEach(jp => {
      const date = jp.date.slice(0, 10);
      if (!dateMap[date]) dateMap[date] = { salesReps: new Set(), clients: new Set() };
      dateMap[date].clients.add(jp.clientId);
    });
         const rows: AttendanceRow[] = Object.entries(dateMap)
       .sort((a, b) => b[0].localeCompare(a[0]))
       .map(([date, { salesReps, clients }]) => ({
         date,
         clientsVisited: clients.size,
         activeSalesReps: salesReps.size,
       }));
     console.log('Generated attendance rows:', rows.length);
     console.log('Sample attendance row:', rows[0]);
     setAttendanceRows(rows);
  }, [loginHistory, journeyPlans]);

  // Filter rows
  const filteredRows = attendanceRows.filter(row => {
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    if (selectedCountry) {
      const repIds = salesReps.filter(rep => rep.country === selectedCountry).map(rep => rep.id);
      const loginReps = loginHistory.filter(lh => lh.sessionStart && lh.sessionStart.slice(0, 10) === row.date).map(lh => lh.userId);
      if (!loginReps.some(id => repIds.includes(id))) return false;
    }
    return true;
  });

  // Helper function to calculate time spent
  const calculateTimeSpent = (startTime: string, endTime?: string): string => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
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

  // Helper function to export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Clients Visited', 'Active Sales Reps'];
    const rows = filteredRows.map(row => [
      row.date,
      row.clientsVisited,
      row.activeSalesReps
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'overall_attendance.csv';
    link.click();
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
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Overall Attendance
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Comprehensive sales team performance and client visit tracking
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => setFilterModalOpen(true)}
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
            <p className="mt-6 text-lg font-medium text-gray-700">Loading attendance data...</p>
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
            {/* Enhanced Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Active Days</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredRows.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Days with activity</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Sales Representatives</p>
                      <p className="text-2xl font-bold text-gray-900">{salesReps.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Total team members</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Clients</p>
                      <p className="text-2xl font-bold text-gray-900">{clients.length.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Registered clients</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Visits</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredRows.reduce((sum, row) => sum + row.clientsVisited, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Client visits made</p>
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
                      Daily Attendance Overview
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Showing {filteredRows.length} days of attendance data
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Sales Reps</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Client Visits</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden">
                {filteredRows.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-500">No attendance data found for the selected date range.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clients Visited
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Active Sales Reps
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Activity Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRows.map((row, index) => {
                          const activityLevel = row.clientsVisited > 50 ? 'High' : 
                                               row.clientsVisited > 20 ? 'Medium' : 'Low';
                          const activityColor = activityLevel === 'High' ? 'bg-green-100 text-green-800' :
                                               activityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                               'bg-red-100 text-red-800';
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDate(row.date)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {row.date}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-semibold text-gray-900">
                                  {row.clientsVisited.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">visits</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-semibold text-gray-900">
                                  {row.activeSalesReps.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">reps</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activityColor}`}>
                                  {activityLevel}
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
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Team View</h4>
                    <p className="text-sm text-gray-500">Individual sales rep performance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Client Map</h4>
                    <p className="text-sm text-gray-500">Geographic visit distribution</p>
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

export default OverallAttendancePage; 