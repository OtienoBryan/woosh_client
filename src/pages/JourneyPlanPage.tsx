import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Users, Calendar, Clock, Eye, BarChart3 } from 'lucide-react';
import CreateJourneyPlanModal from '../components/CreateJourneyPlanModal';
import PendingJourneyPlansModal from '../components/PendingJourneyPlansModal';
import SalesRepJourneyPlansModal from '../components/SalesRepJourneyPlansModal';

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
      const response = await fetch('/api/sales-reps?status=1');
      const data = await response.json();
      if (data.success) {
        setSalesReps(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales reps:', error);
    }
  };

  const fetchJourneyPlans = async () => {
    try {
      const response = await fetch('/api/journey-plans');
      const data = await response.json();
      if (data.success) {
        setJourneyPlans(data.data);
      }
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
        journeyPlans: journeyPlans.filter(plan => plan.userId === salesRep.id) 
      } 
    });
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
                       <div className="mb-8">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
               <MapPin className="h-6 w-6 text-red-600" />
             </div>
             <div>
               <h1 className="text-3xl font-bold text-gray-900">Journey Plans</h1>
               <p className="text-gray-600">Manage sales representative route plans and client visits</p>
             </div>
           </div>
         </div>

      {/* Sales Representatives Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                 <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <Users className="h-6 w-6 text-blue-600" />
             <h2 className="text-xl font-semibold text-gray-900">Active Sales Representatives</h2>
             <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
               {salesReps.length} reps
             </span>
           </div>
           <button
             onClick={() => setShowPendingModal(true)}
             className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
           >
             <Eye className="h-4 w-4" />
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {salesReps.map((rep) => (
                   <tr 
                     key={rep.id} 
                     className="hover:bg-gray-50 cursor-pointer"
                     onClick={() => handleSalesRepClick(rep)}
                   >
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm font-medium text-gray-900">{rep.name}</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-600">{rep.email}</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-500">
                         {rep.phone || '-'}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-center">
                       <div className="text-sm text-gray-900">
                         {rep.route_name ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                             🛣️ {rep.route_name}
                           </span>
                         ) : rep.route_id_update ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                             ID: {rep.route_id_update}
                           </span>
                         ) : (
                           <span className="text-xs text-gray-400">No route</span>
                         )}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-center">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         Active
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-center">
                       <div className="flex flex-col gap-2">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleCreateJourneyPlan(rep);
                           }}
                           className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                         >
                           <Plus className="h-4 w-4" />
                           Create Route Plan
                         </button>
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleRouteCoverage(rep);
                           }}
                           className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                         >
                           <MapPin className="h-4 w-4" />
                           Route Coverage
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
