import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Search } from 'lucide-react';
import { getWithAuth, postWithAuth } from '../utils/fetchWithAuth';

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: number;
  route_id_update?: number;
}

interface Client {
  id: number;
  name: string;
  company_name?: string;
  email: string;
  address?: string;
  contact?: string;
  latitude?: number;
  longitude?: number;
}

interface CreateJourneyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesRep: SalesRep;
  onSuccess: () => void;
}

interface JourneyPlanItem {
  id: string;
  date: string;
  time: string;
  clientId: number;
  notes: string;
  latitude?: number;
  longitude?: number;
  routeId?: number | null;
}

const CreateJourneyPlanModal: React.FC<CreateJourneyPlanModalProps> = ({
  isOpen,
  onClose,
  salesRep,
  onSuccess,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [journeyPlanItems, setJourneyPlanItems] = useState<JourneyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      resetForm();
      console.log('SalesRep data:', salesRep);
      console.log('SalesRep route_id_update:', salesRep.route_id_update);
    }
  }, [isOpen, salesRep]);

  useEffect(() => {
    // Filter clients based on search query
    const filtered = clients.filter(client =>
      (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.company_name && client.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      const response = await getWithAuth('/api/clients?limit=10000');
      const data = await response.json();
      if (data.data) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const resetForm = () => {
    setSelectedClients(new Set());
    setJourneyPlanItems([]);
    setSearchQuery('');
    setError(null);
  };

  const handleClientToggle = (clientId: number) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const addJourneyPlanItems = () => {
    if (selectedClients.size === 0) {
      setError('Please select at least one client');
      return;
    }

    const newItems: JourneyPlanItem[] = Array.from(selectedClients).map((clientId, index) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        console.warn(`Client with ID ${clientId} not found`);
                 return {
           id: `temp-${Date.now()}-${index}`,
           date: new Date().toISOString().split('T')[0],
           time: '09:00',
           clientId,
           notes: '',
           latitude: undefined,
           longitude: undefined,
           routeId: salesRep.route_id_update || null,
         };
      }
             return {
         id: `temp-${Date.now()}-${index}`,
         date: new Date().toISOString().split('T')[0],
         time: '09:00',
         clientId,
         notes: '',
         latitude: client.latitude || undefined,
         longitude: client.longitude || undefined,
         routeId: salesRep.route_id_update || null,
       };
    });

    setJourneyPlanItems(newItems);
    setSelectedClients(new Set());
  };

  const updateJourneyPlanItem = (id: string, field: keyof JourneyPlanItem, value: string | number) => {
    setJourneyPlanItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeJourneyPlanItem = (id: string) => {
    setJourneyPlanItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (journeyPlanItems.length === 0) {
      setError('Please add at least one journey plan item');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create journey plans for each item
      const promises = journeyPlanItems.map(item => {
        const requestBody = {
          date: item.date,
          time: item.time,
          userId: salesRep.id,
          clientId: item.clientId,
          status: 0,
          notes: item.notes,
          showUpdateLocation: true,
          latitude: item.latitude,
          longitude: item.longitude,
          routeId: item.routeId || null,
        };
        
        console.log('Creating journey plan with data:', requestBody);
        console.log('Item routeId:', item.routeId);
        console.log('SalesRep route_id_update:', salesRep.route_id_update);
        
        return postWithAuth('/api/journey-plans', requestBody);
      });

      await Promise.all(promises);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create journey plans');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-hidden">
        <div className="flex justify-between items-center p-8 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Plus className="h-6 w-6 text-red-600" />
            </div>
                         <div>
               <h3 className="text-2xl font-bold text-gray-900">
                 Create Route Plan
               </h3>
               <p className="text-lg text-gray-600">
                 for {salesRep.name}
               </p>
               {salesRep.route_id_update && (
                 <p className="text-sm text-purple-600">
                   🛣️ Route ID: {salesRep.route_id_update}
                 </p>
               )}
             </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 h-full flex flex-col overflow-hidden">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-hidden" style={{ height: 'calc(100vh - 400px)' }}>
            {/* Client Selection Section */}
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-6">Select Clients</h4>
              
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                  />
                </div>
              </div>

              {/* Client List */}
                             <div className="border border-gray-200 rounded-md h-80 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? 'No clients found matching your search' : 'No clients available'}
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedClients.has(client.id) ? 'bg-red-50 border-red-200' : ''
                      }`}
                      onClick={() => handleClientToggle(client.id)}
                    >
                      <div className="flex items-center justify-between">
                                                 <div>
                           <div className="font-medium text-gray-900">
                             {client.name || client.company_name || 'Unnamed Client'}
                           </div>
                           <div className="text-sm text-gray-600">
                             {client.email || 'No email'}
                           </div>
                                                     {client.address && (
                             <div className="text-xs text-gray-500 truncate">
                               {client.address}
                             </div>
                           )}
                           {!client.address && (
                             <div className="text-xs text-gray-400">
                               No address
                             </div>
                           )}
                          {(client.latitude && client.longitude) && (
                            <div className="text-xs text-blue-600">
                              📍 {client.latitude.toFixed(6)}, {client.longitude.toFixed(6)}
                            </div>
                          )}
                        </div>
                        <div className={`w-4 h-4 border-2 rounded ${
                          selectedClients.has(client.id)
                            ? 'bg-red-600 border-red-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedClients.has(client.id) && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Selected Clients Button */}
              <button
                type="button"
                onClick={addJourneyPlanItems}
                disabled={selectedClients.size === 0}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
              >
                Add Selected Clients ({selectedClients.size})
              </button>
            </div>

            {/* Journey Plan Items Section */}
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-6">Journey Plan Items</h4>
              
              {journeyPlanItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No journey plan items added yet</p>
                  <p className="text-sm text-gray-400">Select clients from the left panel to get started</p>
                </div>
              ) : (
                                 <div className="space-y-4 h-80 overflow-y-auto">
                  {journeyPlanItems.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">
                          Item {index + 1}
                        </h5>
                        <button
                          type="button"
                          onClick={() => removeJourneyPlanItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateJourneyPlanItem(item.id, 'date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            required
                          />
                        </div>
                        
                        <div hidden>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            value={item.time}
                            onChange={(e) => updateJourneyPlanItem(item.id, 'time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateJourneyPlanItem(item.id, 'notes', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Add notes for this visit..."
                        />
                      </div>
                      
                                                                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                         <span className="font-medium">Client:</span> {
                           clients.find(c => c.id === item.clientId)?.name || 
                           clients.find(c => c.id === item.clientId)?.company_name || 
                           `Client ID: ${item.clientId}`
                         }
                         {(item.latitude && item.longitude) && (
                           <div className="mt-1 text-xs text-blue-600">
                             📍 Coordinates: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                           </div>
                         )}
                         {item.routeId && (
                           <div className="mt-1 text-xs text-purple-600">
                             🛣️ Route ID: {item.routeId}
                           </div>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mr-auto">Footer Section - Buttons Below</div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || journeyPlanItems.length === 0}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Create Journey Plans ({journeyPlanItems.length})
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJourneyPlanModal;
