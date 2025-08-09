import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  User,
  DollarSign,
  Package,
  X,
  Edit,
  Plus,
  Trash2,
  Save,
  Truck,
  Home
} from 'lucide-react';
import { salesOrdersService, productsService } from '../services/financialService';
import { SalesOrder, Product } from '../types/financial';
import { riderService, Rider } from '../services/riderService';

const CustomerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // const [statusFilter, setStatusFilter] = useState('all');
  const [myStatusFilter, setMyStatusFilter] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    expected_delivery_date: '',
    notes: '',
    status: '0',
    items: [] as Array<{
      id?: number;
      product_id: number;
      product_name?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      tax_type?: '16%' | 'zero_rated' | 'exempted';
    }>
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Rider assignment state
  const [riders, setRiders] = useState<Rider[]>([]);
  const [showAssignRiderModal, setShowAssignRiderModal] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<SalesOrder | null>(null);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchRiders();
  }, []);

  // Close product dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.product-dropdown')) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await salesOrdersService.getAllIncludingDrafts();
      
      if (response.success && response.data) {
        setOrders(response.data);
      } else {
        console.error('Failed to fetch orders:', response);
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchRiders = async () => {
    try {
      const ridersList = await riderService.getRiders();
      setRiders(ridersList);
    } catch (err) {
      console.error('Error fetching riders:', err);
      setRiders([]);
    }
  };

  // Filter orders based on search term, my_status, and date range
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.so_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMyStatus = myStatusFilter === 'all' || order.my_status?.toString() === myStatusFilter;
    
    // Date range filtering
    let matchesDateRange = true;
    if (startDate || endDate) {
      const orderDate = new Date(order.created_at || '');
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && end) {
        matchesDateRange = orderDate >= start && orderDate <= end;
      } else if (start) {
        matchesDateRange = orderDate >= start;
      } else if (end) {
        matchesDateRange = orderDate <= end;
      }
    }
    
    return matchesSearch && matchesMyStatus && matchesDateRange;
  });

  // Pagination state for orders list
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / limit));
  const startIdx = (page - 1) * limit;
  const pageRows = filteredOrders.slice(startIdx, startIdx + limit);

  // Counts per my_status for badges
  const statusCounts = orders.reduce((acc: Record<string, number>, o: any) => {
    const key = (o.my_status != null ? String(o.my_status) : '0');
    acc[key] = (acc[key] || 0) + 1;
    acc['all'] = (acc['all'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getFilterClasses = (value: string, selected: boolean) => {
    // Explicit color classes per status
    const byVal: Record<string, {selected: string; unselected: string; pillSel: string; pillUnsel: string}> = {
      all: {
        selected: 'bg-gray-700 text-white border-gray-700',
        unselected: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
        pillSel: 'bg-white text-gray-800',
        pillUnsel: 'bg-gray-200 text-gray-700'
      },
      '0': {
        selected: 'bg-gray-700 text-white border-gray-700',
        unselected: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
        pillSel: 'bg-white text-gray-800',
        pillUnsel: 'bg-gray-200 text-gray-700'
      },
      '1': {
        selected: 'bg-blue-600 text-white border-blue-600',
        unselected: 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50',
        pillSel: 'bg-white text-blue-700',
        pillUnsel: 'bg-blue-100 text-blue-800'
      },
      '2': {
        selected: 'bg-amber-600 text-white border-amber-600',
        unselected: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50',
        pillSel: 'bg-white text-amber-700',
        pillUnsel: 'bg-amber-100 text-amber-800'
      },
      '3': {
        selected: 'bg-green-600 text-white border-green-600',
        unselected: 'bg-white text-green-700 border-green-300 hover:bg-green-50',
        pillSel: 'bg-white text-green-700',
        pillUnsel: 'bg-green-100 text-green-800'
      },
      '4': {
        selected: 'bg-red-600 text-white border-red-600',
        unselected: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
        pillSel: 'bg-white text-red-700',
        pillUnsel: 'bg-red-100 text-red-800'
      },
      '5': {
        selected: 'bg-rose-600 text-white border-rose-600',
        unselected: 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50',
        pillSel: 'bg-white text-rose-700',
        pillUnsel: 'bg-rose-100 text-rose-800'
      }
    };
    const conf = byVal[value] || byVal['all'];
    return {
      btn: selected ? conf.selected : conf.unselected,
      pill: selected ? conf.pillSel : conf.pillUnsel
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getStatusBadge = (status?: string) => {
    const statusColors: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-yellow-100 text-yellow-800',
      'delivered': 'bg-green-100 text-green-800',
      'in_payment': 'bg-purple-100 text-purple-800',
      'paid': 'bg-green-100 text-green-800'
    };
    
    const statusLabels: { [key: string]: string } = {
      'draft': 'Draft',
      'confirmed': 'Confirmed',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'in_payment': 'In Payment',
      'paid': 'Paid'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status || 'draft'] || statusColors['draft']}`}>
        {statusLabels[status || 'draft'] || statusLabels['draft']}
      </span>
    );
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'Draft',
      'confirmed': 'Confirmed',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'in_payment': 'In Payment',
      'paid': 'Paid'
    };
    return statusMap[status] || 'Unknown';
  };

  const getMyStatusText = (my_status?: number) => {
    const statusMap: { [key: number]: string } = {
      0: 'New Orders',
      1: 'Approved',
      2: 'In Transit',
      3: 'Complete',
      4: 'Cancelled',
      5: 'Declined'
    };
    return statusMap[my_status || 0] || 'Unknown';
  };

  const openViewModal = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedOrder(null);
    setIsEditing(false);
    setSuccessMessage('');
  };

  const startEditing = () => {
    if (!selectedOrder) return;
    
    setEditForm({
      expected_delivery_date: selectedOrder.expected_delivery_date || '',
      notes: selectedOrder.notes || '',
      status: selectedOrder.status || 'draft',
      items: selectedOrder.items?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product?.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_type: (item as any).tax_type || '16%'
      })) || []
    });
    setIsEditing(true);
    setSuccessMessage('');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSuccessMessage('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setSubmitting(true);
    try {
      const updateData = {
        client_id: selectedOrder.client_id || selectedOrder.customer_id,
        order_date: selectedOrder.order_date,
        expected_delivery_date: editForm.expected_delivery_date || undefined,
        notes: editForm.notes,
        status: editForm.status,
        items: editForm.items
      };

      const response = await salesOrdersService.update(selectedOrder.id, updateData);
      
      if (response.success) {
        const statusChanged = editForm.status !== selectedOrder.status;
        const statusText = statusChanged ? `Order updated and status changed to ${getStatusText(editForm.status)}!` : 'Order updated successfully!';
        setSuccessMessage(statusText);
        // Refresh the orders list
        await fetchOrders();
        // Close modal after 2 seconds
        setTimeout(() => {
          closeViewModal();
        }, 2000);
      } else {
        setError(response.error || 'Failed to update order');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    const newItem = {
      product_id: 0,
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      tax_type: '16%' as '16%'
    };
    const newIndex = editForm.items.length;
    setEditForm({
      ...editForm,
      items: [...editForm.items, newItem]
    });
    setEditingItemIndex(newIndex);
    setShowProductDropdown(true);
    setProductSearch('');
    
    // Calculate position after a short delay to ensure the new input is rendered
    setTimeout(() => {
      const inputs = document.querySelectorAll('input[placeholder="Search or type product name..."]');
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      if (lastInput) {
        const rect = lastInput.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, 100);
  };

  const removeItem = (index: number) => {
    const newItems = editForm.items.filter((_, i) => i !== index);
    setEditForm({
      ...editForm,
      items: newItems
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...editForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total price
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_type') {
      const quantity = Number(newItems[index].quantity) || 0;
      const unitPriceGross = Number(newItems[index].unit_price) || 0;
      const taxType = (newItems[index].tax_type || '16%') as '16%' | 'zero_rated' | 'exempted';
      const taxRate = taxType === '16%' ? 0.16 : 0;
      const totalGross = quantity * unitPriceGross; // price is tax-inclusive
      newItems[index].total_price = Number(totalGross.toFixed(2));
    }
    
    setEditForm({
      ...editForm,
      items: newItems
    });
  };

  const selectProduct = (product: Product, index: number) => {
    console.log('Selecting product:', product, 'for index:', index);
    
    // Update the form immediately
    setEditForm(prevForm => {
      const newItems = [...prevForm.items];
      const currentItem = newItems[index];
      const quantity = currentItem ? currentItem.quantity : 1;
      const unitPrice = product.selling_price || 0;
      const totalPrice = quantity * unitPrice; // selling_price assumed tax-inclusive
      
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        product_name: product.product_name,
        unit_price: unitPrice,
        total_price: Number(totalPrice.toFixed(2)),
        tax_type: currentItem?.tax_type || '16%'
      };
      
      console.log('Updated items:', newItems);
      
      return {
        ...prevForm,
        items: newItems
      };
    });
    
    // Clear search and dropdown state
    setProductSearch('');
    setShowProductDropdown(false);
    setEditingItemIndex(null);
  };

  const showDropdown = (index: number, event?: React.FocusEvent<HTMLInputElement>) => {
    setShowProductDropdown(true);
    setEditingItemIndex(index);
    
    if (event) {
      const rect = event.target.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const searchTerm = productSearch.toLowerCase().trim();
    if (!searchTerm) return true; // Show all products when search is empty
    
    return (
      (product.product_name && product.product_name.toLowerCase().includes(searchTerm)) ||
      (product.product_code && product.product_code.toLowerCase().includes(searchTerm))
    );
  });

  const convertToInvoice = async () => {
    if (!selectedOrder) return;
    
    try {
      setSubmitting(true);
      
      // Prepare minimal invoice data - backend will handle the rest
      const invoiceData = {
        expected_delivery_date: selectedOrder.expected_delivery_date,
        notes: selectedOrder.notes
      };

      console.log('Converting to invoice with data:', invoiceData);

      // Call API to convert to invoice
      const response = await salesOrdersService.convertToInvoice(selectedOrder.id, invoiceData);
      
      if (response.success) {
        setSuccessMessage('Order successfully converted to invoice!');
        // Refresh orders list
        await fetchOrders();
        // Close modal after 2 seconds
        setTimeout(() => {
          closeViewModal();
        }, 2000);
      } else {
        setError(response.error || 'Failed to convert order to invoice');
      }
    } catch (err) {
      console.error('Error converting to invoice:', err);
      setError('Failed to convert order to invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // Rider assignment functions
  const openAssignRiderModal = async (order: SalesOrder) => {
    setAssigningOrder(order);
    setSelectedRider(null);
    setAssignError(null);
    setShowAssignRiderModal(true);
  };

  const closeAssignRiderModal = () => {
    setShowAssignRiderModal(false);
    setAssigningOrder(null);
    setSelectedRider(null);
    setAssignError(null);
  };

  const handleAssignRider = async () => {
    if (!assigningOrder || !selectedRider) return;
    
    try {
      setAssignLoading(true);
      setAssignError(null);
      
      const response = await salesOrdersService.assignRider(assigningOrder.id, selectedRider);
      
      if (response.success) {
        setSuccessMessage('Rider assigned successfully!');
        await fetchOrders();
        closeAssignRiderModal();
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setAssignError(response.error || 'Failed to assign rider');
      }
    } catch (err: any) {
      console.error('Error assigning rider:', err);
      setAssignError(err.response?.data?.error || 'Failed to assign rider');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Customer Orders</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {filteredOrders.length} orders
              </span>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </button>
              <button
                onClick={() => navigate('/sales-orders')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View All Orders</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Active Filters Indicator */}
          {(searchTerm || myStatusFilter !== '0' || startDate || endDate) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {myStatusFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Status: {myStatusFilter === 'all' ? 'All Orders' : getMyStatusText(parseInt(myStatusFilter))}
                      </span>
                    )}
                    {startDate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        From: {formatDate(startDate)}
                      </span>
                    )}
                    {endDate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        To: {formatDate(endDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter - Segmented Buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              {[
                { value: 'all', label: 'All' },
                { value: '0', label: 'New' },
                { value: '1', label: 'Approved' },
                { value: '2', label: 'In Transit' },
                { value: '3', label: 'Complete' },
                { value: '4', label: 'Cancelled' },
                { value: '5', label: 'Declined' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMyStatusFilter(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded border flex items-center gap-2 ${getFilterClasses(opt.value, myStatusFilter === opt.value).btn}`}
                >
                  {opt.label}
                  <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-5 px-2 rounded-full text-xs ${getFilterClasses(opt.value, myStatusFilter === opt.value).pill}`}>
                    {statusCounts[opt.value] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Date Range Filter */}
            <div className="md:w-48">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:w-48">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSearchTerm('');
                setMyStatusFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Clear Filters
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Customer Orders</h3>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">
                {searchTerm || myStatusFilter !== 'all' || startDate || endDate ? 'Try adjusting your search terms, status filter, or date range.' : 'No orders available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Rep
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
                      Approval Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Rider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageRows.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.so_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.items?.length || 0} items
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer_name || order.customer?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer?.contact || 'No contact'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer_balance ? formatCurrency(parseFloat(order.customer_balance)) : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {order.salesrep || order.created_by_user?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Sales Representative
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {formatDate(order.order_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.my_status === 0 ? 'bg-gray-100 text-gray-800' :
                          order.my_status === 1 ? 'bg-green-100 text-green-800' :
                          order.my_status === 2 ? 'bg-blue-100 text-blue-800' :
                          order.my_status === 3 ? 'bg-green-100 text-green-800' :
                          order.my_status === 4 ? 'bg-red-100 text-red-800' :
                          order.my_status === 5 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getMyStatusText(order.my_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.rider_name ? (
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 text-green-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.rider_name}</div>
                              <div className="text-sm text-gray-500">{order.rider_contact}</div>
                                                              {order.assigned_at && (
                                  <div className="text-xs text-gray-400">
                                    Assigned: {formatDateTime(order.assigned_at)}
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex items-center space-x-2">
                           <button
                             onClick={() => openViewModal(order)}
                             className="text-blue-600 hover:text-blue-900 flex items-center"
                           >
                             <Eye className="h-4 w-4 mr-1" />
                             View
                           </button>
                           {order.my_status === 1 && (
                             <button
                               onClick={() => openAssignRiderModal(order)}
                               className="text-green-600 hover:text-green-900 flex items-center bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                             >
                               <Truck className="h-4 w-4 mr-1" />
                               Assign Rider
                             </button>
                           )}
                           {(order.my_status === 1 || order.my_status === 2 || order.my_status === 3) && (
                             <button
                               onClick={() => navigate(`/sales-orders/${order.id}`)}
                               className="text-purple-600 hover:text-purple-900 flex items-center bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded"
                             >
                               <Package className="h-4 w-4 mr-1" />
                               Invoice
                             </button>
                             
                           )}
                           {(order.my_status === 1 || order.my_status === 2 || order.my_status === 3) && (
                             <button
                               onClick={() => navigate(`/delivery-note/${order.id}`)}
                               className="text-purple-600 hover:text-purple-900 flex items-center bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded"
                             >
                               <Package className="h-4 w-4 mr-1" />
                               Delivery Note
                             </button>
                             
                           )}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">Page {page} of {totalPages} • {filteredOrders.length} orders</div>
                <div className="flex items-center gap-2">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={limit}
                    onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Order Modal */}
        {showViewModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-8 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-xl rounded-lg bg-white">
              <div className="mt-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {isEditing ? 'Edit Order' : 'View Order'}: {selectedOrder.so_number}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {isEditing ? 'Edit order details and products' : 'Order Details'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={startEditing}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Order
                        </button>
                        {selectedOrder.status === 'draft' && (
                          <button
                            onClick={convertToInvoice}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Convert to Invoice
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={closeViewModal}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMessage}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                {/* Form or Content */}
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-8">
                    {/* Lock banner when items cannot be edited */}
                    {selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed')) && (
                      <div className="mb-3 p-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm">
                        Product items are locked for approved orders. You can still update status, expected delivery date, and notes.
                      </div>
                    )}
                    {/* Order Info */}
                <div className="p-6 bg-gray-50 rounded-lg mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Order Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Number
                      </label>
                      <input
                        type="text"
                        value={selectedOrder.so_number}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer
                      </label>
                      <input
                        type="text"
                        value={selectedOrder.customer_name || selectedOrder.customer?.name || 'Unknown'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Date
                      </label>
                      <input
                        type="text"
                        value={formatDate(selectedOrder.order_date)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="new">New Order</option>
                          <option value="cancelled">Cancel</option>
                          <option value="declined">Decline</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedOrder.status || 'draft'}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery Date
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.expected_delivery_date}
                          onChange={(e) => setEditForm({...editForm, expected_delivery_date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={selectedOrder.expected_delivery_date ? formatDate(selectedOrder.expected_delivery_date) : 'Not set'}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Representative
                      </label>
                      <input
                        type="text"
                        value={selectedOrder.salesrep || selectedOrder.created_by_user?.full_name || 'Unknown'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount
                      </label>
                      <input
                        type="text"
                        value={isEditing ? formatCurrency(editForm.items.reduce((sum, item) => sum + item.total_price, 0)) : formatCurrency(selectedOrder.total_amount)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Status
                      </label>
                      <input
                        type="text"
                        value={getMyStatusText(selectedOrder.my_status)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                <div className="p-6 bg-yellow-50 rounded-lg mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Order Notes</h4>
                  {isEditing ? (
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any notes about this order..."
                    />
                  ) : (
                    <div className="p-3 bg-white rounded border">
                      {selectedOrder.notes || 'No notes added'}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="p-6 bg-green-50 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Order Items</h4>
                    {isEditing && !(selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))) && (
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Product
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    // Edit Mode - Editable Items
                    <div className="space-y-4">
                      {editForm.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No items in this order.</p>
                          <button
                            type="button"
                            onClick={addItem}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Product
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price (Incl. Tax)</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                          {editForm.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={item.product_name || ''}
                                          placeholder="Search or type product name..."
                                    onChange={(e) => {
                                      if (selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))) return;
                                      setProductSearch(e.target.value);
                                      setShowProductDropdown(true);
                                      setEditingItemIndex(index);
                                    }}
                                    onFocus={(e) => {
                                      if (selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))) return;
                                      showDropdown(index, e);
                                    }}
                                    disabled={selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                  onChange={(e) => {
                                    if (selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))) return;
                                    updateItem(index, 'quantity', parseInt(e.target.value) || 1);
                                  }}
                                  disabled={selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))}
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_price}
                                  onChange={(e) => {
                                    if (selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))) return;
                                    updateItem(index, 'unit_price', parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))}
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                  <select
                                    value={item.tax_type || '16%'}
                                    onChange={(e) => {
                                      if (selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))) return;
                                      updateItem(index, 'tax_type', e.target.value);
                                    }}
                                    disabled={selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                        <option value="16%">16%</option>
                                        <option value="zero_rated">Zero Rated</option>
                                        <option value="exempted">Exempted</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {formatCurrency(item.total_price)}
                                    </td>
                                    <td className="px-4 py-2">
                                {!(selectedOrder && (selectedOrder.my_status !== undefined ? selectedOrder.my_status >= 1 : (selectedOrder.status === 'confirmed'))) && (
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex justify-end items-center pt-4 border-t border-gray-200">
                            <div className="text-right space-y-1">
                              <div className="text-sm text-gray-600">
                                Subtotal: {
                                  (() => {
                                    let net = 0;
                                    for (const it of editForm.items) {
                                      const gross = Number(it.total_price) || 0;
                                      const rate = (it.tax_type === '16%') ? 0.16 : 0; // zero_rated/exempted => 0
                                      net += rate > 0 ? +(gross / (1 + rate)).toFixed(2) : +gross.toFixed(2);
                                    }
                                    return formatCurrency(+net.toFixed(2));
                                  })()
                                }
                              </div>
                              <div className="text-sm text-gray-600">
                                Tax: {
                                  (() => {
                                    let tax = 0;
                                    for (const it of editForm.items) {
                                      const gross = Number(it.total_price) || 0;
                                      const rate = (it.tax_type === '16%') ? 0.16 : 0;
                                      const net = rate > 0 ? +(gross / (1 + rate)).toFixed(2) : +gross.toFixed(2);
                                      tax += +(gross - net).toFixed(2);
                                    }
                                    return formatCurrency(+tax.toFixed(2));
                                  })()
                                }
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                Total: {formatCurrency(editForm.items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    // View Mode - Read-only Items
                    <div className="space-y-4">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <>
                          {selectedOrder.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.product?.product_name || `Product ${item.product_id}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Code: {item.product?.product_code || 'No Code'} | 
                                  Qty: {item.quantity} | 
                                  Price: {formatCurrency(item.unit_price)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">
                                  {formatCurrency(item.total_price)}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <span className="text-lg font-medium text-gray-900">Total:</span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(selectedOrder.items.reduce((sum, item) => sum + item.total_price, 0))}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No items in this order.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={closeViewModal}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <>
                {/* Order Info */}
                <div className="p-6 bg-gray-50 rounded-lg mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Order Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Number
                      </label>
                      <input
                        type="text"
                        value={selectedOrder.so_number}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer
                      </label>
                      <input
                        type="text"
                        value={selectedOrder.customer_name || selectedOrder.customer?.name || 'Unknown'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Date
                      </label>
                      <input
                        type="text"
                        value={formatDate(selectedOrder.order_date)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <input
                        type="text"
                                                  value={selectedOrder.status || 'draft'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery Date
                      </label>
                      <input
                        type="text"
                        value={selectedOrder.expected_delivery_date ? formatDate(selectedOrder.expected_delivery_date) : 'Not set'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Representative
                      </label>
                      <input
                        type="text"
                        value={selectedOrder.salesrep || selectedOrder.created_by_user?.full_name || 'Unknown'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(selectedOrder.total_amount)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Status
                      </label>
                      <input
                        type="text"
                        value={getMyStatusText(selectedOrder.my_status)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                <div className="p-6 bg-yellow-50 rounded-lg mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Order Notes</h4>
                  <div className="p-3 bg-white rounded border">
                    {selectedOrder.notes || 'No notes added'}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 bg-green-50 rounded-lg mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Order Items</h4>
                  <div className="space-y-4">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <>
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {item.product?.product_name || `Product ${item.product_id}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {item.product?.product_code || 'No Code'} | 
                                Qty: {item.quantity} | 
                                Price: {formatCurrency(item.unit_price)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(item.total_price)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <span className="text-lg font-medium text-gray-900">Total:</span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedOrder.items.reduce((sum, item) => sum + item.total_price, 0))}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No items in this order.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
        )}

        {/* Assign Rider Modal */}
        {showAssignRiderModal && assigningOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Assign Rider to Order {assigningOrder.so_number}</h2>
                <button
                  onClick={closeAssignRiderModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {assignError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {assignError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Rider
                </label>
                <select
                  value={selectedRider || ''}
                  onChange={(e) => setSelectedRider(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={riders.length === 0}
                >
                  <option value="">Choose a rider...</option>
                  {riders.map(rider => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} - {rider.contact}
                    </option>
                  ))}
                </select>
                {riders.length === 0 && (
                  <div className="text-xs text-red-500 mt-2">No riders available. Please add riders.</div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeAssignRiderModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRider}
                  disabled={assignLoading || !selectedRider}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Rider'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Dropdown Portal */}
        {showProductDropdown && editingItemIndex !== null && createPortal(
          <div 
            className="fixed bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-60 overflow-auto z-[999999]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 999999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input in Dropdown */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="px-2 py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            {products.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                <div className="p-2">No products found</div>
                <div className="p-2 text-xs text-gray-400">Try a different search term</div>
              </div>
            ) : (
              <>
                {/* Quick Add Section */}
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-1">Quick Add Products</div>
                  <div className="text-xs text-blue-600">Click any product below to add it</div>
                </div>
                
                {/* Product List */}
                {filteredProducts.slice(0, 15).map((product) => (
                  <div
                    key={product.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Product clicked:', product.product_name, 'for index:', editingItemIndex);
                      selectProduct(product, editingItemIndex);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="px-3 py-3 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-gray-500 text-xs">Code: {product.product_code}</div>
                        {product.category && (
                          <div className="text-gray-400 text-xs">Category: {product.category}</div>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-xs font-medium text-green-600">
                          {formatCurrency(product.selling_price || 0)}
                        </div>
                        <div className="text-xs text-gray-400">per unit</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredProducts.length > 15 && (
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                    Showing first 15 of {filteredProducts.length} products
                  </div>
                )}
              </>
            )}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersPage; 