import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Route, 
  DollarSign, 
  Calendar, 
  Edit, 
  Trash2, 
  Filter,
  X,
  ChevronDown,
  Users,
  Map,
  Activity,
  Eye,
  UserPlus
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  balance?: number;
  email?: string;
  region_id: number;
  region: string;
  route_id?: number;
  route_name?: string;
  route_id_update?: number;
  route_name_update?: string;
  contact: string;
  tax_pin?: string;
  location?: string;
  status: number;
  client_type?: number;
  outlet_account?: number;
  countryId: number;
  added_by?: number;
  created_at?: string;
  client_type_name?: string;
  outlet_account_name?: string;
  salesRepAssignment?: ClientAssignment | null;
  credit_limit?: number;
  payment_terms?: string;
}

interface Country { id: number; name: string; }
interface Region { id: number; name: string; }
interface Route { id: number; name: string; }
interface SalesRep { id: number; name: string; email: string; phone: string; }
interface ClientAssignment { id: number; outletId: number; salesRepId: number; assignedAt: string; status: string; sales_rep_name: string; }

const AddClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Client, 'id' | 'created_at'>) => void;
  loading: boolean;
  countries: Country[];
  regions: Region[];
  routes: Route[];
  outletAccounts: {id: number; name: string}[];
  onCountryChange: (country: string) => void;
}> = ({ isOpen, onClose, onSubmit, loading, countries, regions, routes, outletAccounts, onCountryChange }) => {
  const [form, setForm] = useState<Omit<Client, 'id' | 'created_at'>>({
    name: '',
    email: '',
    contact: '',
    address: '',
    region_id: 0,
    region: '',
    route_id: undefined,
    route_name: '',
    route_id_update: undefined,
    route_name_update: '',
    latitude: undefined,
    longitude: undefined,
    balance: undefined,
    tax_pin: '',
    location: '',
    status: 0,
    client_type: undefined,
    outlet_account: undefined,
    countryId: 0,
    added_by: undefined,
    credit_limit: undefined,
    payment_terms: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', email: '', contact: '', address: '', region_id: 0, region: '', route_id: undefined, route_name: '', route_id_update: undefined, route_name_update: '', latitude: undefined, longitude: undefined, balance: undefined, tax_pin: '', location: '', status: 0, client_type: undefined, outlet_account: undefined, countryId: 0, added_by: undefined, credit_limit: undefined, payment_terms: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Client</h2>
          <p className="text-sm text-gray-600 mt-1">Enter client information below</p>
        </div>
        
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
            <input 
              type="text" 
              required 
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
              placeholder="Enter client name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input 
                type="email" 
                required 
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input 
                type="tel" 
                required 
                value={form.contact} 
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                placeholder="+254 700 000 000"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input 
              type="text" 
              value={form.address} 
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
              placeholder="Enter address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select 
              value={form.countryId} 
              onChange={e => { 
                setForm(f => ({ ...f, countryId: parseInt(e.target.value, 10) })); 
                onCountryChange(e.target.value); 
              }} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="">Select country</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select 
                value={form.region_id} 
                onChange={e => setForm(f => ({ ...f, region_id: parseInt(e.target.value, 10) }))} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                disabled={!form.countryId}
              >
                <option value="">{form.countryId ? 'Select region' : 'Select country first'}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <select 
                value={form.route_id} 
                onChange={e => setForm(f => ({ ...f, route_id: parseInt(e.target.value, 10) }))} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                disabled={!form.countryId}
              >
                <option value="">{form.countryId ? 'Select route' : 'Select country first'}</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
              <input 
                type="number" 
                value={form.credit_limit || ''} 
                onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value ? parseFloat(e.target.value) : undefined }))} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                placeholder="Enter credit limit"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <input 
                type="text" 
                value={form.payment_terms || ''} 
                onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                placeholder="e.g., Net 30, COD, etc."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Account</label>
            <select 
              value={form.outlet_account || 0} 
              onChange={e => setForm(f => ({ ...f, outlet_account: parseInt(e.target.value, 10) }))} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value={0}>Not assigned</option>
              {outletAccounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? 'Saving...' : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignSalesRepModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onAssignmentSuccess: (clientId: number) => void;
}> = ({ isOpen, onClose, client, onAssignmentSuccess }) => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<ClientAssignment | null>(null);

  useEffect(() => {
    if (isOpen && client) {
      setLoading(true);
      setError(null);
      
      // Fetch sales reps and current assignment
      Promise.all([
        fetch('/api/sales-reps?status=1').then(res => res.json()),
        fetch(`/api/client-assignments/outlet/${client.id}`).then(res => res.json())
      ]).then(([salesRepsRes, assignmentRes]) => {
        if (salesRepsRes.success) {
          setSalesReps(salesRepsRes.data);
        }
        if (assignmentRes.success && assignmentRes.data.length > 0) {
          setCurrentAssignment(assignmentRes.data[0]);
          setSelectedSalesRepId(assignmentRes.data[0].salesRepId);
        } else {
          setCurrentAssignment(null);
          setSelectedSalesRepId('');
        }
      }).catch(err => {
        setError('Failed to fetch data');
        console.error(err);
      }).finally(() => setLoading(false));
    }
  }, [isOpen, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !selectedSalesRepId) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/client-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletId: client.id,
          salesRepId: selectedSalesRepId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        onAssignmentSuccess(client.id);
        onClose();
      } else {
        setError(result.message || 'Failed to assign sales rep');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign sales rep');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !client) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Assign Sales Representative</h2>
          <p className="text-sm text-gray-600 mt-1">Assign a sales rep to {client.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {currentAssignment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Current Assignment:</strong> {currentAssignment.sales_rep_name}
                    <br />
                    <span className="text-xs">Assigned: {new Date(currentAssignment.assignedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Sales Representative
                </label>
                <select
                  value={selectedSalesRepId}
                  onChange={(e) => setSelectedSalesRepId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  required
                >
                  <option value="">Select a sales rep</option>
                  {salesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} - {rep.email}
                    </option>
                  ))}
                </select>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={saving || !selectedSalesRepId}
            >
              {saving ? 'Assigning...' : currentAssignment ? 'Reassign' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientsListPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [outletAccounts, setOutletAccounts] = useState<{id: number; name: string}[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [jumpPage, setJumpPage] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [assignSalesRepModalOpen, setAssignSalesRepModalOpen] = useState(false);
  const [selectedClientForAssignment, setSelectedClientForAssignment] = useState<Client | null>(null);
  const [clientTypes, setClientTypes] = useState<{ id: number; name: string }[]>([]);


  // Fetch countries when modal opens
  useEffect(() => {
    if (modalOpen || editModalOpen) {
      // Note: This endpoint might need to be added to clientService
      fetch('/api/sales/countries')
        .then(res => res.json())
        .then(data => setCountries(data))
        .catch(err => console.error('Failed to fetch countries:', err));
    }
  }, [modalOpen, editModalOpen]);

  // Fetch regions and routes when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      const countryId = parseInt(selectedCountry);
      if (countryId) {
        fetch(`/api/sales/regions?country_id=${countryId}`)
          .then(res => res.json())
          .then(data => setRegions(data))
          .catch(err => console.error('Failed to fetch regions:', err));
        fetch(`/api/routes?country_id=${countryId}&limit=1000`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              setRoutes(data.data);
            } else {
              setRoutes([]);
            }
          })
          .catch(err => console.error('Failed to fetch routes:', err));
      } else {
        setRegions([]);
        setRoutes([]);
      }
    } else {
      setRegions([]);
      setRoutes([]);
    }
  }, [selectedCountry, countries]);

  // Fetch client types on mount
  useEffect(() => {
    // Note: This endpoint might need to be added to clientService
    fetch('/api/clients/types')
      .then(res => res.json())
      .then(data => setClientTypes(data))
      .catch(err => console.error('Failed to fetch client types:', err));
  }, []);

  // Fetch outlet accounts on mount
  useEffect(() => {
    fetch('/api/outlet-accounts')
      .then(res => res.json())
      .then(data => setOutletAccounts(data))
      .catch(err => console.error('Failed to fetch outlet accounts:', err));
  }, []);

  const fetchClients = async (pageNum = page, pageLimit = limit, searchTerm = search) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageLimit),
      });
      if (searchTerm) params.append('search', searchTerm);
      const res = await fetch(`/api/clients?${params.toString()}`);
      const data = await res.json();
      
      // Fetch sales rep assignments for all clients
      const clientsWithAssignments = await Promise.all(
        data.data.map(async (client: Client) => {
          try {
            const assignmentRes = await fetch(`/api/client-assignments/outlet/${client.id}`);
            if (!assignmentRes.ok) {
              throw new Error(`HTTP ${assignmentRes.status}`);
            }
            const assignmentData = await assignmentRes.json();
            
            return {
              ...client,
              salesRepAssignment: assignmentData.success && assignmentData.data.length > 0 ? assignmentData.data[0] : null
            };
          } catch (err) {
            console.error(`Failed to fetch assignment for client ${client.id}:`, err);
            return {
              ...client,
              salesRepAssignment: null
            };
          }
        })
      );
      
      setClients(clientsWithAssignments);
      setPage(data.page);
      setLimit(data.limit);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
    }
    setLoading(false);
  };

  useEffect(() => { fetchClients(page, limit, search); }, [page, limit, search]);

  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages) setPage(page + 1); };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };
  const handleJumpPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJumpPage(e.target.value.replace(/[^0-9]/g, ''));
  };
  const handleJumpPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(jumpPage);
    if (num >= 1 && num <= totalPages) {
      setPage(num);
    }
    setJumpPage('');
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value);
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleAdd = async (data: Omit<Client, 'id' | 'created_at'>) => {
    setSubmitting(true);
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      setModalOpen(false);
      await fetchClients();
    } catch (err: any) {
      setError(err.message || 'Failed to add client');
    }
    setSubmitting(false);
  };

  const handleEditClick = (client: Client) => {
    setEditClient(client);
    setEditModalOpen(true);
    setEditError(null);
    // Set the selected country for the edit modal
    setSelectedCountry(client.countryId.toString());
  };

  const handleEditSave = async (updated: Client) => {
    setEditLoading(true);
    setEditError(null);
    try {
      await fetch(`/api/clients/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updated),
      });
      setEditModalOpen(false);
      setEditClient(null);
      await fetchClients();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update client');
    }
    setEditLoading(false);
  };

  const handleDeleteClient = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      await fetchClients();
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    }
  };

  const handleAssignSalesRep = (client: Client) => {
    setSelectedClientForAssignment(client);
    setAssignSalesRepModalOpen(true);
  };

  const handleAssignmentSuccess = () => {
    // Refresh clients to show updated assignment info
    fetchClients(page, limit, search);
  };

  const refreshClientAssignment = async (clientId: number) => {
    try {
      const assignmentRes = await fetch(`/api/client-assignments/outlet/${clientId}`);
      const assignmentData = await assignmentRes.json();
      
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? {
                ...client,
                salesRepAssignment: assignmentData.success && assignmentData.data.length > 0 ? assignmentData.data[0] : null
              }
            : client
        )
      );
    } catch (err) {
      console.error(`Failed to refresh assignment for client ${clientId}:`, err);
    }
  };



  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">Manage your client relationships and information</p>
          </div>
          
          <div className="flex items-center gap-3">

            
            <Link
              to="/client-activity"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Activity className="h-4 w-4" />
              Activity
            </Link>
            
            <button
              onClick={() => window.open('/clients-map', '_blank')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Map className="h-4 w-4" />
              Map View
            </button>
            
            <button 
              onClick={() => setModalOpen(true)} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                placeholder="Search clients by name, email, or contact..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span>{total} total clients</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Page {page} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Rep</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email || 'No email'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{client.contact}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{client.address || 'No address'}</div>
                        <div className="text-sm text-gray-500">{client.route_name_update || 'No route'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          Number(client.balance || 0) > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {Number(client.balance || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-900">
                          {client.credit_limit ? 
                            Number(client.credit_limit).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : 
                            'Not set'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{client.payment_terms || 'Not set'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{client.client_type_name || 'Not assigned'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{client.outlet_account_name || 'Not assigned'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {client.salesRepAssignment ? (
                            <div>
                              <div className="font-medium text-blue-600">
                                {client.salesRepAssignment.sales_rep_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Assigned: {new Date(client.salesRepAssignment.assignedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAssignSalesRep(client)}
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Assign sales rep"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(client)}
                            className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                        <p className="text-gray-600">Get started by adding your first client.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results</span>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={limit} 
                  onChange={handlePageSizeChange} 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrevPage} 
                    disabled={page === 1} 
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                  
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button 
                    onClick={handleNextPage} 
                    disabled={page === totalPages} 
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
        loading={submitting}
        countries={countries}
        regions={regions}
        routes={routes}
        outletAccounts={outletAccounts}
        onCountryChange={setSelectedCountry}
      />
      
      {editModalOpen && editClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Edit Client</h2>
              <p className="text-sm text-gray-600 mt-1">Update client information</p>
            </div>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSave(editClient);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={editClient.name}
                  onChange={e => setEditClient({ ...editClient, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editClient.email || ''}
                    onChange={e => setEditClient({ ...editClient, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input
                    type="text"
                    value={editClient.contact || ''}
                    onChange={e => setEditClient({ ...editClient, contact: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editClient.address || ''}
                  onChange={e => setEditClient({ ...editClient, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={editClient.countryId}
                  onChange={e => {
                    const countryId = parseInt(e.target.value);
                    setEditClient({ ...editClient, countryId });
                    setSelectedCountry(e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="">Select country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={editClient.region_id}
                    onChange={e => {
                      const regionId = parseInt(e.target.value);
                      const region = regions.find(r => r.id === regionId);
                      setEditClient({ 
                        ...editClient, 
                        region_id: regionId,
                        region: region?.name || ''
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={!editClient.countryId}
                  >
                    <option value="">{editClient.countryId ? 'Select region' : 'Select country first'}</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={editClient.route_id || ''}
                    onChange={e => {
                      const routeId = e.target.value ? parseInt(e.target.value) : undefined;
                      const route = routes.find(r => r.id === routeId);
                      setEditClient({ 
                        ...editClient, 
                        route_id: routeId,
                        route_name: route?.name || '',
                        route_id_update: routeId,
                        route_name_update: route?.name || ''
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={!editClient.countryId}
                  >
                    <option value="">{editClient.countryId ? 'Select route' : 'Select country first'}</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax PIN</label>
                <input
                  type="text"
                  value={editClient.tax_pin || ''}
                  onChange={e => setEditClient({ ...editClient, tax_pin: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                  <input
                    type="number"
                    value={editClient.credit_limit || ''}
                    onChange={e => setEditClient({ ...editClient, credit_limit: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter credit limit"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={editClient.payment_terms || ''}
                    onChange={e => setEditClient({ ...editClient, payment_terms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="e.g., Net 30, COD, etc."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                <select
                  value={editClient?.client_type ?? 0}
                  onChange={e => setEditClient(ec => ec ? { ...ec, client_type: Number(e.target.value) } : ec)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value={0}>Not assigned</option>
                  {clientTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Account</label>
                <select
                  value={editClient?.outlet_account ?? 0}
                  onChange={e => setEditClient(ec => ec ? { ...ec, outlet_account: Number(e.target.value) } : ec)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value={0}>Not assigned</option>
                  {outletAccounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
              
              {editError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{editError}</div>}
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditClient(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AssignSalesRepModal
        isOpen={assignSalesRepModalOpen}
        onClose={() => setAssignSalesRepModalOpen(false)}
        client={selectedClientForAssignment}
        onAssignmentSuccess={refreshClientAssignment}
      />
    </div>
  );
};

export default ClientsListPage; 