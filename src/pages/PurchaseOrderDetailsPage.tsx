import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { purchaseOrdersService, suppliersService, productsService } from '../services/financialService';
import { storeService } from '../services/storeService';
import { PurchaseOrder, InventoryReceipt, Store, ReceiveItemsForm, CreatePurchaseOrderForm, Supplier, Product } from '../types/financial';

type PurchaseOrderWithReceipts = PurchaseOrder & { receipts?: InventoryReceipt[] };

type ReceivingItem = {
  product_id: number;
  received_quantity: number;
  unit_cost: number;
  product_name?: string;
  product_code?: string;
  max_quantity: number;
};

const PurchaseOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithReceipts | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [notes, setNotes] = useState('');
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<CreatePurchaseOrderForm | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Helper function to calculate tax-exclusive unit price
  const getTaxExclusivePrice = (taxInclusivePrice: number, taxType: string = '16%'): number => {
    const taxRate = taxType === '16%' ? 0.16 : 0;
    return taxInclusivePrice / (1 + taxRate);
  };

  // Helper function to calculate tax amount for a line item
  const getTaxAmount = (taxInclusivePrice: number, quantity: number, taxType: string = '16%'): number => {
    const taxExclusivePrice = getTaxExclusivePrice(taxInclusivePrice, taxType);
    return (taxInclusivePrice - taxExclusivePrice) * quantity;
  };

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
      fetchStores();
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      const suppliersRes = await suppliersService.getAll();
      if (suppliersRes.success && suppliersRes.data) setSuppliers(suppliersRes.data);

      const productsRes = await productsService.getAll();
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (editMode && purchaseOrder) {
      setEditForm({
        supplier_id: purchaseOrder.supplier_id,
        order_date: purchaseOrder.order_date.split('T')[0],
        expected_delivery_date: purchaseOrder.expected_delivery_date?.split('T')[0] || '',
        notes: purchaseOrder.notes || '',
        items: purchaseOrder.items?.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          // Convert tax-inclusive price to tax-exclusive for editing
          unit_price: getTaxExclusivePrice(item.unit_price)
        })) || []
      });
    }
  }, [editMode, purchaseOrder]);

  const fetchStores = async () => {
    try {
      const response = await storeService.getAllStores();
      if (response.success) {
        setStores(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const initializeReceivingItems = (po: any) => {
    const items = po.items?.map((item: any) => ({
      product_id: item.product_id,
      received_quantity: 0,
      unit_cost: getTaxExclusivePrice(item.unit_price), // Use tax-exclusive price for inventory
      product_name: item.product_name,
      product_code: item.product_code,
      max_quantity: item.quantity - (item.received_quantity || 0)
    })) || [];
    setReceivingItems(items);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const updatedItems = [...receivingItems];
    const item = updatedItems[index];
    const maxQuantity = item.max_quantity;
    
    // Ensure quantity doesn't exceed max and is not negative
    const validQuantity = Math.max(0, Math.min(value, maxQuantity));
    
    updatedItems[index] = {
      ...item,
      received_quantity: validQuantity
    };
    
    setReceivingItems(updatedItems);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore) {
      setError('Please select a store');
      return;
    }

    const itemsToReceive = receivingItems.filter(item => item.received_quantity > 0);
    
    if (itemsToReceive.length === 0) {
      setError('Please enter quantities for at least one item');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const receiveData: ReceiveItemsForm = {
        storeId: selectedStore as number,
        items: itemsToReceive,
        notes
      };

      const response = await purchaseOrdersService.receiveItems(
        parseInt(id!),
        receiveData
      );

      if (response.success) {
        alert('Items received successfully!');
        setShowReceiveForm(false);
        setSelectedStore('');
        setNotes('');
        // Refresh the purchase order data
        fetchPurchaseOrder();
      } else {
        setError(response.error || 'Failed to receive items');
      }
    } catch (err) {
      setError('Failed to receive items');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrdersService.getWithReceipts(parseInt(id!));
      if (response.success) {
        setPurchaseOrder(response.data);
        initializeReceivingItems(response.data);
      } else {
        setError(response.error || 'Failed to fetch purchase order');
      }
    } catch (err) {
      setError('Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPO = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      await purchaseOrdersService.updateStatus(parseInt(id), 'sent');
      await fetchPurchaseOrder();
    } catch (err) {
      alert('Failed to send purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const handleEditItemChange = (index: number, field: string, value: any) => {
    if (!editForm) return;
    const items = [...editForm.items];
    
    if (field === 'unit_price') {
      // Convert tax-exclusive price to tax-inclusive for storage
      const taxInclusivePrice = value * 1.16; // Assuming 16% tax rate
      items[index] = { ...items[index], [field]: taxInclusivePrice };
    } else {
    items[index] = { ...items[index], [field]: value };
    }
    
    setEditForm({ ...editForm, items });
  };

  const handleAddEditItem = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      items: [...editForm.items, { product_id: 0, quantity: 1, unit_price: 0 }]
    });
  };

  const handleRemoveEditItem = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      items: editForm.items.filter((_, i) => i !== index)
    });
  };

  const handleSaveEdit = async () => {
    if (!id || !editForm) return;
    try {
      setSubmitting(true);
      await purchaseOrdersService.update(parseInt(id), editForm);
      await fetchPurchaseOrder();
      setEditMode(false);
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditForm(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      received: { color: 'bg-green-100 text-green-800', label: 'Received' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Add this handler for canceling the PO
  const handleCancelPO = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to cancel this purchase order? This action cannot be undone.')) return;
    try {
      setSubmitting(true);
      await purchaseOrdersService.updateStatus(parseInt(id), 'cancelled');
      await fetchPurchaseOrder();
    } catch (err) {
      alert('Failed to cancel purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Purchase Order not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            <div>
                <h1 className="text-4xl font-bold text-gray-900">Purchase Order</h1>
                <p className="mt-2 text-lg text-gray-600">
                  #{purchaseOrder.po_number} • {getStatusBadge(purchaseOrder.status)}
                </p>
              </div>
            </div>
              <div className="flex space-x-3">
              <Link to="/purchase-orders" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Back to Purchase Orders
              </Link>
              {/* Cancel button only if not already cancelled */}
              {purchaseOrder && purchaseOrder.status !== 'cancelled' && (
                <button
                  onClick={handleCancelPO}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Cancelling...' : 'Cancel Purchase Order'}
              </button>
              )}
              {purchaseOrder.status === 'received' && purchaseOrder.invoice_number && (
                <Link
                to={`/supplier-invoice/${purchaseOrder.id}`}
                className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                title={`Supplier Invoice ${purchaseOrder.invoice_number}`}
              >
                View Supplier Invoice
              </Link>
              )}
              {purchaseOrder.status === 'sent' && (
                <button
                  onClick={() => setShowReceiveForm(!showReceiveForm)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {showReceiveForm ? 'Cancel Receiving' : 'Receive Items'}
                </button>
              )}
              {purchaseOrder.status === 'draft' && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit
                </button>
              )}
              {purchaseOrder.status === 'draft' && editMode && (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </>
              )}
              {purchaseOrder.status === 'draft' && (
                <button
                  onClick={handleSendPO}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={submitting || editMode}
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Order Summary */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Order Information</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">PO Number</p>
                  <p className="text-sm font-medium text-gray-900">{purchaseOrder.po_number}</p>
                </div>
                <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <div>{getStatusBadge(purchaseOrder.status)}</div>
                </div>
                <div>
              <p className="text-xs text-gray-500 mb-1">Order Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(purchaseOrder.order_date)}
                  </p>
                </div>
                {purchaseOrder.expected_delivery_date && (
                  <div>
                <p className="text-xs text-gray-500 mb-1">Expected Delivery</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(purchaseOrder.expected_delivery_date)}
                    </p>
                  </div>
                )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Supplier</p>
                  {editMode ? (
                    <select
                      value={editForm?.supplier_id || ''}
                      onChange={e => handleEditFormChange('supplier_id', Number(e.target.value))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                    >
                      <option value="">Select supplier...</option>
                      {suppliers.map((s: Supplier) => (
                        <option key={s.id} value={s.id}>{s.company_name}</option>
                      ))}
                    </select>
                  ) : (
                <span className="text-sm font-medium text-gray-900">
                      {purchaseOrder.supplier_name ||
                        suppliers.find(s => s.id === purchaseOrder.supplier_id)?.company_name ||
                        'N/A'}
                    </span>
                  )}
                </div>
                <div>
              <p className="text-xs text-gray-500 mb-1">Created By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {purchaseOrder.created_by_user?.full_name || 'N/A'}
                  </p>
                </div>
                <div>
              <p className="text-xs text-gray-500 mb-1">Created Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(purchaseOrder.created_at)}
                  </p>
                </div>
            <div className="col-span-2 md:col-span-1 lg:col-span-1">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
                  {editMode ? (
                    <textarea
                      value={editForm?.notes || ''}
                      onChange={e => handleEditFormChange('notes', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                  rows={2}
                    />
                  ) : (
                <span className="text-sm font-medium text-gray-900">{purchaseOrder.notes}</span>
                  )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Order Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Unit Price (excl. tax)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editMode && editForm ? (
                  editForm.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={item.product_id}
                          onChange={e => handleEditItemChange(index, 'product_id', Number(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1"
                        >
                          <option value={0}>Select product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.product_name} ({product.product_code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => handleEditItemChange(index, 'quantity', Number(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={getTaxExclusivePrice(item.unit_price).toFixed(2)}
                          onChange={e => handleEditItemChange(index, 'unit_price', Number(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 w-24"
                        />
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {getTaxAmount(item.unit_price, item.quantity).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <button type="button" onClick={() => handleRemoveEditItem(index)} className="text-red-600 hover:text-red-800">Remove</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  purchaseOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.product?.product_name ||
                          products.find(p => p.id === item.product_id)?.product_name ||
                          'N/A'}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{getTaxExclusivePrice(item.unit_price).toFixed(2)}</td>
                      <td>{getTaxAmount(item.unit_price, item.quantity).toFixed(2)}</td>
                      <td>{item.total_price}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {editMode && (
                <tfoot>
                  <tr>
                    <td colSpan={5}>
                      <button type="button" onClick={handleAddEditItem} className="text-blue-600 hover:text-blue-800">Add Item</button>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          
          {/* Order Totals */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <div className="w-80 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Order Summary</h3>
                <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(purchaseOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Tax:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(purchaseOrder.tax_amount)}</span>
                </div>
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(purchaseOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receive Items Form */}
        {showReceiveForm && (purchaseOrder.status === 'sent') && (
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Receive Items</h2>
            </div>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm font-medium text-red-700">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit}>
              {/* Store Selection */}
              <div className="mb-8">
                <label htmlFor="store" className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Store *
                </label>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value ? parseInt(e.target.value) : '')}
                  className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3 border-2 transition-all duration-200"
                  required
                >
                  <option value="">Select a store...</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.store_name} ({store.store_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items to Receive */}
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Items to Receive</h3>
                </div>
                
                <div className="grid gap-4">
                      {receivingItems.map((item, index) => (
                    <div key={item.product_id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-all duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        {/* Product Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {item.product_name ||
                                  products.find(p => p.id === item.product_id)?.product_name ||
                                  'N/A'}
                              </div>
                              <div className="text-sm text-gray-600 font-medium">
                                Code: {item.product_code ||
                                  products.find(p => p.id === item.product_id)?.product_code ||
                                  'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Remaining Quantity */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500 font-medium mb-1">Remaining</div>
                          <div className="text-2xl font-bold text-blue-600">{item.max_quantity}</div>
                        </div>

                        {/* Receive Quantity Input */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500 font-medium mb-2">Receive Qty</div>
                            <input
                              type="number"
                              min="0"
                              max={item.max_quantity}
                              value={item.received_quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                            className="block w-24 mx-auto text-center border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold transition-all duration-200"
                              disabled={item.max_quantity === 0}
                            />
                        </div>

                        {/* Unit Cost */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500 font-medium mb-1">Unit Cost</div>
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(item.unit_cost)}</div>
                        </div>

                        {/* Total */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500 font-medium mb-1">Total</div>
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(item.received_quantity * item.unit_cost)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {item.max_quantity > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((item.received_quantity / item.max_quantity) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((item.received_quantity / item.max_quantity) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <label htmlFor="notes" className="text-lg font-semibold text-gray-900">
                  Notes (Optional)
                </label>
                </div>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-4 transition-all duration-200"
                  placeholder="Add any notes about this receipt..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total Receiving:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(receivingItems.reduce((total, item) => total + (item.received_quantity * item.unit_cost), 0))}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowReceiveForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || receivingItems.reduce((total, item) => total + item.received_quantity, 0) === 0}
                  className="px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {submitting ? 'Receiving...' : 'Receive Items'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Receipt History */}
        {purchaseOrder.receipts && purchaseOrder.receipts.length > 0 && (
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Receipt History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(receipt.received_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {receipt.product_name ||
                              products.find(p => p.id === receipt.product_id)?.product_name ||
                              'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {receipt.product_code ||
                              products.find(p => p.id === receipt.product_id)?.product_code ||
                              'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.store_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.received_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(receipt.unit_cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(receipt.total_cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.received_by_name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailsPage; 