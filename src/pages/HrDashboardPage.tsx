import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useRef, useCallback } from 'react';
import { format } from 'date-fns';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format as formatDate,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import { API_CONFIG } from '../config/api';
import { 
  TrendingUpIcon, 
  UsersIcon, 
  FileTextIcon, 
  AlertTriangleIcon, 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MessageCircleIcon,
  ClockIcon,
  UserCheckIcon,
  UserXIcon,
  BuildingIcon,
  BriefcaseIcon,
  ClipboardListIcon,
  SettingsIcon,
  EyeIcon,
  PlusIcon,
  Trash2Icon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import io from 'socket.io-client';

const SOCKET_URL = API_CONFIG.getSocketUrl();

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    positive: boolean;
  };
  prefix?: string;
  suffix?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  prefix = '',
  suffix = '',
  bgColor = 'bg-gradient-to-r from-blue-600 to-blue-700',
  textColor = 'text-white',
  onClick,
  badge
}) => {
  return (
    <div className="relative">
      <div
        className={`${bgColor} overflow-hidden shadow-lg rounded-xl cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${textColor} opacity-90`}>
                {title}
              </p>
              <p className={`text-2xl font-bold ${textColor} mt-1`}>
                {prefix}{value}{suffix}
              </p>
              {change && (
                <div className="flex items-center mt-2">
                  <TrendingUpIcon 
                    className={`h-4 w-4 ${change.positive ? 'text-green-300' : 'text-red-300'}`} 
                  />
                  <span className={`text-sm font-medium ml-1 ${change.positive ? 'text-green-300' : 'text-red-300'}`}>
                    {change.positive ? '+' : ''}{change.value}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <div className={`p-3 rounded-lg ${textColor} bg-white bg-opacity-20`}>
                {icon}
              </div>
            </div>
          </div>
        </div>
      </div>
      {badge && (
        <div className="absolute -top-2 -right-2">
          {badge}
        </div>
      )}
    </div>
  );
};

const HrDashboardPage: React.FC = () => {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
    const [hasNewChatMessage, setHasNewChatMessage] = useState(() => {
        return localStorage.getItem('hasNewChatMessage') === 'true';
    });
    const navigate = useNavigate();
    const location = useLocation();
    const socketRef = React.useRef<any>(null);

    // Calendar/task state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [tasks, setTasks] = useState<{ [date: string]: { id: number; text: string }[] }>({});
    const [newTask, setNewTask] = useState('');
    const nextTaskId = useRef(1);

    // Calendar grid logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarRows: Date[][] = [];
    let day = weekStart;
    while (day <= weekEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      calendarRows.push(week);
    }

    // Custom fetch function to avoid axios
    const fetchData = async (endpoint: string) => {
      const url = API_CONFIG.getUrl(endpoint);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [attendanceData, staffData, contractsData] = await Promise.all([
                    fetchData('/attendance/today'),
                    fetchData('/staff'),
                    fetchData('/staff/contracts/expiring')
                ]);
                setAttendance(attendanceData);
                setStaff(staffData);
                setExpiringContracts(contractsData);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    // Listen for new chat messages
    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;
        socket.on('newMessage', (msg: any) => {
            if (location.pathname !== '/chat-room') {
                setHasNewChatMessage(true);
                localStorage.setItem('hasNewChatMessage', 'true');
            }
        });
        return () => { socket.disconnect(); };
    }, [location.pathname]);

    // Clear notification when visiting chat room
    useEffect(() => {
        if (location.pathname === '/chat-room') {
            setHasNewChatMessage(false);
            localStorage.setItem('hasNewChatMessage', 'false');
        }
    }, [location.pathname]);

    // Fetch tasks for the current month
    const fetchTasks = useCallback(async () => {
      try {
        const month = format(monthStart, 'yyyy-MM');
        const data = await fetchData(`/calendar-tasks?month=${month}`);
        const grouped: { [date: string]: { id: number; text: string }[] } = {};
        for (const t of data) {
          const dateKey = t.date.slice(0, 10);
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push({ id: t.id, text: t.title });
        }
        setTasks(grouped);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    }, [monthStart]);

    useEffect(() => {
      fetchTasks();
    }, [fetchTasks]);

    const checkedInCount = attendance.filter(a => a.checkin_time).length;
    const totalCount = staff.length;
    const attendancePercentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

    const handlePrevMonth = () => {
      setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(addMonths(currentMonth, 1));
    };

    const navigationItems = [
      { to: '/dashboard/staff-list', label: 'Staff List', icon: <UsersIcon className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
      { to: '/document-list', label: 'Documents', icon: <FileTextIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
      { to: '/dashboard/expiring-contracts', label: 'Expiring Contracts', icon: <AlertTriangleIcon className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
      { to: '/dashboard/employee-leaves', label: 'Employee Leaves', icon: <CalendarIcon className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
      { to: '/attendance-history', label: 'Attendance History', icon: <ClockIcon className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
      { to: '/employee-working-hours', label: 'Working Hours', icon: <ClockIcon className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
      { to: '/employee-working-days', label: 'Working Days', icon: <CalendarIcon className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
      { to: '/out-of-office-requests', label: 'Out of Office', icon: <UserXIcon className="h-4 w-4" />, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
      //{ to: '/departments', label: 'Departments', icon: <BuildingIcon className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
      //{ to: '/positions', label: 'Positions', icon: <BriefcaseIcon className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
      //{ to: '/payroll', label: 'Payroll', icon: <ClipboardListIcon className="h-4 w-4" />, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
      { to: '/chat-room', label: 'Chat Room', icon: <MessageCircleIcon className="h-4 w-4" />, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
      //{ to: '/settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                {/* Header */}
                <div className="mb-1">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Dashboard</h1>
                            <p className="text-gray-600">Manage employees, track attendance, and handle HR operations</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                            <CalendarIcon className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-gray-700">
                                {format(new Date(), 'EEEE, MMMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                        {navigationItems.map((item, index) => (
                            <Link
                                key={index}
                                to={item.to}
                                className={`${item.color} flex flex-col items-center justify-center p-4 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-md`}
                            >
                                {item.icon}
                                <span className="mt-2 text-center">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 opacity-65">
                    <StatCard
                        title="Total Employees"
                        value={totalCount}
                        icon={<UsersIcon className="h-6 w-6" />}
                        bgColor="bg-gradient-to-r from-indigo-600 to-indigo-700"
                        onClick={() => navigate('/dashboard/staff-list')}
                    />
                    
                    <StatCard
                        title="Present Today"
                        value={checkedInCount}
                        suffix={`/ ${totalCount}`}
                        icon={<UserCheckIcon className="h-6 w-6" />}
                        bgColor="bg-gradient-to-r from-green-600 to-green-700"
                        onClick={() => navigate('/attendance-history')}
                    />

                    <StatCard
                        title="Attendance Rate"
                        value={attendancePercentage}
                        suffix="%"
                        icon={<TrendingUpIcon className="h-6 w-6" />}
                        bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
                        onClick={() => navigate('/attendance-history')}
                    />

                    <StatCard
                        title="Expiring Contracts"
                        value={expiringContracts.length}
                        icon={<AlertTriangleIcon className="h-6 w-6" />}
                        bgColor="bg-gradient-to-r from-amber-600 to-amber-700"
                        onClick={() => navigate('/dashboard/expiring-contracts')}
                        badge={expiringContracts.length > 0 && (
                            <span className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{expiringContracts.length}</span>
                            </span>
                        )}
                    />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Attendance Section */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Today's Attendance</h2>
                                <div className="flex gap-2">
                                    <button
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                        onClick={() => navigate('/attendance-history')}
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                        View History
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        onClick={() => navigate('/employee-working-hours')}
                                    >
                                        <ClockIcon className="h-4 w-4" />
                                        Working Hours
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                                        onClick={() => navigate('/employee-working-days')}
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                        Working Days
                                    </button>
                                </div>
                            </div>
                            
                            {loading ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Attendance Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-green-600 font-medium">Present</p>
                                                    <p className="text-2xl font-bold text-green-700">{checkedInCount}</p>
                                                </div>
                                                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600 font-medium">Total Staff</p>
                                                    <p className="text-2xl font-bold text-gray-700">{totalCount}</p>
                                                </div>
                                                <UsersIcon className="h-8 w-8 text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-blue-600 font-medium">Attendance Rate</p>
                                                    <p className="text-2xl font-bold text-blue-700">{attendancePercentage}%</p>
                                                </div>
                                                <TrendingUpIcon className="h-8 w-8 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {attendance.filter(a => a.checkin_time).map(a => {
                                                    const checkin = a.checkin_time ? new Date(a.checkin_time) : null;
                                                    const checkout = a.checkout_time ? new Date(a.checkout_time) : null;
                                                    let timeSpent = '';
                                                    if (checkin) {
                                                        const end = checkout || new Date();
                                                        const diffMs = end.getTime() - checkin.getTime();
                                                        const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                                        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
                                                        timeSpent = `${hours}h ${mins}m`;
                                                    }
                                                    return (
                                                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{a.name || a.staff_id}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.department || '-'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {checkin ? checkin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {checkout ? checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    {timeSpent}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    Present
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {attendance.filter(a => a.checkin_time).length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                                            <div className="flex flex-col items-center">
                                                                <XCircleIcon className="h-12 w-12 text-gray-300 mb-2" />
                                                                No check-ins recorded for today.
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Calendar & Tasks Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Calendar & Tasks</h2>
                                <div className="relative">
                                    <button
                                        onClick={() => navigate('/chat-room')}
                                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        <MessageCircleIcon className="h-5 w-5" />
                                        {hasNewChatMessage && (
                                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                                </button>
                                <h3 className="text-lg font-semibold text-gray-700">
                                    {formatDate(currentMonth, 'MMMM yyyy')}
                                </h3>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="mb-6">
                                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 mb-2">
                                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                                        <div key={i} className="h-8 flex items-center justify-center">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarRows.flat().map((date, idx) => {
                                        const dateStr = formatDate(date, 'yyyy-MM-dd');
                                        const hasTasks = (tasks[dateStr]?.length ?? 0) > 0;
                                        const isSelected = selectedDate === dateStr;
                                        const isCurrentMonth = isSameMonth(date, monthStart);
                                        const isToday = isSameDay(date, new Date());
                                        
                                        return (
                                            <button
                                                key={dateStr + idx}
                                                className={`relative h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-200
                                                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 
                                                       hasTasks ? 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200' : 
                                                       !isCurrentMonth ? 'text-gray-300' : 'hover:bg-gray-100'}
                                                    ${isToday && !isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                                                onClick={() => setSelectedDate(dateStr)}
                                            >
                                                {date.getDate()}
                                                {hasTasks && !isSelected && (
                                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Selected Date Tasks */}
                            <div className="border-t pt-4">
                                <h3 className="font-medium text-gray-700 mb-3">
                                    Tasks for {formatDate(parseISO(selectedDate), 'MMMM d, yyyy')}
                                </h3>
                                
                                {/* Add Task Form */}
                                <form
                                    className="flex gap-2 mb-4"
                                    onSubmit={async e => {
                                        e.preventDefault();
                                        if (!newTask.trim()) return;
                                        try {
                                            const response = await fetch(API_CONFIG.getUrl('/calendar-tasks'), {
                                                method: 'POST',
                                                headers: { 
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                },
                                                body: JSON.stringify({ date: selectedDate, title: newTask })
                                            });
                                            if (response.ok) {
                                                fetchTasks();
                                                setNewTask('');
                                            }
                                        } catch (error) {
                                            console.error('Error adding task:', error);
                                        }
                                    }}
                                >
                                    <input
                                        type="text"
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Add a new task..."
                                        value={newTask}
                                        onChange={e => setNewTask(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-1"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Add
                                    </button>
                                </form>

                                {/* Tasks List */}
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {(tasks[selectedDate]?.length ?? 0) === 0 ? (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                            <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            No tasks scheduled for this day.
                                        </div>
                                    ) : (
                                        tasks[selectedDate].map(task => (
                                            <div key={task.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors">
                                                <span className="text-sm text-gray-700">{task.text}</span>
                                                <button
                                                    className="text-red-500 hover:text-red-700 text-sm p-1 rounded transition-colors"
                                                    onClick={async () => {
                                                        try {
                                                            const response = await fetch(API_CONFIG.getUrl(`/calendar-tasks/${task.id}`), { 
                                                                method: 'DELETE',
                                                                headers: {
                                                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                                }
                                                            });
                                                            if (response.ok) {
                                                                fetchTasks();
                                                            }
                                                        } catch (error) {
                                                            console.error('Error deleting task:', error);
                                                        }
                                                    }}
                                                >
                                                    <Trash2Icon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HrDashboardPage;