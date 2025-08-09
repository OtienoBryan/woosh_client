import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService, Client } from '../../services/clientService';
import { Eye, Building2, Filter as FilterIcon, X } from 'lucide-react';

interface ClientsTableProps {
  showBalances?: boolean;
  searchQuery?: string;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Dropdown filter state
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [routeFilter, setRouteFilter] = useState<string[]>([]);
  const [clientTypeFilter, setClientTypeFilter] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  // Temp filter state for modal
  const [tempCountry, setTempCountry] = useState<string[]>(countryFilter);
  const [tempRegion, setTempRegion] = useState<string[]>(regionFilter);
  const [tempRoute, setTempRoute] = useState<string[]>(routeFilter);
  const [tempClientType, setTempClientType] = useState<string[]>(clientTypeFilter);

  // Unique values for dropdowns
  const countryOptions = Array.from(new Set(clients.map(c => c.country_name).filter(Boolean))).sort();
  const regionOptions = Array.from(new Set(clients.map(c => c.region_name).filter(Boolean))).sort();
  const routeOptions = Array.from(new Set(clients.map(c => c.route_name).filter(Boolean))).sort();
  const clientTypeOptions = Array.from(new Set(clients.map(c => c.client_type_name).filter(Boolean))).sort();

  // Filtered clients based on search and dropdowns
  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (client.name && client.name.toLowerCase().includes(searchLower)) ||
      (client.company_name && client.company_name.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.address && client.address.toLowerCase().includes(searchLower));
    const matchesCountry = countryFilter.length === 0 || countryFilter.includes(client.country_name);
    const matchesRegion = regionFilter.length === 0 || regionFilter.includes(client.region_name);
    const matchesRoute = routeFilter.length === 0 || routeFilter.includes(client.route_name);
    const matchesClientType = clientTypeFilter.length === 0 || clientTypeFilter.includes(client.client_type_name);
    return matchesSearch && matchesCountry && matchesRegion && matchesRoute && matchesClientType;
  });
  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = filteredClients.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await clientService.getClients();
        setClients(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch clients');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Reset to first page when search changes
  useEffect(() => { setPage(1); }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
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
    <div className="flex flex-col">
      <div className="mb-4 flex justify-end">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-100"
          onClick={() => {
            setTempCountry(countryFilter);
            setTempRegion(regionFilter);
            setTempRoute(routeFilter);
            setTempClientType(clientTypeFilter);
            setShowFilterModal(true);
          }}
        >
          <FilterIcon className="w-4 h-4" />
          Filter
        </button>
      </div>
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowFilterModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Filter Clients</h2>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-gray-600 mb-2">
                Search is handled by the main search bar above. Use the filters below to refine results.
              </div>
              <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded border">
                Current search: "{searchQuery || 'None'}"
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  multiple
                  value={tempCountry}
                  onChange={e => setTempCountry(Array.from(e.target.selectedOptions, option => option.value))}
                  className="border border-gray-300 rounded px-3 py-2 min-w-[120px]"
                >
                  {countryOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  multiple
                  value={tempRegion}
                  onChange={e => setTempRegion(Array.from(e.target.selectedOptions, option => option.value))}
                  className="border border-gray-300 rounded px-3 py-2 min-w-[120px]"
                >
                  {regionOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  multiple
                  value={tempRoute}
                  onChange={e => setTempRoute(Array.from(e.target.selectedOptions, option => option.value))}
                  className="border border-gray-300 rounded px-3 py-2 min-w-[120px]"
                >
                  {routeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  multiple
                  value={tempClientType}
                  onChange={e => setTempClientType(Array.from(e.target.selectedOptions, option => option.value))}
                  className="border border-gray-300 rounded px-3 py-2 min-w-[120px]"
                >
                  {clientTypeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between mt-6 gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
                onClick={() => {
                  setTempCountry([]);
                  setTempRegion([]);
                  setTempRoute([]);
                  setTempClientType([]);
                }}
              >
                Clear Filters
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 border border-red-600"
                onClick={() => {
                  setCountryFilter(tempCountry);
                  setRegionFilter(tempRegion);
                  setRouteFilter(tempRoute);
                  setClientTypeFilter(tempClientType);
                  setShowFilterModal(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        {/* Filter controls removed from here; now only in modal */}
      </div>
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Premises
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map(client => (
                    <tr
                      key={client.id || client.customer_id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {client.name || client.company_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.address || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.country || client.country_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.region_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.route_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.client_type_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        {client.balance !== undefined && client.balance !== null && !isNaN(Number(client.balance))
                          ? Number(client.balance).toLocaleString(undefined, { style: 'currency', currency: 'KES' })
                          : Number(0).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/dashboard/clients/${client.id || client.customer_id}`)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination controls */}
            <div className="flex justify-center items-center mt-4 gap-2">
              <button
                className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsTable;