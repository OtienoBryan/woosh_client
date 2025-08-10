import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, Eye, Calendar, DollarSign, User, Building, X, Package, Receipt } from 'lucide-react';
import { creditNoteService } from '../services/creditNoteService';

interface CreditNoteItem {
  product_id: number;
  product?: any;
  invoice_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreditNote {
  id: number;
  credit_note_number: string;
  customer_id: number;
  customer_name?: string;
  credit_note_date: string;
  reason?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  email?: string;
  contact?: string;
  address?: string;
  items?: CreditNoteItem[];
}

interface CreditNoteDetails {
  id: number;
  credit_note_number: string;
  customer_id: number;
  customer_name?: string;
  credit_note_date: string;
  reason?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  email?: string;
  contact?: string;
  address?: string;
  items?: CreditNoteItem[];
}

const CreditNoteSummaryPage: React.FC = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNoteDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const response = await creditNoteService.getAll();
      setCreditNotes(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch credit notes');
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditNotes = creditNotes.filter(note => {
    const matchesSearch = (note.credit_note_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && note.credit_note_date) {
      const noteDate = new Date(note.credit_note_date);
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = noteDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
          matchesDate = noteDate >= weekAgo;
          break;
        case 'month':
          matchesDate = noteDate >= thirtyDaysAgo;
          break;
        case 'quarter':
          matchesDate = noteDate >= ninetyDaysAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const paginatedCreditNotes = filteredCreditNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'applied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotals = () => {
    return filteredCreditNotes.reduce((acc, note) => {
      acc.totalAmount += note.total_amount || 0;
      acc.count += 1;
      return acc;
    }, { totalAmount: 0, count: 0 });
  };

  const totals = calculateTotals();

  const handleViewDetails = async (creditNote: CreditNote) => {
    setModalLoading(true);
    setShowModal(true);
    
    try {
      const response = await creditNoteService.getById(creditNote.id);
      if (response.success) {
        setSelectedCreditNote(response.data);
      } else {
        setError('Failed to fetch credit note details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch credit note details');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCreditNote(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Credit Note Summary</h1>
              <p className="text-base text-gray-500">View and manage all credit notes in the system</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Credit Notes</p>
                <p className="text-2xl font-bold text-gray-900">{totals.count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creditNotes.filter(note => {
                    if (!note.credit_note_date) return false;
                    const noteDate = new Date(note.credit_note_date);
                    const today = new Date();
                    return noteDate.getMonth() === today.getMonth() && 
                           noteDate.getFullYear() === today.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(creditNotes.map(note => note.customer_id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search credit notes, clients, or reasons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="applied">Applied</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={fetchCreditNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  // TODO: Implement export functionality
                  alert('Export functionality coming soon');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Credit Notes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Credit Notes</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredCreditNotes.length} of {creditNotes.length} credit notes
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading credit notes...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchCreditNotes}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredCreditNotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No credit notes found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Note
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCreditNotes.map((note) => (
                      <tr key={note.id || `note-${Math.random()}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {note.credit_note_number || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">ID: {note.id || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {note.customer_name || 'Unknown Customer'}
                          </div>
                          <div className="text-sm text-gray-500">ID: {note.customer_id || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {note.credit_note_date ? formatDate(note.credit_note_date) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(note.total_amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(note.status)}`}>
                            {note.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={note.reason || 'No reason provided'}>
                            {note.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                                                                                      <button
                              onClick={() => handleViewDetails(note)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                              <button
                                onClick={() => {
                                  // TODO: Implement edit functionality
                                  alert(`Edit credit note ${note.credit_note_number || note.id || 'Unknown'}`);
                                }}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="Edit"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Edit
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCreditNotes.length)} of {filteredCreditNotes.length} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                              pageNum === currentPage
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Credit Note Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Credit Note Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedCreditNote ? (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Credit Note Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number:</span>
                        <span className="font-medium">{selectedCreditNote.credit_note_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {selectedCreditNote.credit_note_date ? formatDate(selectedCreditNote.credit_note_date) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCreditNote.status)}`}>
                          {selectedCreditNote.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reason:</span>
                        <span className="font-medium">{selectedCreditNote.reason || 'No reason provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedCreditNote.customer_name || 'Unknown Customer'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{selectedCreditNote.customer_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedCreditNote.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium">{selectedCreditNote.contact || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-3">Financial Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Subtotal</p>
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedCreditNote.subtotal || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Tax Amount</p>
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedCreditNote.tax_amount || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(selectedCreditNote.total_amount || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Credit Note Items */}
                {selectedCreditNote.items && selectedCreditNote.items.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Credit Note Items</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedCreditNote.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center">
                                  <Package className="h-4 w-4 text-gray-400 mr-2" />
                                  <span>{item.product?.product_name || `Product ${item.product_id}`}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center">
                                  <Receipt className="h-4 w-4 text-gray-400 mr-2" />
                                  <span>Invoice {item.invoice_id}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>No items found for this credit note</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Failed to load credit note details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNoteSummaryPage;
