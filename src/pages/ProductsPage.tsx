import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Package, DollarSign, Image as ImageIcon, Filter, Search, Grid, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: number;
  product_name: string;
  product_code: string;
  category: string;
  category_id?: number;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  image_url?: string;
}

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Edit modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // New category state
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Image upload modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image preview modal state
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewName, setImagePreviewName] = useState<string | null>(null);

  // Add product modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    product_name: '',
    product_code: '',
    category_id: '',
    cost_price: '',
    image: null as File | null,
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalProducts = products.length;
    const productsWithImages = products.filter(p => p.image_url).length;
    
    return {
      totalProducts,
      productsWithImages
    };
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, categoryFilter, searchQuery]);

  // Pagination calculations
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery]);

  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Fetch categories on mount
  useEffect(() => {
    axios.get('/api/financial/categories').then(res => {
      if (res.data.success) setCategories(res.data.data);
    });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/financial/products');
        if (res.data.success) {
          setProducts(res.data.data || []);
        } else {
          setError(res.data.error || 'Failed to fetch products');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditForm({ ...product });
    setEditError(null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditProduct(null);
    setEditForm({});
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: name === 'cost_price' || name === 'selling_price' ? Number(value) : value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      // Only include cost_price if user is admin
      const updateData = { ...editForm };
      if (!isAdmin) {
        delete updateData.cost_price;
      }
      
      const res = await axios.put(`/api/financial/products/${editProduct.id}`, updateData);
      if (res.data.success) {
        setProducts(products => products.map(p => p.id === editProduct.id ? { ...p, ...updateData } as Product : p));
        closeEditModal();
      } else {
        setEditError(res.data.error || 'Failed to update product');
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update product');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Add category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const res = await axios.post('/api/financial/categories', { name: newCategory });
    if (res.data.success) {
      setCategories([...categories, res.data.data]);
      setNewCategory('');
    }
  };

  // Edit category
  const handleEditCategory = async (id: number) => {
    if (!editingCategoryName.trim()) return;
    await axios.put(`/api/financial/categories/${id}`, { name: editingCategoryName });
    setCategories(categories.map(c => c.id === id ? { ...c, name: editingCategoryName } : c));
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // Delete category
  const handleDeleteCategory = async (id: number) => {
    await axios.delete(`/api/financial/categories/${id}`);
    setCategories(categories.filter(c => c.id !== id));
  };

  const openImageModal = (product: Product) => {
    setSelectedProduct(product);
    setImageModalOpen(true);
    setUploadError(null);
  };
  
  const closeImageModal = () => {
    setSelectedProduct(null);
    setImageModalOpen(false);
    setUploadError(null);
  };
  
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('image', fileInputRef.current.files[0]);
    try {
      const res = await axios.post(`/api/financial/products/${selectedProduct.id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setProducts(products => products.map(p => p.id === selectedProduct.id ? { ...p, image_url: res.data.url } : p));
        closeImageModal();
      } else {
        setUploadError(res.data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image');
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
              <p className="text-gray-600 mt-2">Manage your product catalog, inventory, and pricing</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/categories" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Package className="w-4 h-4 mr-2" />
                Manage Categories
              </Link>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => { setAddModalOpen(true); setAddError(null); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
            </div>
          </div>
 
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter ? 'Try adjusting your search or filters.' : 'Get started by adding your first product.'}
            </p>
            {!searchQuery && !categoryFilter && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Products Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {startItem} to {endItem} of {filteredProducts.length} products
                {filteredProducts.length !== products.length && ` (filtered from ${products.length} total)`}
              </p>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <>
                {paginatedProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {filteredProducts.length === 0 && products.length > 0 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by adding your first product.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.product_name}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => { setImagePreviewUrl(product.image_url!); setImagePreviewName(product.product_name); }}
                            />
                          ) : (
                            <div className="text-gray-400 text-center p-4">
                              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-xs">No image</p>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 text-sm mb-1 truncate" title={product.product_name}>
                            {product.product_name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2">{product.product_code}</p>
                          <p className="text-xs text-gray-600 mb-3">{product.category}</p>
                          
                          {isAdmin && (
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-blue-600">
                                {Number(product.cost_price).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => openImageModal(product)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Image
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                                 )}
               </>
             )}

            {/* List View */}
            {viewMode === 'list' && (
              <>
                {paginatedProducts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                      {filteredProducts.length === 0 && products.length > 0 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by adding your first product.'
                      }
                    </p>
                    {!searchQuery && !categoryFilter && (
                      <button
                        onClick={() => setAddModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                            {isAdmin && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                            )}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.product_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.product_name}
                                className="w-10 h-10 object-cover rounded cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => { setImagePreviewUrl(product.image_url!); setImagePreviewName(product.product_name); }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">No image</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-600">
                              {Number(product.cost_price).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(product)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => openImageModal(product)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Upload Image
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
                )}
              </>
            )}
          </>
        )}

        {/* Pagination Controls */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {editModalOpen && editProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={closeEditModal}
                disabled={editSubmitting}
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Edit Product</h2>
              {editError && <div className="text-red-600 mb-2">{editError}</div>}
              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <input
                    type="text"
                    name="product_name"
                    value={editForm.product_name || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Product Code</label>
                  <input
                    type="text"
                    name="product_code"
                    value={editForm.product_code || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category_id"
                    value={editForm.category_id || ''}
                    onChange={e => {
                      const selectedId = Number(e.target.value);
                      const selectedCat = categories.find(c => c.id === selectedId);
                      setEditForm(f => ({
                        ...f,
                        category_id: selectedId,
                        category: selectedCat ? selectedCat.name : ''
                      }));
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Cost Price</label>
                    <input
                      type="number"
                      name="cost_price"
                      value={editForm.cost_price ?? ''}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}
                <div className="mb-4" hidden>
                  <label className="block text-sm font-medium mb-1">Selling Price</label>
                  <input
                    type="number"
                    name="selling_price"
                    value={editForm.selling_price ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-4" hidden>
                  <label className="block text-sm font-medium mb-1">Current Stock</label>
                  <input
                    type="number"
                    name="current_stock"
                    value={editForm.current_stock ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {imageModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={closeImageModal}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-auto relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={closeImageModal} aria-label="Close">&times;</button>
              <h2 className="text-lg font-bold mb-4">Upload Image for {selectedProduct.product_name}</h2>
              <form onSubmit={handleImageUpload}>
                <input type="file" accept="image/*" ref={fileInputRef} className="mb-4" required />
                {uploadError && <div className="text-red-600 mb-2">{uploadError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={closeImageModal}>Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {imagePreviewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setImagePreviewUrl(null)}>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-0 right-0 m-2 text-white text-2xl" onClick={() => setImagePreviewUrl(null)} aria-label="Close">&times;</button>
              <img src={imagePreviewUrl} alt={imagePreviewName || ''} className="max-w-full max-h-[80vh] rounded shadow-lg" />
              {imagePreviewName && <div className="text-white text-center mt-2 text-lg font-semibold">{imagePreviewName}</div>}
            </div>
          </div>
        )}

        {addModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setAddModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setAddModalOpen(false)} aria-label="Close">&times;</button>
              <h2 className="text-lg font-bold mb-4">Add Product</h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setAddSubmitting(true);
                  setAddError(null);
                  try {
                    const formData = new FormData();
                    formData.append('product_name', addForm.product_name);
                    formData.append('product_code', addForm.product_code);
                    formData.append('category_id', addForm.category_id);
                    if (isAdmin) {
                      formData.append('cost_price', addForm.cost_price);
                    }
                    if (addForm.image) formData.append('image', addForm.image);
                    const res = await axios.post('/api/financial/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    if (res.data.success) {
                      setProducts(products => [res.data.data, ...products]);
                      setAddModalOpen(false);
                      setAddForm({ product_name: '', product_code: '', category_id: '', cost_price: '', image: null });
                    } else {
                      setAddError(res.data.error || 'Failed to add product');
                    }
                  } catch (err: any) {
                    setAddError(err.message || 'Failed to add product');
                  }
                  setAddSubmitting(false);
                }}
              >
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={addForm.product_name}
                    onChange={e => setAddForm(f => ({ ...f, product_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Product Code</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={addForm.product_code}
                    onChange={e => setAddForm(f => ({ ...f, product_code: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={addForm.category_id}
                    onChange={e => setAddForm(f => ({ ...f, category_id: e.target.value }))}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Cost Price</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      type="number"
                      value={addForm.cost_price}
                      onChange={e => setAddForm(f => ({ ...f, cost_price: e.target.value }))}
                      required
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Image (optional)</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    type="file"
                    accept="image/*"
                    onChange={e => setAddForm(f => ({ ...f, image: e.target.files?.[0] || null }))}
                  />
                </div>
                {addError && <div className="text-red-600 mb-2">{addError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" disabled={addSubmitting}>{addSubmitting ? 'Adding...' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage; 