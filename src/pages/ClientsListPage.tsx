import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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
}

interface Country { id: number; name: string; }
interface Region { id: number; name: string; }
interface Route { id: number; name: string; }

const AddClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Client, 'id' | 'created_at'>) => void;
  loading: boolean;
  countries: Country[];
  regions: Region[];
  routes: Route[];
  onCountryChange: (country: string) => void;
}> = ({ isOpen, onClose, onSubmit, loading, countries, regions, routes, onCountryChange }) => {
  // Update form state to use new fields
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
  });
  // const [countries, setCountries] = useState<Country[]>([]); // This line is removed as it's now a prop
  // const [regions, setRegions] = useState<Region[]>([]); // This line is removed as it's now a prop
  // const [routes, setRoutes] = useState<Route[]>([]); // This line is removed as it's now a prop

  useEffect(() => {
    if (isOpen) {
      // axios.get('/api/sales/countries').then(res => setCountries(res.data)); // This line is removed as it's now a prop
      // setRegions([]); // This line is removed as it's now a prop
      // setRoutes([]); // This line is removed as it's now a prop
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', email: '', contact: '', address: '', region_id: 0, region: '', route_id: undefined, route_name: '', route_id_update: undefined, route_name_update: '', latitude: undefined, longitude: undefined, balance: undefined, tax_pin: '', location: '', status: 0, client_type: undefined, outlet_account: undefined, countryId: 0, added_by: undefined });
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Client</h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input type="tel" required value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select value={form.countryId} onChange={e => { setForm(f => ({ ...f, countryId: parseInt(e.target.value, 10) })); onCountryChange(e.target.value); }} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="">Select country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <select value={form.region_id} onChange={e => setForm(f => ({ ...f, region_id: parseInt(e.target.value, 10) }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" disabled={!form.countryId}>
                <option value="">{form.countryId ? 'Select region' : 'Select country first'}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Route</label>
              <select value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: parseInt(e.target.value, 10) }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" disabled={!form.countryId}>
                <option value="">{form.countryId ? 'Select route' : 'Select country first'}</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Add'}</button>
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
  // Add these states to ClientsListPage so handleAdd can access them
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  // Track selected country for modal
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  // Add pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // Add state for jump-to-page input
  const [jumpPage, setJumpPage] = useState('');
  // Add search state
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // Add state for client types
  const [clientTypes, setClientTypes] = useState<{ id: number; name: string }[]>([]);

  // Fetch countries when modal opens
  useEffect(() => {
    if (modalOpen) {
      axios.get('/api/sales/countries').then(res => setCountries(res.data));
    }
  }, [modalOpen]);

  // Fetch regions and routes when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      const countryObj = countries.find(c => c.name === selectedCountry);
      if (countryObj) {
        axios.get('/api/sales/regions', { params: { country_id: countryObj.id } }).then(res => setRegions(res.data));
        axios.get('/api/sales/routes', { params: { country_id: countryObj.id } }).then(res => setRoutes(res.data));
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
    axios.get('/api/clients/types').then(res => setClientTypes(res.data));
  }, []);

  // Update fetchClients to accept search
  const fetchClients = async (pageNum = page, pageLimit = limit, searchTerm = search) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageLimit),
      });
      if (searchTerm) params.append('search', searchTerm);
      const res = await axios.get(`/api/clients?${params.toString()}`);
      setClients(res.data.data);
      setPage(res.data.page);
      setLimit(res.data.limit);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
    }
    setLoading(false);
  };

  // Fetch clients when page, limit, or search changes
  useEffect(() => { fetchClients(page, limit, search); }, [page, limit, search]);

  // Pagination controls
  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages) setPage(page + 1); };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1); // Reset to first page when page size changes
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

  // Search handlers
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
      // Use the correct fields for the payload
      await axios.post('/api/clients', data);
      setModalOpen(false);
      await fetchClients();
    } catch (err: any) {
      setError(err.message || 'Failed to add client');
    }
    setSubmitting(false);
  };

  // Edit button handler
  const handleEditClick = (client: Client) => {
    setEditClient(client);
    setEditModalOpen(true);
    setEditError(null);
  };

  // Edit modal save handler
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

  return (
    <div className="max-w-8xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold">Clients</h1>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchInputChange}
            placeholder="Search clients..."
            className="border rounded px-3 py-1"
          />
          <button type="submit" className="px-3 py-1 border rounded bg-blue-600 text-white">Search</button>
          {search && (
            <button type="button" onClick={handleClearSearch} className="px-3 py-1 border rounded bg-gray-200">Clear</button>
          )}
        </form>
        <div className="flex items-center gap-2">
          <Link
            to="/client-activity"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Client Activity
          </Link>
          <button
            onClick={() => window.open('/clients-map', '_blank')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            View on Map
          </button>
          <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Client</button>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 mb-4">{error}</div>
      ) : (
        <div className="bg-white shadow overflow-x-auto sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.address || <span className="text-gray-400">Not specified</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.region || <span className="text-gray-400">Not specified</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.route_name_update || <span className="text-gray-400">Not specified</span>}</td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      Number(client.balance || 0) > 0 ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {Number(client.balance || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.client_type === 0
                      ? <span className="text-gray-400">Not assigned</span>
                      : (client.client_type_name || <span className="text-gray-400">Not specified</span>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.created_at ? new Date(client.created_at).toLocaleDateString() : <span className="text-gray-400">-</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(client)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevPage} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <span>Page {page} of {totalPages} (Total: {total})</span>
            <button onClick={handleNextPage} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm">Page size:</label>
            <select id="pageSize" value={limit} onChange={handlePageSizeChange} className="border rounded px-2 py-1">
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <form onSubmit={handleJumpPageSubmit} className="flex items-center gap-1">
              <label htmlFor="jumpPage" className="text-sm">Jump to:</label>
              <input
                id="jumpPage"
                type="text"
                value={jumpPage}
                onChange={handleJumpPageChange}
                className="border rounded px-2 py-1 w-16"
                placeholder="Page #"
              />
              <button type="submit" className="px-2 py-1 border rounded">Go</button>
            </form>
          </div>
        </div>
      )}
      <AddClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
        loading={submitting}
        countries={countries}
        regions={regions}
        routes={routes}
        onCountryChange={setSelectedCountry}
      />
      {editModalOpen && editClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Client</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSave(editClient);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={editClient.name}
                    onChange={e => setEditClient({ ...editClient, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editClient.email || ''}
                    onChange={e => setEditClient({ ...editClient, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact</label>
                  <input
                    type="text"
                    value={editClient.contact || ''}
                    onChange={e => setEditClient({ ...editClient, contact: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={editClient.address || ''}
                    onChange={e => setEditClient({ ...editClient, address: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax PIN</label>
                  <input
                    type="text"
                    value={editClient.tax_pin || ''}
                    onChange={e => setEditClient({ ...editClient, tax_pin: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Type</label>
                  <select
                    value={editClient?.client_type ?? 0}
                    onChange={e => setEditClient(ec => ec ? { ...ec, client_type: Number(e.target.value) } : ec)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>Not assigned</option>
                    {clientTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {editError && <div className="text-red-600 mt-2">{editError}</div>}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditClient(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsListPage; 