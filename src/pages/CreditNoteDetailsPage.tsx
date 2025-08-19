import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Package, 
  Building,
  Download,
  Eye,
  CheckSquare,
  Info,
  AlertCircle
} from 'lucide-react';
import { creditNoteService } from '../services/creditNoteService';
import { useAuth } from '../contexts/AuthContext';

interface CreditNoteItem {
  product_id: number;
  product_name?: string;
  product_code?: string;
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
  customer_code?: string;
  credit_note_date: string;
  original_invoice_id?: number;
  original_invoice_number?: string;
  reason?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  my_status?: number;
  received_by?: number;
  received_at?: string;
  staff_name?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  contact?: string;
  address?: string;
  items?: CreditNoteItem[];
}

const CreditNoteDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCreditNote(parseInt(id));
    }
  }, [id]);

  const fetchCreditNote = async (creditNoteId: number) => {
    try {
      setLoading(true);
      const response = await creditNoteService.getById(creditNoteId);
      
      if (response.success) {
        setCreditNote(response.data);
      } else {
        setError(response.message || 'Failed to fetch credit note');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credit note');
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMyStatusColor = (myStatus?: number) => {
    switch (myStatus) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 0:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMyStatusText = (myStatus?: number) => {
    switch (myStatus) {
      case 1:
        return 'Received';
      case 0:
        return 'Not Received';
      default:
        return 'Unknown';
    }
  };

  const handleBack = () => {
    navigate('/credit-note-summary');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !creditNote) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error || 'Credit note not found'}</div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back button and Print button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Credit Note #{creditNote.credit_note_number}</h1>
              <p className="text-base text-gray-500">Credit Note Details</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Credit Note Content - A4 Style Container */}
        <div className="a4-credit-note-print m-2 relative">
          {/* Header Section */}
          <div className="credit-note-header mb-6">
            <div className="flex justify-between items-start">
              {/* Company Information */}
              <div className="company-info">
                <img
                  src="/woosh.jpg"
                  alt="Company Logo"
                  className="h-20 w-auto object-contain mb-2"
                  style={{ maxWidth: '120px' }}
                />
                <h1 className="company-name">Moonsun Trade International Limited</h1>
                <p className="company-address">P.O Box 15470, Nairobi Kenya</p>
                <p className="company-tax">Tax PIN: P051904794X</p>
              </div>
              
              {/* Credit Note Details */}
              <div className="credit-note-details text-right">
                <h2 className="credit-note-title">CREDIT NOTE</h2>
                <div className="credit-note-meta">
                  <p><strong>Credit Note No:</strong> {creditNote.credit_note_number}</p>
                  <p><strong>Date:</strong> {formatDate(creditNote.credit_note_date)}</p>
                  {creditNote.original_invoice_number && (
                    <p><strong>Original Invoice:</strong> {creditNote.original_invoice_number}</p>
                  )}
                  {/* <p><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(creditNote.status)}`}>
                      {creditNote.status}
                    </span>
                  </p>
                  <p><strong>Receive Status:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMyStatusColor(creditNote.my_status)}`}>
                      {getMyStatusText(creditNote.my_status)}
                    </span>
                  </p> */}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="bill-to-section mb-6">
            <div className="flex justify-between">
              <div className="bill-to">
                <h3 className="section-title">To:</h3>
                <p className="customer-name">{creditNote.customer_name || 'N/A'}</p>
                <p className="customer-address">{creditNote.address || 'N/A'}</p>
                {creditNote.customer_code && (
                  <p className="customer-code">Customer Code: {creditNote.customer_code}</p>
                )}
                {creditNote.email && (
                  <p className="customer-email">Email: {creditNote.email}</p>
                )}
                {creditNote.contact && (
                  <p className="customer-contact">Contact: {creditNote.contact}</p>
                )}
              </div>
              
              <div className="flex flex-col gap-4 hidden">
                <div className="credit-note-info">
                  <h3 className="section-title">Credit Note Information</h3>
                  <p><strong>Created By:</strong> {creditNote.creator_name || 'N/A'}</p>
                  <p><strong>Created Date:</strong> {formatDate(creditNote.created_at)}</p>
                  {creditNote.received_by && creditNote.staff_name && (
                    <p><strong>Received By:</strong> {creditNote.staff_name}</p>
                  )}
                  {creditNote.received_at && (
                    <p><strong>Received Date:</strong> {formatDate(creditNote.received_at)}</p>
                  )}
                  <p><strong>Last Updated:</strong> {formatDate(creditNote.updated_at)}</p>
                </div>
                
                {creditNote.reason && (
                  <div className="reason-box">
                    <h4 className="section-subtitle">Reason for Credit</h4>
                    <p className="reason-text">{creditNote.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="items-section mb-6">
            {creditNote.items && creditNote.items.length > 0 ? (
              <table className="credit-note-table">
                <thead>
                  <tr>
                    <th className="item-col">Item</th>
                    <th className="invoice-col">Original Invoice</th>
                    <th className="qty-col">Qty</th>
                    <th className="price-col">Unit Price</th>
                    <th className="total-col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNote.items.map((item, index) => (
                    <tr key={index}>
                      <td className="item-col">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium">{item.product_name || `Product ${item.product_id}`}</div>
                            {item.product_code && (
                              <div className="text-sm text-gray-500">{item.product_code}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="invoice-col">#{item.invoice_id}</td>
                      <td className="qty-col">{item.quantity}</td>
                      <td className="price-col">{formatCurrency(item.unit_price)}</td>
                      <td className="total-col">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No items found for this credit note</p>
              </div>
            )}
          </div>

          {/* Totals Section */}
          <div className="totals-section">
            <div className="flex justify-end">
              <table className="totals-table">
                <tbody>
                  <tr>
                    <td className="label">Subtotal:</td>
                    <td className="amount">{formatCurrency(creditNote.subtotal)}</td>
                  </tr>
                  <tr>
                    <td className="label">VAT (16%):</td>
                    <td className="amount">{formatCurrency(creditNote.tax_amount)}</td>
                  </tr>
                  <tr className="total-row">
                    <td className="label">Total Credit Amount:</td>
                    <td className="amount">{formatCurrency(creditNote.total_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="credit-note-footer">
            <div className="footer-content">
              <div className="grid grid-cols-2 gap-8 mb-4">
                <div className="payment-info">
                  <h4 className="section-subtitle">Payment Information</h4>
                  <p><strong>Bank:</strong> Diamond Trust Bank</p>
                  <p><strong>Branch:</strong> Westgate</p>
                  <p><strong>Account:</strong> 0035504001 (KES)</p>
                  <p><strong>Swift:</strong> DTKEKENA</p>
                  <p><strong>M-Pesa:</strong> Paybill 516600</p>
                </div>
                <div className="terms">
                  <h4 className="section-subtitle">Credit Note Terms</h4>
                  <p>• This credit note reduces your outstanding balance</p>
                  <p>• Can be applied to future invoices</p>
                  <p>• Valid for 12 months from issue date</p>
                  <p>• Contact us for any questions</p>
                </div>
              </div>
              <div className="footer-message">
                <p>Thank you for your business!</p>
                <p>For any queries, please contact us at info@moonsun.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .a4-credit-note-print {
          width: 1200px;
          min-height: 1123px;
          background: #fff;
          margin: 0 auto;
          padding: 16px 12px;
          box-sizing: border-box;
          position: relative;
        }
        
        .credit-note-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .company-address, .company-tax {
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .credit-note-title {
          font-size: 28px;
          font-weight: bold;
          color: #dc2626;
          margin-bottom: 16px;
        }
        
        .credit-note-meta p {
          margin-bottom: 8px;
          color: #374151;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
        }
        
        .section-subtitle {
          font-size: 16px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 8px;
        }
        
        .customer-name {
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .customer-address, .customer-code, .customer-email, .customer-contact {
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .reason-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px;
        }
        
        .reason-text {
          color: #92400e;
          font-style: italic;
        }
        
        .credit-note-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .credit-note-table th {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          color: #374151;
        }
        
        .credit-note-table td {
          border: 1px solid #e5e7eb;
          padding: 12px 8px;
          color: #374151;
        }
        
        .item-col { width: 35%; }
        .invoice-col { width: 15%; }
        .qty-col { width: 10%; }
        .price-col { width: 20%; }
        .total-col { width: 20%; }
        
        .totals-table {
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 8px 16px;
          border: none;
        }
        
        .totals-table .label {
          text-align: right;
          font-weight: bold;
          color: #374151;
        }
        
        .totals-table .amount {
          text-align: right;
          color: #1f2937;
        }
        
        .total-row {
          border-top: 2px solid #e5e7eb;
        }
        
        .total-row .label, .total-row .amount {
          font-size: 18px;
          font-weight: bold;
          color: #dc2626;
        }
        
        .credit-note-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 20px 0;
          border-top: 2px solid #e5e7eb;
        }
        
        .footer-content {
          padding: 0 16px;
        }
        
        .payment-info p, .terms p {
          margin-bottom: 4px;
          color: #6b7280;
        }
        
        .footer-message {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-message p {
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        @media print {
          body { background: #fff !important; }
          .a4-credit-note-print { box-shadow: none !important; }
          .a4-credit-note-print table { table-layout: fixed; width: 100%; }
          .a4-credit-note-print th, .a4-credit-note-print td { 
            word-break: break-word; 
            overflow-wrap: break-word; 
            padding: 4px 6px; 
            font-size: 12px; 
          }
          .a4-credit-note-print tr, .a4-credit-note-print table { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default CreditNoteDetailsPage;
