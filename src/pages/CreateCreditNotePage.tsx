import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Package, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  FileText,
  User,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Receipt,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  customersService, 
  productsService,
  invoiceService
} from '../services/financialService';
import { 
  creditNoteService,
  CreditNoteItem,
  CustomerInvoice
} from '../services/creditNoteService';
import { 
  Customer, 
  Product
} from '../types/financial';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreateCreditNotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInvoiceItems, setLoadingInvoiceItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [clientId, setClientId] = useState('');
  const [creditNoteDate, setCreditNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
  const [items, setItems] = useState<CreditNoteItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Map<number, any[]>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    const urlClientId = searchParams.get('customerId');
    const urlInvoiceId = searchParams.get('invoiceId');
    
    if (urlClientId) {
      setClientId(urlClientId);
    }
    
    if (urlInvoiceId && customerInvoices.length > 0) {
      const invoice = customerInvoices.find(inv => inv.id === parseInt(urlInvoiceId));
      if (invoice) {
        setSelectedInvoices(new Set([invoice.id]));
      }
    }
  }, [searchParams, customerInvoices]);

  useEffect(() => {
    if (clientId) {
      fetchCustomerInvoices();
    }
  }, [clientId]);

  // Auto-load invoice items when invoices are selected
  useEffect(() => {
    if (selectedInvoices.size > 0) {
      loadInvoiceItems();
    } else {
      setItems([]);
      setAvailableProducts(new Map());
    }
  }, [selectedInvoices]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersRes, productsRes] = await Promise.all([
        customersService.getAll(),
        productsService.getAll()
      ]);

      if (customersRes.success) {
        setCustomers(customersRes.data || []);
      }
      if (productsRes.success) {
        setProducts(productsRes.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInvoices = async () => {
    try {
      const response = await creditNoteService.getCustomerInvoices(parseInt(clientId));
      if (response.success && Array.isArray(response.data)) {
        setCustomerInvoices(response.data);
      } else {
        console.warn('Invalid response format for customer invoices:', response);
        setCustomerInvoices([]);
      }
    } catch (err: any) {
      console.error('Error fetching customer invoices:', err);
      setCustomerInvoices([]);
    }
  };

  const handleInvoiceSelect = (invoiceId: number) => {
    const newSelectedInvoices = new Set(selectedInvoices);
    if (newSelectedInvoices.has(invoiceId)) {
      newSelectedInvoices.delete(invoiceId);
    } else {
      newSelectedInvoices.add(invoiceId);
    }
    setSelectedInvoices(newSelectedInvoices);
    
    // Clear items when changing invoice selection
    if (newSelectedInvoices.size === 0) {
      setItems([]);
      setAvailableProducts(new Map());
    }
  };

  const addItem = () => {
    const selectedInvoiceIds = Array.from(selectedInvoices);
    if (selectedInvoiceIds.length === 0) return;
    
    // Find the first available product from any selected invoice
    let firstAvailableProduct: any = null;
    let firstInvoiceId: number = 0;
    
    for (const invoiceId of selectedInvoiceIds) {
      const invoiceProducts = availableProducts.get(invoiceId);
      if (invoiceProducts && invoiceProducts.length > 0) {
        firstAvailableProduct = invoiceProducts[0];
        firstInvoiceId = invoiceId;
        break;
      }
    }
    
    if (!firstAvailableProduct) return;
    
    const newItem: CreditNoteItem = {
      product_id: firstAvailableProduct.product_id,
      invoice_id: firstInvoiceId,
      quantity: firstAvailableProduct.quantity,
      unit_price: firstAvailableProduct.unit_price,
      total_price: firstAvailableProduct.total_price
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreditNoteItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedItems[index];
      item.total_price = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    }

    // Set product details if product_id changed
    if (field === 'product_id') {
      const item = updatedItems[index];
      const invoiceProducts = availableProducts.get(item.invoice_id);
      if (invoiceProducts) {
        const product = invoiceProducts.find(p => p.product_id === value);
        if (product) {
          updatedItems[index].unit_price = Number(product.unit_price) || 0;
          updatedItems[index].total_price = (Number(updatedItems[index].quantity) || 0) * (Number(product.unit_price) || 0);
        }
      }
    }

    // If invoice_id changed, update product_id to match available products
    if (field === 'invoice_id') {
      const item = updatedItems[index];
      const invoiceProducts = availableProducts.get(value);
      if (invoiceProducts && invoiceProducts.length > 0) {
        // Reset to first available product from this invoice
        const firstProduct = invoiceProducts[0];
        updatedItems[index].product_id = firstProduct.product_id;
        updatedItems[index].unit_price = Number(firstProduct.unit_price) || 0;
        updatedItems[index].total_price = (Number(updatedItems[index].quantity) || 0) * (Number(firstProduct.unit_price) || 0);
      } else {
        updatedItems[index].product_id = 0;
        updatedItems[index].unit_price = 0;
        updatedItems[index].total_price = 0;
      }
    }

    setItems(updatedItems);
  };

  const loadInvoiceItems = async () => {
    if (selectedInvoices.size === 0) return;

    setLoadingInvoiceItems(true);
    try {
      const allItems: CreditNoteItem[] = [];
      const newAvailableProducts = new Map<number, any[]>();
      
      // Load items from all selected invoices
      for (const invoiceId of selectedInvoices) {
        const response = await invoiceService.getById(invoiceId);
        
        if (response.success && response.data && response.data.items) {
          // Store available products for this invoice
          newAvailableProducts.set(invoiceId, response.data.items);
          
          // Convert invoice items to credit note items
          const creditNoteItems: CreditNoteItem[] = response.data.items.map((item: any) => ({
            product_id: item.product_id,
            invoice_id: invoiceId,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            total_price: Number(item.total_price) || 0
          }));
          
          allItems.push(...creditNoteItems);
        }
      }
      
      setAvailableProducts(newAvailableProducts);
      
      if (allItems.length > 0) {
        setItems(allItems);
      } else {
        // Fallback to generic items if no items found
        const fallbackItems: CreditNoteItem[] = Array.from(selectedInvoices).map(invoiceId => {
          const invoice = customerInvoices.find(inv => inv.id === invoiceId);
          return {
            product_id: 0,
            invoice_id: invoiceId,
            quantity: 1,
            unit_price: Number(invoice?.total_amount) || 0,
            total_price: Number(invoice?.total_amount) || 0
          };
        });
        setItems(fallbackItems);
      }
    } catch (error) {
      console.error('Error loading invoice items:', error);
      // Fallback to generic items on error
      const fallbackItems: CreditNoteItem[] = Array.from(selectedInvoices).map(invoiceId => {
        const invoice = customerInvoices.find(inv => inv.id === invoiceId);
        return {
          product_id: 0,
          invoice_id: invoiceId,
          quantity: 1,
          unit_price: Number(invoice?.total_amount) || 0,
          total_price: Number(invoice?.total_amount) || 0
        };
      });
      setItems(fallbackItems);
    } finally {
      setLoadingInvoiceItems(false);
    }
  };

  const TAX_RATE = 0.16;
  const TAX_DIVISOR = 1 + TAX_RATE;

  const calculateNet = (price: number) => price / TAX_DIVISOR;
  const calculateTax = (price: number) => price - calculateNet(price);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateNet(item.total_price), 0);
  };

  const calculateTaxTotal = () => {
    return items.reduce((sum, item) => sum + calculateTax(item.total_price), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      setError('Please select a customer');
      return;
    }

    if (selectedInvoices.size === 0) {
      setError('Please select at least one invoice');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    if (items.some(item => item.product_id === 0)) {
      setError('Please select products for all items');
      return;
    }

    if (items.some(item => item.invoice_id === 0)) {
      setError('Please select invoices for all items');
      return;
    }

    // Validate that quantities don't exceed invoice quantities
    for (const item of items) {
      const invoiceProducts = availableProducts.get(item.invoice_id);
      if (invoiceProducts) {
        const invoiceProduct = invoiceProducts.find(p => p.product_id === item.product_id);
        if (invoiceProduct && item.quantity > Number(invoiceProduct.quantity)) {
          setError(`Quantity for product ${invoiceProduct.product_name || 'Unknown'} cannot exceed ${invoiceProduct.quantity} (invoice quantity)`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const creditNoteData = {
        customer_id: parseInt(clientId),
        credit_note_date: creditNoteDate,
        reason: reason || undefined,
        original_invoice_ids: Array.from(selectedInvoices),
        items: items
      };

      const response = await creditNoteService.create(creditNoteData);
      
      if (response.success) {
        setSuccess(`Credit note ${response.data.credit_note_number} created successfully!`);
        // Reset form
        setClientId('');
        setCreditNoteDate(new Date().toISOString().split('T')[0]);
        setReason('');
        setSelectedInvoices(new Set());
        setItems([]);
        setCustomerInvoices([]);
        setAvailableProducts(new Map());
      } else {
        setError(response.error || 'Failed to create credit note');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create credit note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
                          <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Credit Note</h1>
                <p className="text-sm text-gray-500">Generate a credit note for a client from multiple invoices - only products and quantities from selected invoices are allowed</p>
              </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Customer Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer *
          </label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSelectedInvoices(new Set());
              setItems([]);
            }}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name || customer.customer_code}
              </option>
            ))}
          </select>
          
          {/* Customer Information Display */}
          {clientId && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {(() => {
                const selectedCustomer = customers.find(c => c.id === parseInt(clientId));
                return selectedCustomer ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedCustomer.company_name || selectedCustomer.customer_code}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Contact:</span>
                      <span className="ml-2 text-gray-700">
                        {selectedCustomer.contact_person || selectedCustomer.contact || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-700">
                        {selectedCustomer.email || '-'}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Invoices List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                Available Invoices
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select multiple invoices to include in the credit note. Only products and quantities from these invoices can be used.
              </p>
              {clientId && customerInvoices && Array.isArray(customerInvoices) && customerInvoices.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">Total Available Credit:</span>
                      <span className="ml-2 text-lg font-bold">
                        ${(customerInvoices && Array.isArray(customerInvoices) ? customerInvoices.reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0) : 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600">
                      {(customerInvoices && Array.isArray(customerInvoices) ? customerInvoices.length : 0)} invoice{(customerInvoices && Array.isArray(customerInvoices) && customerInvoices.length !== 1) ? 's' : ''} available
                    </div>
                  </div>
                </div>
              )}
              {selectedInvoices.size > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-700">
                      <span className="font-medium">Selected Invoices:</span>
                      <span className="ml-2 text-lg font-bold">
                        {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedInvoices(new Set())}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Search and Filter */}
            {clientId && customerInvoices && Array.isArray(customerInvoices) && customerInvoices.length > 0 && (
              <div className="px-6 py-3 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search invoices by number or date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            )}
            
            <div className="p-6">
              {!clientId ? (
                 <div className="text-center py-8">
                   <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <p className="text-gray-500">Please select a customer first</p>
                 </div>
               ) : loading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                   <p className="text-gray-500">Loading customer invoices...</p>
                 </div>
               ) : !customerInvoices || !Array.isArray(customerInvoices) || customerInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No invoices available for this customer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(customerInvoices && Array.isArray(customerInvoices) ? customerInvoices : []).map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInvoices.has(invoice.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleInvoiceSelect(invoice.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          {selectedInvoices.has(invoice.id) ? (
                            <CheckSquare className="h-5 w-5 text-green-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {invoice.invoice_number}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Invoice Date</p>
                              <p className="text-gray-700 font-medium">
                                {new Date(invoice.invoice_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Due Date</p>
                              <p className="text-gray-700 font-medium">
                                {new Date(invoice.due_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Total Amount</p>
                              <p className="text-gray-900 font-semibold">
                                ${(Number(invoice.total_amount) || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Credited</p>
                              <p className="text-orange-600 font-medium">
                                ${(Number(invoice.credited_amount) || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Remaining</p>
                              <p className="text-green-600 font-semibold">
                                ${(Number(invoice.remaining_amount) || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {invoice.notes && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Notes:</p>
                              <p className="text-xs text-gray-600 italic">{invoice.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Available for Credit</div>
                            <div className="text-lg font-bold text-green-600">
                              ${(Number(invoice.remaining_amount) || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Credit Note Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Credit Note Details
              </h2>
              {selectedInvoices.size > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Creating credit note from {selectedInvoices.size} selected invoice{selectedInvoices.size !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Date and Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Note Date *
                  </label>
                  <input
                    type="date"
                    value={creditNoteDate}
                    onChange={(e) => setCreditNoteDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Credit Note
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the reason for this credit note..."
                />
              </div>

              {/* Invoice Items Loading Indicator */}
              {loadingInvoiceItems && (
                <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-700">Loading invoice items...</span>
                </div>
              )}

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Credit Note Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={selectedInvoices.size === 0 || Array.from(availableProducts.values()).every(products => products.length === 0)}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {selectedInvoices.size > 0 ? 'Select invoices to load items' : 'No invoices selected'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const invoiceProducts = availableProducts.get(item.invoice_id);
                      const availableProductsForInvoice = invoiceProducts || [];
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invoice
                              </label>
                              <select
                                value={item.invoice_id}
                                onChange={(e) => updateItem(index, 'invoice_id', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              >
                                <option value={0}>Select invoice</option>
                                {Array.from(selectedInvoices).map((invoiceId) => {
                                  const invoice = customerInvoices.find(inv => inv.id === invoiceId);
                                  return (
                                    <option key={invoiceId} value={invoiceId}>
                                      {invoice?.invoice_number || `Invoice ${invoiceId}`}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product *
                              </label>
                              <select
                                value={item.product_id}
                                onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              >
                                <option value={0}>Select a product</option>
                                {availableProductsForInvoice.map((product) => (
                                  <option key={product.product_id} value={product.product_id}>
                                    {product.product_name || `Product ${product.product_id}`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={(() => {
                                  const selectedProduct = availableProductsForInvoice.find(p => p.product_id === item.product_id);
                                  return selectedProduct ? Number(selectedProduct.quantity) : 0;
                                })()}
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Max: {(() => {
                                  const selectedProduct = availableProductsForInvoice.find(p => p.product_id === item.product_id);
                                  return selectedProduct ? selectedProduct.quantity : 0;
                                })()}
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Price
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Price
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                                ${(Number(item.total_price) || 0).toFixed(2)}
                              </div>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Totals */}
              {items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Note Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal (Net):</span>
                      <span className="font-medium">${(Number(calculateSubtotal()) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (16%):</span>
                      <span className="font-medium">${(Number(calculateTaxTotal()) || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total Credit Amount:</span>
                        <span className="text-lg font-semibold text-gray-900">${(Number(calculateTotal()) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || items.length === 0 || selectedInvoices.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Credit Note
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCreditNotePage; 