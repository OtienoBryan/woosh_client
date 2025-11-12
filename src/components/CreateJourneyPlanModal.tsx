import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Search, Loader2 } from 'lucide-react';
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
  clientName?: string;
  clientCompanyName?: string;
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
  const [journeyPlanItems, setJourneyPlanItems] = useState<JourneyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchCacheRef = useRef<Map<string, Client[]>>(new Map());

  // Optimized search function with caching
  const fetchClients = useCallback(async (search: string = '') => {
    // Only fetch if search query is provided (at least 2 characters)
    if (!search.trim() || search.trim().length < 2) {
      setClients([]);
      setFilteredClients([]);
      setIsLoadingClients(false);
      return;
    }

    const searchKey = search.trim().toLowerCase();
    
    // Check cache first
    if (searchCacheRef.current.has(searchKey)) {
      console.log('[CreateJourneyPlanModal] Using cached results for:', searchKey);
      const cachedResults = searchCacheRef.current.get(searchKey)!;
      setClients(cachedResults);
      setFilteredClients(cachedResults);
      setIsLoadingClients(false);
      return;
    }

    // Set loading state - but don't block input
    setIsLoadingClients(true);
    try {
      // Optimized query parameters
      const params = new URLSearchParams();
      params.append('search', searchKey);
      params.append('lightweight', 'true'); // Minimal fields, no JOINs
      params.append('limit', '50'); // Reduced from 100 for faster queries
      params.append('page', '1');
      
      // Fetch all clients regardless of route
      
      const url = `/api/clients?${params.toString()}`;
      const startTime = performance.now();
      
      const response = await getWithAuth(url);
      const data = await response.json();
      
      const endTime = performance.now();
      console.log(`[CreateJourneyPlanModal] Client fetch completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      const results = data.data || [];
      
      // Cache the results
      searchCacheRef.current.set(searchKey, results);
      
      // Limit cache size to prevent memory issues
      if (searchCacheRef.current.size > 20) {
        const firstKey = searchCacheRef.current.keys().next().value;
        if (firstKey) {
          searchCacheRef.current.delete(firstKey);
        }
      }
      
      setClients(results);
      setFilteredClients(results);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setError('Failed to load clients. Please try again.');
      setClients([]);
      setFilteredClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  }, [salesRep.route_id_update]);

  // Initialize modal - NO CLIENTS LOADED ON OPEN (lazy loading)
  // Clients are only fetched when user types in search box (minimum 2 characters)
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setClients([]);
      setFilteredClients([]);
      setSearchQuery(''); // Clear search query
      setIsLoadingClients(false); // Ensure loading state is false
      console.log('SalesRep data:', salesRep);
      console.log('SalesRep route_id_update:', salesRep.route_id_update);
      // NOTE: No fetchClients() call here - clients load only when user searches
    }
  }, [isOpen, salesRep]);

  // Debounced search effect - only search when user types
  useEffect(() => {
    // Clear previous timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    // If search is empty or too short, clear results
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setClients([]);
      setFilteredClients([]);
      setIsLoadingClients(false);
      return;
    }

    // Set new timer for debounced search
    searchDebounceTimerRef.current = setTimeout(() => {
      fetchClients(searchQuery);
    }, 400); // 400ms debounce delay - reduced API calls while typing

    // Cleanup
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, [searchQuery, fetchClients]);

  const resetForm = () => {
    setJourneyPlanItems([]);
    setSearchQuery('');
    setError(null);
    // Clear clients when modal closes to free memory
    if (!isOpen) {
      setClients([]);
      setFilteredClients([]);
    }
  };

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClients([]);
      setFilteredClients([]);
      setSearchQuery('');
      // Clear any pending debounce timer
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
      // Clear cache when modal closes to free memory
      searchCacheRef.current.clear();
    }
  }, [isOpen]);

  const addClientToJourneyPlan = (client: Client) => {
    // Check if client is already added
    if (journeyPlanItems.some(item => item.clientId === client.id)) {
      setError('This client is already added to the journey plan');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newItem: JourneyPlanItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      clientId: client.id,
      clientName: client.name,
      clientCompanyName: client.company_name,
      notes: '',
      latitude: client.latitude || undefined,
      longitude: client.longitude || undefined,
      routeId: salesRep.route_id_update || null,
    };

    setJourneyPlanItems(prev => [...prev, newItem]);
    
    // Clear search to show success
    setSearchQuery('');
    setClients([]);
    setFilteredClients([]);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white w-full h-full overflow-hidden flex flex-col">
        {/* Modern Header with Gradient */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-red-50 to-orange-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Create Route Plan
              </h3>
              <p className="text-xs text-gray-600">
                for {salesRep.name}
              </p>
              {salesRep.route_id_update && (
                <p className="text-xs text-purple-600 font-medium mt-0.5">
                  🛣️ Route ID: {salesRep.route_id_update}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg p-1.5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Client Selection Section */}
            <div className="flex flex-col min-h-0 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                Search & Add Clients
              </h4>
              
              {/* Search */}
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isLoadingClients && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600 animate-spin" />
                  )}
                  <input
                    type="text"
                    placeholder="Search clients by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white shadow-sm"
                  />
                </div>
                {searchQuery.trim().length >= 2 && !isLoadingClients && filteredClients.length > 0 && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {filteredClients.length} result{filteredClients.length !== 1 ? 's' : ''} 
                    {filteredClients.length === 50 && ' (showing max)'}
                  </p>
                )}
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>

              {/* Client List */}
              <div className="border border-gray-200 rounded-lg flex-1 min-h-0 overflow-y-auto mb-4 bg-white shadow-inner">
                {isLoadingClients ? (
                  <div className="p-6 text-center">
                    <Loader2 className="h-6 w-6 text-red-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Searching clients...</p>
                  </div>
                ) : !searchQuery.trim() || searchQuery.trim().length < 2 ? (
                  <div className="p-6 text-center">
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-xs text-gray-600 font-medium mb-1">Start typing to search for clients</p>
                    <p className="text-xs text-gray-500">Enter at least 2 characters to search</p>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-xs text-gray-600 font-medium mb-1">No clients found</p>
                    <p className="text-xs text-gray-500">Try a different search term</p>
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const isAlreadyAdded = journeyPlanItems.some(item => item.clientId === client.id);
                    return (
                      <div
                        key={client.id}
                        className={`p-2.5 border-b border-gray-100 cursor-pointer transition-all ${
                          isAlreadyAdded
                            ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                            : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50'
                        }`}
                        onClick={() => !isAlreadyAdded && addClientToJourneyPlan(client)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs text-gray-900 truncate flex items-center gap-1.5">
                              {client.name || client.company_name || 'Unnamed Client'}
                              {isAlreadyAdded && (
                                <span className="text-xs text-green-600 font-semibold">✓ Added</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {client.email || 'No email'}
                            </div>
                            {client.address && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {client.address}
                              </div>
                            )}
                            {(client.latitude && client.longitude) && (
                              <div className="text-xs text-blue-600 mt-0.5">
                                📍 {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                              </div>
                            )}
                          </div>
                          {!isAlreadyAdded && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                +
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Journey Plan Items Section */}
            <div className="flex flex-col min-h-0 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 flex-shrink-0">
                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                Journey Plan Items
              </h4>
              
              {journeyPlanItems.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg flex-1 flex items-center justify-center bg-white">
                  <div>
                    <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">No journey plan items added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Select clients from the left panel to get started</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
                  {journeyPlanItems.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2.5">
                        <h5 className="font-semibold text-xs text-gray-900 flex items-center gap-2">
                          <span className="w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          Visit {index + 1}
                        </h5>
                        <button
                          type="button"
                          onClick={() => removeJourneyPlanItem(item.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateJourneyPlanItem(item.id, 'date', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2.5">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateJourneyPlanItem(item.id, 'notes', e.target.value)}
                          rows={2}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white resize-none"
                          placeholder="Add notes for this visit..."
                        />
                      </div>
                      
                      <div className="mt-2.5 p-2 bg-gray-50 rounded-md border border-gray-100">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">Client:</span>{' '}
                          <span className="text-gray-900">
                            {item.clientName || item.clientCompanyName || `Client ID: ${item.clientId}`}
                          </span>
                        </div>
                        {(item.latitude && item.longitude) && (
                          <div className="mt-1 text-xs text-blue-600">
                            📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </div>
                        )}
                        {item.routeId && (
                          <div className="mt-1 text-xs text-purple-600 font-medium">
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

          <div className="flex justify-end gap-2.5 pt-4 border-t mt-4 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || journeyPlanItems.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" />
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
