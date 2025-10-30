import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Plus,
  Route,
  DollarSign,
  Edit,
  Trash2,
  X,
  ChevronDown,
  Users,
  Map,
  Activity,
  Eye,
  UserPlus,
  ChevronUp,
  ArrowUpDown
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
  outletAccounts: { id: number; name: string }[];
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
        axios.get('/api/sales-reps?status=1').then(res => res.data),
        axios.get(`/api/client-assignments/outlet/${client.id}`).then(res => res.data)
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
      const response = await axios.post('/api/client-assignments', {
        outletId: client.id,
        salesRepId: selectedSalesRepId
      });

      const result = response.data;

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
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [outletAccounts, setOutletAccounts] = useState<{ id: number; name: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [assignSalesRepModalOpen, setAssignSalesRepModalOpen] = useState(false);
  const [selectedClientForAssignment, setSelectedClientForAssignment] = useState<Client | null>(null);
  const [clientTypes, setClientTypes] = useState<{ id: number; name: string }[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');


  // Fetch countries when modal opens
  useEffect(() => {
    if (modalOpen || editModalOpen) {
      // Note: This endpoint might need to be added to clientService
      axios.get('/api/sales/countries')
        .then(res => setCountries(res.data))
        .catch(err => console.error('Failed to fetch countries:', err));
    }
  }, [modalOpen, editModalOpen]);

  // Fetch regions and routes when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      const countryId = parseInt(selectedCountry);
      if (countryId) {
        axios.get(`/api/sales/regions?country_id=${countryId}`)
          .then(res => setRegions(res.data))
          .catch(err => console.error('Failed to fetch regions:', err));
        axios.get(`/api/routes?country_id=${countryId}&limit=1000`)
          .then(res => {
            const data = res.data;
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

  // Fetch client types and outlet accounts in parallel on mount
  useEffect(() => {
    Promise.all([
      axios.get('/api/clients/types'),
      axios.get('/api/outlet-accounts')
    ])
      .then(([typesRes, accountsRes]) => {
        setClientTypes(typesRes.data);
        setOutletAccounts(accountsRes.data);
      })
      .catch(err => console.error('Failed to fetch initial data:', err));
  }, []);

  const fetchClients = async (pageNum = page, pageLimit = limit, searchTerm = search, sortFieldParam = sortField, sortOrderParam = sortOrder) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: pageNum,
        limit: pageLimit,
      };
      if (searchTerm) params.search = searchTerm;
      if (sortFieldParam) {
        params.sortField = sortFieldParam;
        params.sortOrder = sortOrderParam;
      }
      const res = await axios.get('/api/clients', { params });
      const data = res.data;

      // Transform clients data - assignment info is now included in the main query
      const clientsWithAssignments = data.data.map((client: any) => {
        // If there's an assignment, structure it properly
        const salesRepAssignment = client.assignment_id ? {
          id: client.assignment_id,
          salesRepId: client.assignment_salesRepId,
          assignedAt: client.assignment_assignedAt,
          sales_rep_name: client.sales_rep_name,
          sales_rep_email: client.sales_rep_email,
          sales_rep_phone: client.sales_rep_phone
        } : null;

        // Remove the flattened assignment fields from the client object
        const { assignment_id, assignment_salesRepId, assignment_assignedAt, sales_rep_name, sales_rep_email, sales_rep_phone, ...clientData } = client;

        return {
          ...clientData,
          salesRepAssignment
        };
      });

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

  useEffect(() => { fetchClients(page, limit, search, sortField, sortOrder); }, [page, limit, search, sortField, sortOrder]);

  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages) setPage(page + 1); };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleAdd = async (data: Omit<Client, 'id' | 'created_at'>) => {
    setSubmitting(true);
    try {
      await axios.post('/api/clients', data);
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
      await axios.put(`/api/clients/${updated.id}`, updated);
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
      await axios.delete(`/api/clients/${id}`);
      await fetchClients();
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    }
  };

  const handleAssignSalesRep = (client: Client) => {
    setSelectedClientForAssignment(client);
    setAssignSalesRepModalOpen(true);
  };


  const refreshClientAssignment = async (clientId: number) => {
    try {
      const assignmentRes = await axios.get(`/api/client-assignments/outlet/${clientId}`);
      const assignmentData = assignmentRes.data;

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
    <div className="w-full py-4 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clients</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage your client relationships and information</p>
          </div>

          <div className="flex items-center gap-2">


            <Link
              to="/client-activity"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Activity className="h-3.5 w-3.5" />
              Activity
            </Link>

            <button
              onClick={() => window.open('/clients-map', '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Map className="h-3.5 w-3.5" />
              Map View
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                placeholder="Search clients by name, email, or contact..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-green-600" />
              <span>{total} total clients</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
              <span>Page {page} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th 
                      className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('balance')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Balance
                        {sortField === 'balance' ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Outlet Account</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Sales Rep</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-gray-900 font-mono">
                          CUS{client.id.toString().padStart(6, '0')}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <div className="text-xs font-medium text-gray-900">{client.name}</div>
                          <div className="text-[10px] text-gray-500">{client.email || 'No email'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-900">{client.contact}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-900">{client.address || 'No address'}</div>
                        <div className="text-[10px] text-gray-500">{client.route_name_update || 'No route'}</div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${Number(client.balance || 0) > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {Number(client.balance || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-xs text-gray-900">
                          {client.credit_limit ?
                            Number(client.credit_limit).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) :
                            'Not set'
                          }
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-900">{client.payment_terms || 'Not set'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-900">{client.client_type_name || 'Not assigned'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-900">{client.outlet_account_name || 'Not assigned'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-900">
                          {client.salesRepAssignment ? (
                            <div>
                              <div className="font-medium text-blue-600 text-xs">
                                {client.salesRepAssignment.sales_rep_name}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Assigned: {new Date(client.salesRepAssignment.assignedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleAssignSalesRep(client)}
                            className="p-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Assign sales rep"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(client)}
                            className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Edit client"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete client"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-900 mb-1">No clients found</h3>
                        <p className="text-xs text-gray-600">Get started by adding your first client.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <span>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={limit}
                  onChange={handlePageSizeChange}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                  </button>

                  <span className="px-2.5 py-1.5 text-xs text-gray-700">
                    Page {page} of {totalPages}
                  </span>


                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
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