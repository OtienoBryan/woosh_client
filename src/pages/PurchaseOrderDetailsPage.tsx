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
          unit_price: item.unit_price
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
      unit_cost: item.unit_price,
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
    items[index] = { ...items[index], [field]: value };
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Order Details</h1>
              <p className="mt-2 text-sm text-gray-600">
                PO Number: {purchaseOrder.po_number}
              </p>
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
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">PO Number</p>
                  <p className="text-sm font-medium text-gray-900">{purchaseOrder.po_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(purchaseOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(purchaseOrder.order_date)}
                  </p>
                </div>
                {purchaseOrder.expected_delivery_date && (
                  <div>
                    <p className="text-sm text-gray-500">Expected Delivery</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(purchaseOrder.expected_delivery_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  {editMode ? (
                    <select
                      value={editForm?.supplier_id || ''}
                      onChange={e => handleEditFormChange('supplier_id', Number(e.target.value))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select supplier...</option>
                      {suppliers.map((s: Supplier) => (
                        <option key={s.id} value={s.id}>{s.company_name}</option>
                      ))}
                    </select>
                  ) : (
                    <span>
                      {purchaseOrder.supplier?.company_name ||
                        suppliers.find(s => s.id === purchaseOrder.supplier_id)?.company_name ||
                        'N/A'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {purchaseOrder.created_by_user?.full_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(purchaseOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  {editMode ? (
                    <textarea
                      value={editForm?.notes || ''}
                      onChange={e => handleEditFormChange('notes', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <span>{purchaseOrder.notes}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          value={item.unit_price}
                          onChange={e => handleEditItemChange(index, 'unit_price', Number(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 w-24"
                        />
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
                      <td>{item.unit_price}</td>
                      <td>{item.total_price}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {editMode && (
                <tfoot>
                  <tr>
                    <td colSpan={4}>
                      <button type="button" onClick={handleAddEditItem} className="text-blue-600 hover:text-blue-800">Add Item</button>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          
          {/* Order Totals */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(purchaseOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax:</span>
                  <span className="font-medium">{formatCurrency(purchaseOrder.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(purchaseOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receive Items Form */}
        {showReceiveForm && (purchaseOrder.status === 'sent') && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Receive Items</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit}>
              {/* Store Selection */}
              <div className="mb-6">
                <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Store *
                </label>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value ? parseInt(e.target.value) : '')}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Items to Receive</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Receive Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {receivingItems.map((item, index) => (
                        <tr key={item.product_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.product_name ||
                                  products.find(p => p.id === item.product_id)?.product_name ||
                                  'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.product_code ||
                                  products.find(p => p.id === item.product_id)?.product_code ||
                                  'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.max_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max={item.max_quantity}
                              value={item.received_quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                              className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              disabled={item.max_quantity === 0}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unit_cost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.received_quantity * item.unit_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReceiveForm(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || receivingItems.reduce((total, item) => total + item.received_quantity, 0) === 0}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Receiving...' : 'Receive Items'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Receipt History */}
        {purchaseOrder.receipts && purchaseOrder.receipts.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Receipt History</h2>
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