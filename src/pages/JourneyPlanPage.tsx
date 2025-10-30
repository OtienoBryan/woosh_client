import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Users, Calendar, Clock, Eye, BarChart3, FileText } from 'lucide-react';
import CreateJourneyPlanModal from '../components/CreateJourneyPlanModal';
import PendingJourneyPlansModal from '../components/PendingJourneyPlansModal';
import SalesRepJourneyPlansModal from '../components/SalesRepJourneyPlansModal';
import { getWithAuth } from '../utils/fetchWithAuth';

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: number;
  route_id_update?: number;
  route_name?: string;
}

interface JourneyPlan {
  id: number;
  date: string;
  time: string;
  userId: number;
  clientId: number;
  status: number;
  checkInTime?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  notes?: string;
  checkoutLatitude?: number;
  checkoutLongitude?: number;
  checkoutTime?: string;
  showUpdateLocation: boolean;
  routeId?: number;
  user_name?: string;
  client_name?: string;
  client_company_name?: string;
  route_name?: string;
}

const JourneyPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [journeyPlans, setJourneyPlans] = useState<JourneyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSalesRepModal, setShowSalesRepModal] = useState(false);
  const [clickedSalesRep, setClickedSalesRep] = useState<SalesRep | null>(null);

  useEffect(() => {
    fetchSalesReps();
    fetchJourneyPlans();
  }, []);

  const fetchSalesReps = async () => {
    try {
      // Fetch active sales reps (status = 1)
      const response = await getWithAuth('/api/sales-reps?status=1');
      const data: any = await response.json();
      if (data.success) {
        setSalesReps(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales reps:', error);
    }
  };

  const fetchJourneyPlans = async () => {
    try {
      const response = await getWithAuth('/api/journey-plans');
      const data: any = await response.json();
      const rawPlans = Array.isArray(data) ? data : (data?.data ?? []);
      setJourneyPlans(Array.isArray(rawPlans) ? rawPlans : []);
    } catch (error) {
      console.error('Failed to fetch journey plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJourneyPlan = (salesRep: SalesRep) => {
    setSelectedSalesRep(salesRep);
    setShowCreateModal(true);
  };

  const handleRouteCoverage = (salesRep: SalesRep) => {
    navigate(`/dashboard/route-coverage/${salesRep.id}`, { 
      state: { 
        salesRep, 
        journeyPlans: journeyPlans.filter(plan => Number(plan.userId) === Number(salesRep.id)) 
      } 
    });
  };

  const handleRouteReport = (salesRep: SalesRep) => {
    navigate(`/dashboard/route-report/${salesRep.id}`, { 
      state: { 
        salesRep
      } 
    });
  };

  const handleTestFetch = async () => {
    try {
      const userIdToTest = 109;
      console.log('[JourneyPlanPage] Testing fetch for JourneyPlan userId:', userIdToTest);
      const res = await getWithAuth(`/api/journey-plans/user/${userIdToTest}`);
      console.log('[JourneyPlanPage] Response status:', res.status);
      const json = await res.json();
      const raw = Array.isArray(json) ? json : (json?.data ?? []);
      console.log('[JourneyPlanPage] Raw payload:', json);
      console.log('[JourneyPlanPage] Parsed plans length:', Array.isArray(raw) ? raw.length : 'not-array');
      alert(`Fetched ${Array.isArray(raw) ? raw.length : 0} plans for userId ${userIdToTest}`);
    } catch (e: any) {
      console.error('[JourneyPlanPage] Test fetch error:', e);
      alert(`Test fetch failed: ${e?.message || e}`);
    }
  };

  const handleCreateSuccess = () => {
    fetchJourneyPlans();
    setShowCreateModal(false);
    setSelectedSalesRep(null);
  };

  const handleStatusUpdate = (planId: number, newStatus: number) => {
    // Update the local state to reflect the status change
    setJourneyPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId ? { ...plan, status: newStatus } : plan
      )
    );
  };

  const handleSalesRepClick = (salesRep: SalesRep) => {
    setClickedSalesRep(salesRep);
    setShowSalesRepModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading journey plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-6 text-xs">
      {/* Header */}
                       <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5 text-red-600" />
             </div>
             <div>
              <h1 className="text-2xl font-bold text-gray-900">Journey Plans</h1>
              <p className="text-gray-600 text-xs">Manage sales representative route plans and client visits</p>
             </div>
           </div>
         </div>

      {/* Sales Representatives Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Active Sales Representatives</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
               {salesReps.length} reps
             </span>
           </div>
          <button
            onClick={handleTestFetch}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-xs rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Test Fetch (userId 109)
          </button>
           <button
             onClick={() => setShowPendingModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
           >
            <Eye className="h-3.5 w-3.5" />
             View Pending Plans
           </button>
         </div>

        {salesReps.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No active sales representatives found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  
                  <th className="px-4 py-2 text-center text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-center text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs">
                                 {salesReps.map((rep) => (
                   <tr 
                     key={rep.id} 
                     className="hover:bg-gray-50 cursor-pointer"
                     onClick={() => handleSalesRepClick(rep)}
                   >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">{rep.name}</div>
                     </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-600">{rep.email}</div>
                     </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                         {rep.phone || '-'}
                       </div>
                     </td>
                     
                     <td className="px-6 py-4 whitespace-nowrap text-center">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         Active
                       </span>
                     </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex flex-row flex-wrap justify-center gap-1">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleCreateJourneyPlan(rep);
                           }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-[11px] rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                         >
                          <Plus className="h-3 w-3" />
                           Create Route Plan
                         </button>
                                      <button
               onClick={(e) => {
                 e.stopPropagation();
                 handleRouteCoverage(rep);
               }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[11px] rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
             >
              <MapPin className="h-3 w-3" />
               Route Coverage
             </button>
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 handleRouteReport(rep);
               }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-[11px] rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
             >
              <FileText className="h-3 w-3" />
               Route Report
             </button>
                       </div>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Journey Plans Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
                 <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <Calendar className="h-6 w-6 text-green-600" />
             <h2 className="text-xl font-semibold text-gray-900">Recent Journey Plans</h2>
             <div className="flex gap-2">
               <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                 {journeyPlans.length} total
               </span>
               <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                 {journeyPlans.filter(plan => plan.status === 0).length} pending
               </span>
               <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                 {journeyPlans.filter(plan => plan.status === 1).length} in progress
               </span>
             </div>
           </div>
         </div>

        {journeyPlans.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No journey plans created yet.</p>
            <p className="text-sm text-gray-400">Create a route plan for a sales representative to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {journeyPlans.slice(0, 10).map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.user_name || salesReps.find(rep => rep.id === plan.userId)?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(plan.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {plan.client_name || plan.client_company_name || `Client ID: ${plan.clientId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(plan.latitude && plan.longitude) ? (
                        <div className="text-xs text-blue-600">
                          📍 {plan.latitude.toFixed(6)}, {plan.longitude.toFixed(6)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No coordinates</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {plan.route_name ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🛣️ {plan.route_name}
                          </span>
                        ) : plan.routeId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ID: {plan.routeId}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No route</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.status === 0 ? 'bg-gray-100 text-gray-800' :
                        plan.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                        plan.status === 2 ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plan.status === 0 ? 'Pending' :
                         plan.status === 1 ? 'In Progress' :
                         plan.status === 2 ? 'Completed' : 'Cancelled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {plan.checkInTime ? 
                        new Date(plan.checkInTime).toLocaleTimeString() : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {plan.checkoutTime ? 
                        new Date(plan.checkoutTime).toLocaleTimeString() : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={plan.notes || 'No notes'}>
                        {plan.notes || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

             {/* Create Journey Plan Modal */}
       {showCreateModal && selectedSalesRep && (
         <CreateJourneyPlanModal
           isOpen={showCreateModal}
           onClose={() => {
             setShowCreateModal(false);
             setSelectedSalesRep(null);
           }}
           salesRep={selectedSalesRep}
           onSuccess={handleCreateSuccess}
         />
       )}

               {/* Pending Journey Plans Modal */}
        <PendingJourneyPlansModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          journeyPlans={journeyPlans}
          onStatusUpdate={handleStatusUpdate}
        />

        {/* Sales Rep Journey Plans Modal */}
        {showSalesRepModal && clickedSalesRep && (
          <SalesRepJourneyPlansModal
            isOpen={showSalesRepModal}
            onClose={() => {
              setShowSalesRepModal(false);
              setClickedSalesRep(null);
            }}
            salesRep={clickedSalesRep}
            journeyPlans={journeyPlans}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    );
  };

export default JourneyPlanPage;
