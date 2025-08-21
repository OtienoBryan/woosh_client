import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye, Save, X, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { suppliersService, myAssetsService } from '../services/financialService';

interface MyAsset {
  id: number;
  asset_code: string;
  asset_name: string;
  asset_type: string;
  purchase_date: string;
  location: string;
  supplier_id: number;
  price: number;
  quantity: number;
  supplier_name?: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
}

interface AssetForm {
  asset_code: string;
  asset_name: string;
  asset_type: string;
  purchase_date: string;
  location: string;
  supplier_id: number;
  price: number;
  quantity: number;
  document?: File;
}

const MyAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<MyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAssets, setFilteredAssets] = useState<MyAsset[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MyAsset | null>(null);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState<AssetForm>({
    asset_code: '',
    asset_name: '',
    asset_type: '',
    purchase_date: new Date().toISOString().split('T')[0],
    location: '',
    supplier_id: 0,
    price: 0,
    quantity: 1,
    document: undefined
  });

  useEffect(() => {
    fetchAssets();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    // Filter assets based on search term and status
    let filtered = assets.filter(asset =>
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredAssets(filtered);
  }, [searchTerm, assets]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await myAssetsService.getAll();
      if (response.success && response.data) {
        setAssets(response.data as unknown as MyAsset[]);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersService.getAll();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
    }
  };

  const handleAddAsset = () => {
    setFormData({
      asset_code: '',
      asset_name: '',
      asset_type: '',
      purchase_date: new Date().toISOString().split('T')[0],
      location: '',
      supplier_id: 0,
      price: 0,
      quantity: 1
    });
    setEditingAsset(null);
    setShowAddModal(true);
  };

  const handleEditAsset = (asset: MyAsset) => {
    setFormData({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      purchase_date: asset.purchase_date,
      location: asset.location,
      supplier_id: asset.supplier_id,
      price: asset.price,
      quantity: asset.quantity
    });
    setEditingAsset(asset);
    setShowAddModal(true);
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      await myAssetsService.delete(assetId);
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
      alert('Asset deleted successfully');
    } catch (err) {
      console.error('Error deleting asset:', err);
      alert('Failed to delete asset');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.asset_name.trim() || !formData.asset_code.trim()) {
      alert('Asset name and code are required');
      return;
    }

    try {
      if (editingAsset) {
        // Update existing asset
        const updatedAsset = { ...editingAsset, ...formData };
        await myAssetsService.update(editingAsset.id, updatedAsset);
        setAssets(prev => prev.map(asset => 
          asset.id === editingAsset.id ? updatedAsset : asset
        ));
        alert('Asset updated successfully');
        setShowAddModal(false);
      } else {
        // Create new asset
        const formDataToSend = new FormData();
        formDataToSend.append('asset_code', formData.asset_code);
        formDataToSend.append('asset_name', formData.asset_name);
        formDataToSend.append('asset_type', formData.asset_type);
        formDataToSend.append('purchase_date', formData.purchase_date);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('supplier_id', formData.supplier_id.toString());
        formDataToSend.append('price', formData.price.toString());
        formDataToSend.append('quantity', formData.quantity.toString());
        
        if (formData.document) {
          console.log('📁 Adding document to FormData:', formData.document.name, formData.document.size);
          formDataToSend.append('document', formData.document);
        } else {
          console.log('📝 No document to upload');
        }

        console.log('📤 Sending FormData to server...');
        const response = await myAssetsService.create(formDataToSend);
        if (response.success && response.data) {
          setAssets(prev => [...prev, response.data]);
          alert('Asset created successfully');
        }
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Error saving asset:', err);
      alert('Failed to save asset');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        document: file
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/inventory-staff-dashboard"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Assets Management</h1>
            </div>
            <button
              onClick={handleAddAsset}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search assets by name, code, type, location, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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
        )}

        {/* Assets Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new asset.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{asset.asset_name}</div>
                          <div className="text-sm text-gray-500">#{asset.asset_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {asset.asset_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(asset.purchase_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.supplier_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(asset.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {asset.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(asset.price * asset.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {asset.document_url ? (
                          <a
                            href={asset.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900"
                            title="View Document"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditAsset(asset)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit asset"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete asset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredAssets.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset Code *</label>
                  <input
                    type="text"
                    name="asset_code"
                    value={formData.asset_code}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset Type *</label>
                  <select
                    name="asset_type"
                    value={formData.asset_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select asset type</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Laptops and Computers">Laptops and Computers</option>
                    <option value="Motor Vehicles">Motor Vehicles</option>
                    <option value="Plants and Machinery">Plants and Machinery</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset Name *</label>
                  <input
                    type="text"
                    name="asset_name"
                    value={formData.asset_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Date *</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier *</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={0}>Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Upload Document/Photo</label>
                  <input
                    type="file"
                    name="document"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Accepted formats: Images (JPG, PNG, GIF), PDF, Word documents
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingAsset ? 'Update' : 'Create'} Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssetsPage; 
