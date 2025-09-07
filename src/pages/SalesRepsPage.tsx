import React, { useEffect, useState } from 'react';
import { salesService, SalesRep, CreateSalesRepData, Country, Region, Route as SalesRoute } from '../services/salesService';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { saveAs } from 'file-saver';

interface SalesRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesRep?: SalesRep;
  onSubmit: (data: CreateSalesRepData) => void;
  loading: boolean;
}

const SalesRepModal: React.FC<SalesRepModalProps> = ({ 
  isOpen, 
  onClose, 
  salesRep, 
  onSubmit, 
  loading 
}) => {
  const [formData, setFormData] = useState<CreateSalesRepData & { status?: number }>({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    region: '',
    route_name_update: '',
    photoUrl: '',
    status: 1,
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [routes, setRoutes] = useState<SalesRoute[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      salesService.getCountries().then(setCountries);
      salesService.getRoutes().then(setRoutes);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.country) {
      const selectedCountry = countries.find(c => c.name === formData.country);
      if (selectedCountry) {
        salesService.getRegions(selectedCountry.id).then(setRegions);
      } else {
        setRegions([]);
      }
    } else {
      setRegions([]);
    }
  }, [formData.country, countries]);

  useEffect(() => {
    if (salesRep) {
      setFormData({
        name: salesRep.name,
        email: salesRep.email,
        phoneNumber: salesRep.phoneNumber || '',
        country: salesRep.country || '',
        region: salesRep.region || '',
        route_name_update: salesRep.route_name_update || '',
        photoUrl: salesRep.photoUrl || '',
        status: salesRep.status ?? 1,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        country: '',
        region: '',
        route_name_update: '',
        photoUrl: '',
        status: 1,
      });
    }
  }, [salesRep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {salesRep ? 'Edit Sales Rep' : 'Add New Sales Rep'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="number"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value, region: '' })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <select
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.country}
              >
                <option value="">{formData.country ? 'Select region' : 'Select country first'}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Route</label>
              <select
                value={formData.route_name_update}
                onChange={e => setFormData({ ...formData, route_name_update: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select route</option>
                {routes.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setUploadError(null);
                  const formData = new FormData();
                  formData.append('photo', file);
                  try {
                    const res = await fetch('/api/sales/sales-reps/upload-photo', {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.url) {
                      setFormData((prev) => ({ ...prev, photoUrl: data.url }));
                    } else {
                      setUploadError(data.error || 'Upload failed');
                    }
                  } catch (err: any) {
                    setUploadError(err.message || 'Upload failed');
                  }
                  setUploading(false);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {uploading && <div className="text-blue-600 text-sm mt-1">Uploading...</div>}
              {uploadError && <div className="text-red-600 text-sm mt-1">{uploadError}</div>}
              {formData.photoUrl && (
                <div className="mt-2">
                  <img src={formData.photoUrl} alt="Preview" className="h-16 w-16 rounded-full object-cover border" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={formData.status === 1}
                  onChange={e => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  id="status-toggle"
                />
                <label htmlFor="status-toggle" className="ml-2 text-sm">
                  {formData.status === 1 ? 'Active' : 'Inactive'}
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (salesRep ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Manager {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  managerType?: string;
}

const AssignManagersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  salesRepId: number | null;
}> = ({ isOpen, onClose, salesRepId }) => {
  const [allManagers, setAllManagers] = useState<Manager[]>([]);
  const [assignments, setAssignments] = useState<{ manager_id: number; manager_type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const managerTypes = ['Retail', 'Distribution', 'Key Account'];

  useEffect(() => {
    if (isOpen && salesRepId) {
      setLoading(true);
      Promise.all([
        axios.get('/api/managers'),
        axios.get(`/api/sales/sales-reps/${salesRepId}/managers`)
      ]).then(([allRes, assignedRes]) => {
        setAllManagers(allRes.data);
        setAssignments(
          assignedRes.data.map((a: any) => ({ manager_id: a.manager_id, manager_type: a.manager_type }))
        );
      }).finally(() => setLoading(false));
    }
  }, [isOpen, salesRepId]);

  const isAssigned = (managerId: number) => assignments.some(a => a.manager_id === managerId);
  const getType = (managerId: number) => assignments.find(a => a.manager_id === managerId)?.manager_type || '';

  const handleToggle = (managerId: number) => {
    if (isAssigned(managerId)) {
      setAssignments(assignments.filter(a => a.manager_id !== managerId));
    } else {
      setAssignments([...assignments, { manager_id: managerId, manager_type: 'Retail' }]);
    }
  };

  const handleTypeChange = (managerId: number, type: string) => {
    setAssignments(assignments.map(a => a.manager_id === managerId ? { ...a, manager_type: type } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesRepId) return;
    setSaving(true);
    try {
      await axios.post(`/api/sales/sales-reps/${salesRepId}/managers`, { assignments });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !salesRepId) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Assign Managers</h2>
        {loading ? <div>Loading...</div> : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allManagers.map(manager => (
                <div key={manager.id} className="flex items-center gap-4 border-b py-2">
                  <input
                    type="checkbox"
                    checked={isAssigned(manager.id)}
                    onChange={() => handleToggle(manager.id)}
                    className="h-4 w-4"
                  />
                  <span className="flex-1">{manager.name} <span className="text-xs text-gray-500">({manager.email})</span></span>
                  {isAssigned(manager.id) && (
                    <select
                      value={getType(manager.id)}
                      onChange={e => handleTypeChange(manager.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {managerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              {allManagers.length === 0 && <div className="text-gray-500">No managers available.</div>}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const SalesRepsPage: React.FC = () => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState<SalesRep | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<number | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('Kenya'); // Default to Kenya
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [routes, setRoutes] = useState<SalesRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [salesRepManagers, setSalesRepManagers] = useState<Record<number, { id: number; name: string }[]>>({});

  // 1. Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  // 1. Add state for records per page
  const [repsPerPage, setRepsPerPage] = useState(10);
  const recordsPerPageOptions = [10, 20, 50, 100];

  // 1. Add status filter state
  const [selectedStatus, setSelectedStatus] = useState<'1' | '0' | ''>('1'); // '1' = active, '0' = inactive, '' = all
  const [pendingStatus, setPendingStatus] = useState<'1' | '0' | ''>('1');

  // 2. Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountry, selectedRegion, selectedRoute, selectedManager, salesReps]);

  // 3. Reset to page 1 when repsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [repsPerPage]);

  // 2. Update filter logic to include status
  const filteredSalesReps = salesReps.filter(rep => {
    const statusMatch = selectedStatus !== '' ? String(rep.status ?? 1) === selectedStatus : true;
    const countryMatch = selectedCountry ? rep.country === selectedCountry : true;
    const regionMatch = selectedRegion ? rep.region === selectedRegion : true;
    const routeMatch = selectedRoute ? rep.route_name_update === selectedRoute : true;
    const managerMatch = selectedManager
      ? (salesRepManagers[rep.id] || []).some(m => String(m.id) === selectedManager)
      : true;
    return statusMatch && countryMatch && regionMatch && routeMatch && managerMatch;
  });

  // 3. Paginate filtered sales reps
  const totalPages = Math.ceil(filteredSalesReps.length / repsPerPage);
  const paginatedSalesReps = filteredSalesReps.slice((currentPage - 1) * repsPerPage, currentPage * repsPerPage);

  // 4. Add pagination controls below the table

  // 5. Remove the inline filter controls from the main page, and add a 'Filter' button */
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // 6. Move filter states (selectedCountry, selectedRegion, selectedRoute, selectedManager) into a local state for the modal
  const [pendingCountry, setPendingCountry] = useState(selectedCountry);
  const [pendingRegion, setPendingRegion] = useState(selectedRegion);
  const [pendingRoute, setPendingRoute] = useState(selectedRoute);
  const [pendingManager, setPendingManager] = useState(selectedManager);

  // 7. When opening the modal, sync pending states with current filter states
  const openFilterModal = () => {
    setPendingCountry(selectedCountry);
    setPendingRegion(selectedRegion);
    setPendingRoute(selectedRoute);
    setPendingManager(selectedManager);
    setPendingStatus(selectedStatus);
    setFilterModalOpen(true);
  };

  // 8. When applying, set the real filter states and close the modal
  const applyFilters = () => {
    setSelectedCountry(pendingCountry);
    setSelectedRegion(pendingRegion);
    setSelectedRoute(pendingRoute);
    setSelectedManager(pendingManager);
    setSelectedStatus(pendingStatus);
    setFilterModalOpen(false);
  };

  // 9. When clearing, reset all pending and real filter states
  const clearFilters = () => {
    setPendingCountry('Kenya'); // Reset to Kenya instead of empty
    setPendingRegion('');
    setPendingRoute('');
    setPendingManager('');
    setPendingStatus('1');
    setSelectedCountry('Kenya'); // Reset to Kenya instead of empty
    setSelectedRegion('');
    setSelectedRoute('');
    setSelectedManager('');
    setSelectedStatus('1');
    setFilterModalOpen(false);
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Phone Number',
      'Country',
      'Region',
      'Route',
      'Status'
    ];
    const rows = filteredSalesReps.map(rep => [
      rep.name,
      rep.email,
      rep.phoneNumber,
      rep.country || '',
      rep.region || '',
      rep.route_name_update || '',
      rep.status === 1 ? 'Active' : 'Inactive'
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'sales_reps.csv');
  };

  useEffect(() => {
    salesService.getCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const countryObj = countries.find(c => c.name === selectedCountry);
      if (countryObj) {
        salesService.getRegions(countryObj.id).then(setRegions);
      } else {
        setRegions([]);
      }
      setSelectedRegion(''); // Reset region when country changes
    } else {
      setRegions([]);
      setSelectedRegion('');
    }
  }, [selectedCountry, countries]);

  useEffect(() => {
    salesService.getRoutes().then(setRoutes);
  }, []);

  useEffect(() => {
    axios.get('/api/managers').then(res => setManagers(res.data));
  }, []);

  useEffect(() => {
    const fetchManagersForReps = async () => {
      const mapping: Record<number, { id: number; name: string }[]> = {};
      await Promise.all(salesReps.map(async (rep) => {
        try {
          const res = await axios.get(`/api/sales/sales-reps/${rep.id}/managers`);
          mapping[rep.id] = (res.data || []).map((m: any) => ({ id: m.manager_id, name: m.name }));
        } catch {
          mapping[rep.id] = [];
        }
      }));
      setSalesRepManagers(mapping);
    };
    if (salesReps.length > 0) fetchManagersForReps();
  }, [salesReps]);

  const fetchSalesReps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesService.getAllSalesReps();
      setSalesReps(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales reps');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const handleCreate = () => {
    setEditingSalesRep(undefined);
    setModalOpen(true);
  };

  const handleEdit = (salesRep: SalesRep) => {
    setEditingSalesRep(salesRep);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sales rep?')) return;
    
    try {
      await salesService.deleteSalesRep(id);
      await fetchSalesReps();
    } catch (err: any) {
      setError(err.message || 'Failed to delete sales rep');
    }
  };

  const handleSubmit = async (data: CreateSalesRepData & { status?: number }) => {
    setSubmitting(true);
    try {
      if (editingSalesRep) {
        await salesService.updateSalesRep({ ...data, id: editingSalesRep.id });
        if (data.status !== undefined && data.status !== editingSalesRep.status) {
          await salesService.updateSalesRepStatus(editingSalesRep.id, data.status);
        }
      } else {
        await salesService.createSalesRep(data);
      }
      setModalOpen(false);
      await fetchSalesReps();
    } catch (err: any) {
      setError(err.message || 'Failed to save sales rep');
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          {selectedCountry === 'Kenya' && (
            <>
              <img src="/kenya_flag.jpeg" alt="Kenya Flag" className="h-8 w-auto inline-block align-middle rounded shadow" />
              Kenya Sales Representatives
            </>
          )}
          {selectedCountry === 'Tanzania' && (
            <>
              <img src="/tz_flag.jpeg" alt="Tanzania Flag" className="h-8 w-auto inline-block align-middle rounded shadow" />
              Tanzania Sales Representatives
            </>
          )}
          {selectedCountry !== 'Kenya' && selectedCountry !== 'Tanzania' && 'Sales Representatives'}
        </h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Sales Rep
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 10. Add the filter button and the filter modal */}
      <div className="mb-4 flex items-center gap-4">
        <Link
          to="/overall-attendance"
          className="bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded shadow hover:bg-blue-200"
        >
          Overall Attendance
        </Link>
        <Link
          to="/sales-rep-working-days"
          className="bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded shadow hover:bg-blue-200"
        >
          Sales Rep Working Days
        </Link>
        {/* <Link
          to="/sales-rep-performance"
          className="bg-purple-100 text-purple-700 font-semibold px-4 py-2 rounded shadow hover:bg-purple-200"
        >
          Sales Rep Performance
        </Link> */}
        <Link
          to="/shared-performance"
          className="bg-pink-100 text-pink-700 font-semibold px-4 py-2 rounded shadow hover:bg-pink-200"
        >
          Sales Rep Performance
        </Link>
        {/* <Link
          to="/managers-performance"
          className="bg-green-100 text-green-700 font-semibold px-4 py-2 rounded shadow hover:bg-green-200"
        >
          Managers Performance
        </Link> */}
        <button
          onClick={openFilterModal}
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-200"
        >
          Filter
        </button>
        <button
          onClick={exportToCSV}
          className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 border border-green-300"
        >
          Export to CSV
        </button>
        <label htmlFor="records-per-page" className="text-sm font-medium text-gray-700">Show:</label>
        <select
          id="records-per-page"
          className="border border-gray-300 rounded px-2 py-1"
          value={repsPerPage}
          onChange={e => setRepsPerPage(Number(e.target.value))}
        >
          {recordsPerPageOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <span className="text-sm text-gray-700">per page</span>
      </div>

      {/* Country filter buttons at the top */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`px-3 py-1 rounded-md border text-sm ${selectedCountry === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
          onClick={() => setSelectedCountry('')}
        >
          All Countries
        </button>
        {countries.map(c => (
          <button
            key={c.id}
            type="button"
            className={`px-3 py-1 rounded-md border text-sm ${selectedCountry === c.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
            onClick={() => setSelectedCountry(c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading sales reps...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto w-full">
          <table className="min-w-full w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSalesReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rep.photoUrl ? (
                        <img
                          src={rep.photoUrl}
                          alt={rep.name}
                          className="h-10 w-10 rounded-full object-cover cursor-pointer"
                          onClick={() => setExpandedPhotoUrl(rep.photoUrl!)}
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/40x40?text=' + rep.name.charAt(0);
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {rep.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rep.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rep.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rep.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {rep.country && <span>{rep.country}</span>}
                        {rep.country && rep.region && <span>, </span>}
                        {rep.region && <span>{rep.region}</span>}
                        {!rep.country && !rep.region && <span className="text-gray-400">Not specified</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {rep.route_name_update || <span className="text-gray-400">Not specified</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {rep.status === 1 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        ) : rep.status === 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>
                        )}
                        <span className="text-xs text-gray-400 ml-1">({rep.status ?? 'undefined'})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/sales-reps/${rep.id}`}
                        className="bg-indigo-100 text-indigo-700 font-semibold px-3 py-1 rounded mr-2 hover:bg-indigo-200 transition"
                      >
                        View Details
                      </Link>
                      {/* <button
                        onClick={() => { setSelectedSalesRepId(rep.id); setAssignModalOpen(true); }}
                        className="bg-green-100 text-green-700 font-semibold px-3 py-1 rounded mr-2 hover:bg-green-200 transition"
                      >
                        Assign Managers
                      </button> */}
                      <button
                        onClick={() => handleEdit(rep)}
                        className="bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded mr-2 hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rep.id)}
                        className="bg-red-100 text-red-700 font-semibold px-3 py-1 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedSalesReps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No sales representatives found for this country.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      {/* 11. Add pagination controls below the table */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 my-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded border ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border bg-gray-100 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <SalesRepModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        salesRep={editingSalesRep}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <AssignManagersModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        salesRepId={selectedSalesRepId}
      />

      {/* 12. Add the modal JSX at the end of the component */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Filter Sales Reps</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  id="status-filter"
                  value={pendingStatus}
                  onChange={e => setPendingStatus(e.target.value as '1' | '0' | '')}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                  <option value="">All</option>
                </select>
              </div>
              <div>
                <label htmlFor="country-filter" className="text-sm font-medium text-gray-700">Country:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-md border text-sm ${pendingCountry === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    onClick={() => setPendingCountry('')}
                  >
                    All Countries
                  </button>
                  {countries.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`px-3 py-1 rounded-md border text-sm ${pendingCountry === c.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                      onClick={() => setPendingCountry(c.name)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="region-filter" className="text-sm font-medium text-gray-700">Region:</label>
                <select
                  id="region-filter"
                  value={pendingRegion}
                  onChange={e => setPendingRegion(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!pendingCountry}
                >
                  <option value="">All Regions</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="route-filter" className="text-sm font-medium text-gray-700">Route:</label>
                <select
                  id="route-filter"
                  value={pendingRoute}
                  onChange={e => setPendingRoute(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Routes</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="manager-filter" className="text-sm font-medium text-gray-700">Manager:</label>
                <select
                  id="manager-filter"
                  value={pendingManager}
                  onChange={e => setPendingManager(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Managers</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Photo Modal */}
      {expandedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setExpandedPhotoUrl(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img src={expandedPhotoUrl} alt="Sales Rep" className="max-w-full max-h-[80vh] rounded shadow-lg" />
            <button
              onClick={() => setExpandedPhotoUrl(null)}
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRepsPage; 