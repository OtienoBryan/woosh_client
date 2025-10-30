import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  User,
  Package,
  X,
  Edit,
  Plus,
  Trash2,
  Save,
  Truck,
  Home,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { salesOrdersService, productsService } from '../services/financialService';
import { SalesOrder, Product } from '../types/financial';
import { Rider } from '../services/riderService';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';

const CustomerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [myStatusFilter, setMyStatusFilter] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [riderFilter, setRiderFilter] = useState<number | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [apiStatusCounts, setApiStatusCounts] = useState<Record<string, number>>({});
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

  // Receive to Stock Modal state
  const [showReceiveToStockModal, setShowReceiveToStockModal] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<SalesOrder | null>(null);
  const [receiveForm, setReceiveForm] = useState({
    store_id: '',
    notes: '',
    items: [] as Array<{
      product_id: number;
      product_name: string;
      quantity: number;
      original_quantity: number;
      unit_cost: number;
    }>
  });
  const [stores, setStores] = useState<Array<{ id: number; store_name: string; store_code: string }>>([]);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  // Complete Delivery Modal state
  const [showCompleteDeliveryModal, setShowCompleteDeliveryModal] = useState(false);
  const [completingOrder, setCompletingOrder] = useState<SalesOrder | null>(null);
  const [completeDeliveryForm, setCompleteDeliveryForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    delivery_image: null as File | null,
    notes: ''
  });
  const [completeDeliveryLoading, setCompleteDeliveryLoading] = useState(false);
  const [completeDeliveryError, setCompleteDeliveryError] = useState<string | null>(null);

  // Delivery Details Modal state
  const [showDeliveryDetailsModal, setShowDeliveryDetailsModal] = useState(false);
  const [deliveryDetailsOrder, setDeliveryDetailsOrder] = useState<SalesOrder | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Handle URL parameters for filtering
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const riderId = searchParams.get('rider_id');
    const statusParam = searchParams.get('status');
    
    if (riderId) {
      setRiderFilter(parseInt(riderId));
    }
    
    if (statusParam) {
      // Parse comma-separated status values
      const statuses = statusParam.split(',').map(s => s.trim());
      // For now, we'll use the first status as the filter
      // You might want to implement multi-status filtering
      if (statuses.length > 0) {
        setMyStatusFilter(statuses[0]);
      }
    }
  }, [location.search]);

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

  // Consolidated fetch function using new optimized API endpoint
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (myStatusFilter && myStatusFilter !== 'all') {
        params.append('status', myStatusFilter);
      }
      
      if (riderFilter) {
        params.append('rider_id', riderFilter.toString());
      }
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Single API call to get all needed data
      const response = await axios.get(`/api/customer-orders/data?${params.toString()}`);
      
      if (response.data.success) {
        const { orders, riders, stores, statusCounts, pagination } = response.data.data;
        
        setOrders(orders);
        setRiders(riders);
        setStores(stores);
        setApiStatusCounts(statusCounts);
        setTotalOrders(pagination.total);
        setTotalPages(pagination.totalPages);
      } else {
        setError('Failed to fetch customer orders data');
      }
    } catch (err: any) {
      console.error('Error fetching customer orders data:', err);
      setError(err.response?.data?.error || 'Failed to fetch customer orders data');
    } finally {
      setLoading(false);
    }
  }, [page, limit, myStatusFilter, riderFilter, startDate, endDate, searchTerm]);

  // Lazy load products only when needed (when editing)
  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  // Consolidated data fetch on mount and when filters change
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // No client-side filtering needed - done on backend for performance
  const filteredOrders = orders;
  const pageRows = orders; // Backend returns paginated data
  
  // Use status counts from API - memoized for performance
  const statusCounts = useMemo(() => apiStatusCounts, [apiStatusCounts]);

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
      },
      '6': {
        selected: 'bg-orange-600 text-white border-orange-600',
        unselected: 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50',
        pillSel: 'bg-white text-orange-700',
        pillUnsel: 'bg-orange-100 text-orange-800'
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[status || 'draft'] || statusColors['draft']}`}>
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
      5: 'Declined',
      6: 'Returned to Stock'
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

  const startEditing = async () => {
    if (user?.role !== 'admin') {
      setError('Only users with admin role can edit orders');
      return;
    }
    
    if (!selectedOrder) return;
    
    // Lazy load products only when editing starts
    if (products.length === 0) {
      await fetchProducts();
    }
    
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
    if (user?.role !== 'admin') {
      setError('Only users with admin role can edit orders');
      return;
    }
    
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
        await fetchAllData();
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
                              const totalGross = quantity * unitPriceGross; // price is tax-exclusive, total includes tax
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
                              const totalPrice = quantity * unitPrice; // selling_price is tax-exclusive, total includes tax
      
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
    if (user?.role !== 'admin') {
      setError('Only users with admin role can convert orders to invoices');
      return;
    }
    
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
        await fetchAllData();
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
    if (user?.role !== 'stock') {
      setError('Only users with stock role can assign riders');
      return;
    }
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
    if (user?.role !== 'stock') {
      setAssignError('Only users with stock role can assign riders');
      return;
    }
    
    if (!assigningOrder || !selectedRider) return;
    
    try {
      setAssignLoading(true);
      setAssignError(null);
      
      const response = await salesOrdersService.assignRider(assigningOrder.id, selectedRider);
      
      if (response.success) {
        setSuccessMessage('Rider assigned successfully! Order status updated to shipped and stock quantities reduced in store ID 1.');
        await fetchAllData();
        closeAssignRiderModal();
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000); // Increased timeout to show the longer message
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

  // Receive to Stock functions
  const openReceiveToStockModal = (order: SalesOrder) => {
    if (user?.role !== 'stock') {
      setError('Only users with stock role can receive products to stock');
      return;
    }
    
    if (order.my_status !== 4) { // 4 = Cancelled only
      setError('Only cancelled orders can have products returned to stock');
      return;
    }
    
    setReceivingOrder(order);
    setReceiveForm({
      store_id: '',
      notes: `Return to stock from cancelled order ${order.so_number}`,
      items: order.items?.map(item => {
        // Try to find the product in our products list to get the cost price
        const product = products.find(p => p.id === item.product_id);
        return {
          product_id: item.product_id,
          product_name: item.product?.product_name || `Product ${item.product_id}`,
          quantity: item.quantity,
          original_quantity: item.quantity,
          unit_cost: product?.cost_price || 0 // Use product cost price if available
        };
      }) || []
    });
    setReceiveError(null);
    setShowReceiveToStockModal(true);
  };

  const closeReceiveToStockModal = () => {
    setShowReceiveToStockModal(false);
    setReceivingOrder(null);
    setReceiveForm({
      store_id: '',
      notes: '',
      items: []
    });
    setReceiveError(null);
  };

  const handleReceiveFormChange = (field: string, value: any) => {
    setReceiveForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReceiveItemChange = (index: number, field: string, value: any) => {
    const newItems = [...receiveForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setReceiveForm(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const resetToOriginalQuantities = () => {
    setReceiveForm(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        quantity: item.original_quantity
      }))
    }));
  };

  const handleReceiveToStock = async () => {
    if (!receivingOrder || !receiveForm.store_id) {
      setReceiveError('Please select a store and ensure all required fields are filled');
      return;
    }

    if (receiveForm.items.some(item => item.quantity <= 0)) {
      setReceiveError('All quantities must be greater than 0');
      return;
    }

    // Check that quantities don't exceed original quantities
    const invalidQuantities = receiveForm.items.filter(item => item.quantity > item.original_quantity);
    if (invalidQuantities.length > 0) {
      setReceiveError(`Quantities cannot exceed original order quantities: ${invalidQuantities.map(item => item.product_name).join(', ')}`);
      return;
    }

    try {
      setReceiveLoading(true);
      setReceiveError(null);

      // Create inventory transaction for each product
      const inventoryData = {
        order_id: receivingOrder.id,
        store_id: receiveForm.store_id,
        notes: receiveForm.notes,
        items: receiveForm.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          transaction_type: 'adjustment',
          reference_type: 'sales_order_return'
        }))
      };

      // Call the API to receive products back to stock
      const response = await fetch('/api/financial/receive-to-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccessMessage('Products successfully received back to stock!');
          await fetchAllData();
          closeReceiveToStockModal();
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else {
          setReceiveError(result.error || 'Failed to receive products to stock');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setReceiveError(errorData.error || 'Failed to receive products to stock');
      }
    } catch (err: any) {
      console.error('Error receiving products to stock:', err);
      setReceiveError(err.message || 'Failed to receive products to stock');
    } finally {
      setReceiveLoading(false);
    }
  };

  // Complete Delivery functions
  const openCompleteDeliveryModal = (order: SalesOrder) => {
    if (order.my_status !== 2) {
      alert('Only orders in transit can be completed');
      return;
    }
    setCompletingOrder(order);
    setCompleteDeliveryForm({
      recipient_name: '',
      recipient_phone: '',
      delivery_image: null,
      notes: ''
    });
    setShowCompleteDeliveryModal(true);
  };

  const closeCompleteDeliveryModal = () => {
    setShowCompleteDeliveryModal(false);
    setCompletingOrder(null);
    setCompleteDeliveryForm({
      recipient_name: '',
      recipient_phone: '',
      delivery_image: null,
      notes: ''
    });
    setCompleteDeliveryError(null);
  };

  const handleCompleteDeliveryFormChange = (field: string, value: any) => {
    setCompleteDeliveryForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompleteDelivery = async () => {
    if (!completingOrder || !completeDeliveryForm.recipient_name || !completeDeliveryForm.recipient_phone) {
      setCompleteDeliveryError('Please fill in all required fields');
      return;
    }

    try {
      setCompleteDeliveryLoading(true);
      setCompleteDeliveryError(null);

      let deliveryImageFilename = null;
      
      // Upload delivery image first if provided
      if (completeDeliveryForm.delivery_image) {
        const imageFormData = new FormData();
        imageFormData.append('delivery_image', completeDeliveryForm.delivery_image);
        imageFormData.append('order_id', completingOrder.id.toString());
        imageFormData.append('recipient_name', completeDeliveryForm.recipient_name);
        imageFormData.append('recipient_phone', completeDeliveryForm.recipient_phone);
        imageFormData.append('notes', completeDeliveryForm.notes || '');

        const imageResponse = await fetch(API_CONFIG.getUrl('/financial/upload-delivery-image'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: imageFormData
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          deliveryImageFilename = imageData.filename;
          console.log('Delivery image uploaded successfully:', deliveryImageFilename);
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          console.warn('Failed to upload delivery image:', errorData);
          // Continue with delivery completion even if image upload fails
        }
      }

      const requestBody = {
        recipient_name: completeDeliveryForm.recipient_name,
        recipient_phone: completeDeliveryForm.recipient_phone,
        notes: completeDeliveryForm.notes || '',
        delivery_image_filename: deliveryImageFilename
      };
      
      console.log('Completing delivery for order:', completingOrder.id, 'with data:', requestBody);
      
      const completeResponse = await fetch(API_CONFIG.getUrl(`/financial/sales-orders/${completingOrder.id}/complete-delivery`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (completeResponse.ok) {
        setSuccessMessage('Delivery completed successfully! Order status updated to delivered.');
        await fetchAllData();
        closeCompleteDeliveryModal();
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        const errorData = await completeResponse.json().catch(() => ({}));
        console.error('Delivery completion failed:', {
          status: completeResponse.status,
          statusText: completeResponse.statusText,
          errorData
        });
        setCompleteDeliveryError(errorData.error || `Failed to complete delivery (HTTP ${completeResponse.status})`);
      }
    } catch (err: any) {
      console.error('Error completing delivery:', err);
      setCompleteDeliveryError(err.message || 'Failed to complete delivery');
    } finally {
      setCompleteDeliveryLoading(false);
    }
  };

  // Delivery Details Modal functions
  const openDeliveryDetailsModal = (order: SalesOrder) => {
    setDeliveryDetailsOrder(order);
    setShowDeliveryDetailsModal(true);
  };

  const closeDeliveryDetailsModal = () => {
    setShowDeliveryDetailsModal(false);
    setDeliveryDetailsOrder(null);
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
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center">
              <ShoppingCart className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-bold text-gray-900">Customer Orders</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {filteredOrders.length} orders
              </span>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-1.5"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </button>
              <button
                onClick={() => navigate('/financial/create-customer-order')}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center space-x-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Add Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs rounded mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          {/* Active Filters Indicator */}
          {(searchTerm || myStatusFilter !== '0' || startDate || endDate || riderFilter) && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Filter className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Active Filters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {searchTerm && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {myStatusFilter !== 'all' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                        Status: {myStatusFilter === 'all' ? 'All Orders' : getMyStatusText(parseInt(myStatusFilter))}
                      </span>
                    )}
                    {riderFilter && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                        Rider: {riders.find(r => r.id === riderFilter)?.name || `ID: ${riderFilter}`}
                      </span>
                    )}
                    {startDate && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                        From: {formatDate(startDate)}
                      </span>
                    )}
                    {endDate && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                        To: {formatDate(endDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter - Segmented Buttons */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {[
                { value: 'all', label: 'All' },
                { value: '0', label: 'New' },
                { value: '1', label: 'Approved' },
                { value: '2', label: 'In Transit' },
                { value: '3', label: 'Complete' },
                { value: '4', label: 'Cancelled' },
                { value: '5', label: 'Declined' },
                { value: '6', label: 'Returned to Stock' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setMyStatusFilter(opt.value); setPage(1); }}
                  className={`px-2 py-1 text-xs rounded border flex items-center gap-1.5 ${getFilterClasses(opt.value, myStatusFilter === opt.value).btn}`}
                >
                  {opt.label}
                  <span className={`inline-flex items-center justify-center min-w-[1.2rem] h-4 px-1.5 rounded-full text-[10px] ${getFilterClasses(opt.value, myStatusFilter === opt.value).pill}`}>
                    {statusCounts[opt.value] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Date Range Filter */}
            <div className="md:w-40">
              <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-0.5">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:w-40">
              <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-0.5">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSearchTerm('');
                setMyStatusFilter('all');
                setStartDate('');
                setEndDate('');
                setRiderFilter(null);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Clear Filters
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchAllData}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Customer Orders</h3>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No orders found</h3>
              <p className="text-xs text-gray-500">
                {searchTerm || myStatusFilter !== 'all' || startDate || endDate || riderFilter ? 'Try adjusting your search terms, status filter, rider filter, or date range.' : 'No orders available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Sales Rep
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Approval Status
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Rider
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageRows.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-7 w-7">
                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                              <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-gray-900">
                              {order.so_number}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {order.items?.length || 0} items
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-gray-900">
                              {order.customer_name || order.customer?.name || 'Unknown'}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {order.customer?.contact || 'No contact'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-xs font-medium text-gray-900">
                            {order.customer_balance ? formatCurrency(parseFloat(order.customer_balance)) : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="h-3 w-3 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-gray-900">
                              {order.salesrep || order.created_by_user?.full_name || 'Unknown'}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Sales Representative
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          <div className="text-xs text-gray-900">
                            {formatDate(order.order_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-xs font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          order.my_status === 0 ? 'bg-gray-100 text-gray-800' :
                          order.my_status === 1 ? 'bg-green-100 text-green-800' :
                          order.my_status === 2 ? 'bg-blue-100 text-blue-800' :
                          order.my_status === 3 ? 'bg-green-100 text-green-800' :
                          order.my_status === 4 ? 'bg-red-100 text-red-800' :
                          order.my_status === 5 ? 'bg-red-100 text-red-800' :
                          order.my_status === 6 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getMyStatusText(order.my_status)}
                        </span>
                        {order.my_status === 6 && order.returned_at && (
                          <div className="mt-1 text-[10px] text-gray-500">
                            Returned: {formatDateTime(order.returned_at)}
                            {order.received_by_name && (
                              <span> by {order.received_by_name}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {order.rider_name ? (
                          <div className="flex items-center">
                            <Truck className="h-3 w-3 text-green-500 mr-1" />
                            <div>
                              <div className="text-xs font-medium text-gray-900">{order.rider_name}</div>
                              <div className="text-[10px] text-gray-500">{order.rider_contact}</div>
                                                              {order.assigned_at && (
                                  <div className="text-[10px] text-gray-400">
                                    Assigned: {formatDateTime(order.assigned_at)}
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not assigned</span>
                        )}
                      </td>
                                             <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                         <div className="flex items-center space-x-1.5">
                           <button
                             onClick={() => openViewModal(order)}
                             className="text-blue-600 hover:text-blue-900 flex items-center text-xs"
                           >
                             <Eye className="h-3 w-3 mr-0.5" />
                             View
                           </button>
                           {order.my_status === 1 && user?.role === 'stock' && (
                             <button
                               onClick={() => openAssignRiderModal(order)}
                               className="text-green-600 hover:text-green-900 flex items-center bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded text-xs"
                             >
                               <Truck className="h-3 w-3 mr-0.5" />
                               Assign Rider
                             </button>
                           )}
                           {order.my_status === 2 && (
                             <button
                               onClick={() => openCompleteDeliveryModal(order)}
                               className="text-blue-600 hover:text-blue-900 flex items-center bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded text-xs"
                             >
                               <Package className="h-3 w-3 mr-0.5" />
                               Complete Delivery
                             </button>
                           )}
                           {order.status === 'delivered' && (
                             <button
                               onClick={() => openDeliveryDetailsModal(order)}
                               className="text-green-600 hover:text-green-900 flex items-center bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded text-xs"
                             >
                               <Truck className="h-3 w-3 mr-0.5" />
                               View Delivery Details
                             </button>
                           )}
                           {(order.my_status === 4 || order.my_status === 6) && user?.role === 'stock' && (
                             order.my_status === 6 ? (
                               <button
                                 disabled
                                 className="text-gray-400 flex items-center bg-gray-100 px-1.5 py-0.5 rounded cursor-not-allowed text-xs"
                                 title="Products already returned to stock"
                               >
                                 <ArrowLeft className="h-3 w-3 mr-0.5" />
                                 Already Returned
                               </button>
                             ) : (
                               <button
                                 onClick={() => openReceiveToStockModal(order)}
                                 className="text-orange-600 hover:text-orange-900 flex items-center bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded text-xs"
                               >
                                 <ArrowLeft className="h-3 w-3 mr-0.5" />
                                 Receive to Stock
                               </button>
                             )
                           )}
                          {(order.my_status === 1 || order.my_status === 2 || order.my_status === 3) && (
                            <button
                              onClick={() => navigate(`/sales-orders/${order.id}`)}
                              className="text-purple-600 hover:text-purple-900 flex items-center bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded text-xs"
                            >
                              <Package className="h-3 w-3 mr-0.5" />
                              Invoice
                            </button>
                            
                          )}
                          {(order.my_status === 1 || order.my_status === 2 || order.my_status === 3) && (
                            <button
                              onClick={() => navigate(`/delivery-note/${order.id}`)}
                              className="text-purple-600 hover:text-purple-900 flex items-center bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded text-xs"
                            >
                              <Package className="h-3 w-3 mr-0.5" />
                              Delivery Note
                            </button>
                            
                          )}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-2 border-t border-gray-200">
                <div className="text-xs text-gray-600">Page {page} of {totalPages} • {totalOrders} total orders</div>
                <div className="flex items-center gap-1.5">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                    value={limit}
                    onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button
                    className="px-2.5 py-1 text-xs border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-2.5 py-1 text-xs border rounded disabled:opacity-50"
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
            <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-xl rounded-lg bg-white">
              <div className="mt-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {isEditing ? 'Edit Order' : 'View Order'}: {selectedOrder.so_number}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isEditing ? 'Edit order details and products' : 'Order Details'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {!isEditing && (
                      <>
                        {user?.role === 'admin' && (
                          <button
                            onClick={startEditing}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <Edit className="h-3 w-3 mr-0.5" />
                            Edit Order
                          </button>
                        )}
                        {selectedOrder.status === 'draft' && user?.role === 'admin' && (
                          <button
                            onClick={convertToInvoice}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <Save className="h-3 w-3 mr-0.5" />
                            Convert to Invoice
                          </button>
                        )}
                        {user?.role !== 'admin' && (
                          <div className="text-xs text-gray-500 italic">
                            Only admin users can edit orders or convert to invoices
                          </div>
                        )}
                      </>
                    )}
                    

                    
                    <button
                      onClick={closeViewModal}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-xs">
                    {successMessage}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
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
                      {/* Pricing Information Note */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> Unit prices shown are exclusive of tax. Tax is calculated and added to each item's total price.
                            </p>
                          </div>
                        </div>
                      </div>
                      
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
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price (Excl. Tax)</th>
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
                      {/* Pricing Information Note */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> Unit prices shown are exclusive of tax. Tax is calculated and added to each item's total price.
                            </p>
                          </div>
                        </div>
                      </div>
                      
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
                                  Price: {formatCurrency(item.unit_price)} (excl. tax)
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
                                Price: {formatCurrency(item.unit_price)} (excl. tax)
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
                <div className="flex space-x-4">
                  {selectedOrder.my_status === 1 && user?.role === 'stock' && (
                    <button
                      type="button"
                      onClick={() => openAssignRiderModal(selectedOrder)}
                      className="px-6 py-3 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Assign Rider
                    </button>
                  )}
                  {selectedOrder.my_status === 4 && (user?.role === 'stock' || user?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => openReceiveToStockModal(selectedOrder)}
                      className="px-6 py-3 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Receive to Stock
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeViewModal}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
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

        {/* Complete Delivery Modal */}
        {showCompleteDeliveryModal && completingOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Complete Delivery - Order {completingOrder.so_number}</h2>
                <button
                  onClick={closeCompleteDeliveryModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {completeDeliveryError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {completeDeliveryError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={completeDeliveryForm.recipient_name}
                    onChange={(e) => handleCompleteDeliveryFormChange('recipient_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter recipient's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Phone *
                  </label>
                  <input
                    type="tel"
                    value={completeDeliveryForm.recipient_phone}
                    onChange={(e) => handleCompleteDeliveryFormChange('recipient_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter recipient's phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCompleteDeliveryFormChange('delivery_image', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload proof of delivery (optional)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={completeDeliveryForm.notes}
                    onChange={(e) => handleCompleteDeliveryFormChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional delivery notes (optional)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeCompleteDeliveryModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteDelivery}
                  disabled={completeDeliveryLoading || !completeDeliveryForm.recipient_name || !completeDeliveryForm.recipient_phone}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {completeDeliveryLoading ? 'Completing...' : 'Complete Delivery'}
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

        {/* Receive to Stock Modal */}
        {showReceiveToStockModal && receivingOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-8 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-xl rounded-lg bg-white">
              <div className="mt-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Receive Products to Stock
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Order: {receivingOrder.so_number} - {receivingOrder.customer_name || receivingOrder.customer?.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Order Date: {formatDate(receivingOrder.order_date)} | Total Items: {receivingOrder.items?.length || 0}
                    </p>
                  </div>
                  <button
                    onClick={closeReceiveToStockModal}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Error Message */}
                {receiveError && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {receiveError}
                  </div>
                )}

                {/* Form */}
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">Return Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-orange-600">Total Items:</span>
                        <span className="ml-2 font-medium text-orange-800">
                          {receiveForm.items.reduce((sum, item) => sum + item.quantity, 0)} / {receiveForm.items.reduce((sum, item) => sum + item.original_quantity, 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-orange-600">Total Value:</span>
                        <span className="ml-2 font-medium text-orange-800">
                          {formatCurrency(receiveForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-orange-600">Store:</span>
                        <span className="ml-2 font-medium text-orange-800">
                          {stores.find(s => s.id.toString() === receiveForm.store_id)?.store_name || 'Not selected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Store Selection */}
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Select Store</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store *
                        </label>
                        <select
                          value={receiveForm.store_id}
                          onChange={(e) => handleReceiveFormChange('store_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a store...</option>
                          {stores.map(store => (
                            <option key={store.id} value={store.id}>
                              {store.store_name} ({store.store_code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={receiveForm.notes}
                          onChange={(e) => handleReceiveFormChange('notes', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add notes about this return to stock..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Products to Receive */}
                  <div className="p-6 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Products to Receive</h4>
                      <button
                        type="button"
                        onClick={resetToOriginalQuantities}
                        className="px-3 py-1 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        Reset to Original
                      </button>
                    </div>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Instructions:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Adjust the return quantity for each product (cannot exceed original order quantity)</li>
                          <li>Set the unit cost for inventory valuation (if left as 0, product's default cost will be used)</li>
                          <li>All products will be added to the selected store's inventory</li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {receiveForm.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No products to receive.</p>
                        </div>
                      ) : (
                        <>
                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Qty</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Cost</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {receiveForm.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2">
                                      <div className="text-sm font-medium text-gray-900">
                                        {item.product_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Product ID: {item.product_id}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="text-sm text-gray-900">
                                        {item.original_quantity}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max={item.original_quantity}
                                        value={item.quantity}
                                        onChange={(e) => handleReceiveItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                      {(() => {
                                        const product = products.find(p => p.id === item.product_id);
                                        return product?.cost_price ? formatCurrency(product.cost_price) : 'N/A';
                                      })()}
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_cost}
                                        onChange={(e) => handleReceiveItemChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {formatCurrency(item.quantity * item.unit_cost)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex justify-end items-center pt-4 border-t border-gray-200">
                            <div className="text-right space-y-1">
                              <div className="text-sm text-gray-600">
                                Total Items: {receiveForm.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                Total Value: {formatCurrency(receiveForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeReceiveToStockModal}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReceiveToStock}
                      disabled={receiveLoading || !receiveForm.store_id || receiveForm.items.some(item => item.quantity <= 0)}
                      className="px-6 py-3 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {receiveLoading ? 'Processing...' : 'Receive to Stock'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Details Modal */}
        {showDeliveryDetailsModal && deliveryDetailsOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-600">Delivery Details - Order {deliveryDetailsOrder.so_number}</h2>
                <button
                  onClick={closeDeliveryDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order Number</label>
                      <p className="text-sm text-gray-900">{deliveryDetailsOrder.so_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer</label>
                      <p className="text-sm text-gray-900">{deliveryDetailsOrder.customer_name || deliveryDetailsOrder.customer?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order Date</label>
                      <p className="text-sm text-gray-900">{formatDate(deliveryDetailsOrder.order_date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
                      <p className="text-sm text-gray-900">{deliveryDetailsOrder.expected_delivery_date ? formatDate(deliveryDetailsOrder.expected_delivery_date) : 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Information</h3>
                  <div className="space-y-3">
                    {deliveryDetailsOrder.rider_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rider</label>
                        <p className="text-sm text-gray-900">{deliveryDetailsOrder.rider_name}</p>
                        {deliveryDetailsOrder.rider_contact && (
                          <p className="text-xs text-gray-600">Contact: {deliveryDetailsOrder.rider_contact}</p>
                        )}
                      </div>
                    )}
                    {deliveryDetailsOrder.assigned_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned At</label>
                        <p className="text-sm text-gray-900">{formatDate(deliveryDetailsOrder.assigned_at)}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Delivery Status</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Notes */}
                {deliveryDetailsOrder.delivery_notes && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Notes</h3>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{deliveryDetailsOrder.delivery_notes}</p>
                    </div>
                  </div>
                )}

                {/* Delivery Image */}
                {deliveryDetailsOrder.delivery_image && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Image</h3>
                    <div className="bg-white p-3 rounded border">
                      <img 
                        src={deliveryDetailsOrder.delivery_image.startsWith('http') 
                          ? deliveryDetailsOrder.delivery_image 
                          : `/uploads/products/${deliveryDetailsOrder.delivery_image}`}
                        alt="Delivery Image"
                        className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => window.open(
                          deliveryDetailsOrder.delivery_image.startsWith('http') 
                            ? deliveryDetailsOrder.delivery_image 
                            : `/uploads/products/${deliveryDetailsOrder.delivery_image}`, 
                          '_blank'
                        )}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<p class="text-sm text-gray-500 italic">Image not found or failed to load</p>';
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">Click image to view full size</p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {deliveryDetailsOrder.items && deliveryDetailsOrder.items.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivered Items</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {deliveryDetailsOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.product_name}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-900">Total Amount:</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{formatCurrency(deliveryDetailsOrder.total_amount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeDeliveryDetailsModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersPage; 