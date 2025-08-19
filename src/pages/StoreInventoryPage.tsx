import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { StoreInventory, StoreInventorySummary, Product } from '../types/financial';
import { inventoryAsOfService, categoriesService, productsService } from '../services/financialService';

const StoreInventoryPage: React.FC = () => {
  const [inventorySummary, setInventorySummary] = useState<StoreInventorySummary[]>([]);
  const [allInventory, setAllInventory] = useState<StoreInventory[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [stores, setStores] = useState<{ id: number; store_name: string; store_code: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [asOfInventory, setAsOfInventory] = useState<any[] | null>(null);
  const [stockSummaryData, setStockSummaryData] = useState<any>(null);
  const [stockSummaryCategoryFilter, setStockSummaryCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (allInventory.length > 0 && stores.length > 0) {
      console.log('stores:', stores);
      console.log('allInventory:', allInventory);
      allInventory.forEach(item => {
        const found = stores.find(s => Number(s.id) === Number(item.store_id));
        if (!found) {
          console.log('No match for store_id:', item.store_id);
        }
      });
    }
  }, [stores, allInventory]);

  useEffect(() => {
    if (selectedDate) {
      fetchInventoryAsOf(selectedDate, selectedStore);
    } else {
      setAsOfInventory(null);
    }
  }, [selectedDate, selectedStore]);

  const fetchInventoryAsOf = async (date: string, store: number | 'all') => {
    try {
      const params: any = { date };
      if (store !== 'all') params.store_id = store;
      const response = await inventoryAsOfService.getAll(params);
      if (response.success && response.data) {
        setAsOfInventory(response.data);
      } else {
        setAsOfInventory([]);
      }
    } catch {
      setAsOfInventory([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory summary
      const summaryResponse = await storeService.getInventorySummaryByStore();
      if (summaryResponse.success) {
        setInventorySummary(summaryResponse.data || []);
      }

      // Fetch all stores
      const storesResponse = await storeService.getAllStores();
      if (storesResponse.success) {
        setStores(storesResponse.data || []);
      }

      // Fetch all inventory
      const inventoryResponse = await storeService.getAllStoresInventory();
      if (inventoryResponse.success) {
        setAllInventory(inventoryResponse.data || []);
      }

      // Fetch all categories
      const categoriesResponse = await categoriesService.getAll();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }

      // Fetch all products
      const productsResponse = await productsService.getAll();
      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      }

      // Fetch stock summary data
      const stockSummaryResponse = await storeService.getStockSummary();
      if (stockSummaryResponse.success) {
        setStockSummaryData(stockSummaryResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInventory = () => {
    let filtered = asOfInventory || allInventory;
    
    // Filter by store
    if (selectedStore !== 'all') {
      filtered = filtered.filter(item => Number(item.store_id) === Number(selectedStore));
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    return filtered;
  };

  const getFilteredStockSummary = () => {
    if (!stockSummaryData || !stockSummaryData.products) {
      return [];
    }
    
    if (stockSummaryCategoryFilter === 'all') {
      return stockSummaryData.products;
    }
    
    return stockSummaryData.products.filter((product: any) => 
      product.category === stockSummaryCategoryFilter
    );
  };

  const getStoreName = (storeId: number) => {
    const store = stores.find(s => Number(s.id) === Number(storeId));
    return store ? store.store_name : 'Unknown Store';
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getLowStockItems = () => {
    return getFilteredInventory().filter(item => item.quantity <= 10);
  };

  const getTotalInventoryValue = () => {
    return getFilteredInventory().reduce((total, item) => {
      return total + (Number(item.inventory_value) || 0);
    }, 0);
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
        <div className="max-w-7xl mx-auto">
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

  const filteredInventory = getFilteredInventory();
  const lowStockItems = getLowStockItems();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
         
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Store Inventory</h1>
              <p className="mt-2 text-sm text-gray-600">
                Track inventory levels across all stores
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                to="/update-stock-quantity"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Update Stock Quantity
              </Link>
              <Link
                to="/stock-take"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Stock Take
              </Link>
               
              <Link
                to="/inventory-transactions"
                className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-2"
              >
                Inventory Transactions
              </Link>
              <Link
                to="/inventory-as-of"
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-2"
              >
                Inventory As Of Date
              </Link>
              <Link
                to="/stock-transfer-history"
                className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ml-2"
              >
                Stock Transfer
              </Link>
            </div>
          </div>
        </div>

        {/* Store Summary (moved to top) */}
        {selectedStore === 'all' && inventorySummary.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Store Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventorySummary.map((store) => (
                <div key={store.id} className="bg-white shadow rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900">{store.store_name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{store.store_code}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Products:</span>
                      <span className="font-medium">{store.total_products}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Items:</span>
                      <span className="font-medium">{store.total_items || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Value:</span>
                      <span className="font-medium">{number_format(store.total_inventory_value || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 

        {/* Stock Summary Table */}
        {selectedStore === 'all' && stockSummaryData && stockSummaryData.products.length > 0 && (
          <div className="mb-8 hidden">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Stock Summary Across All Stores</h2>
            
            {/* Stock Summary Category Filter */}
            <div className="mb-4">
              <label htmlFor="stock-summary-category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                id="stock-summary-category-filter"
                value={stockSummaryCategoryFilter}
                onChange={(e) => setStockSummaryCategoryFilter(e.target.value)}
                className="block w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Summary Filter Indicators */}
            {stockSummaryCategoryFilter !== 'all' && (
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                  Category: {stockSummaryCategoryFilter}
                </span>
              </div>
            )}

            {getFilteredStockSummary().length === 0 ? (
              <div className="text-center py-12 bg-white shadow rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {stockSummaryCategoryFilter === 'all' 
                    ? 'No products found in the stock summary.' 
                    : `No products found for category "${stockSummaryCategoryFilter}".`}
                </p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Stock
                        </th>
                        {stockSummaryData.stores.map((store: any) => (
                          <th key={store.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {store.store_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredStockSummary().map((product: any) => {
                        const totalStock = stockSummaryData.stores.reduce((total: number, store: any) => {
                          return total + (product.store_quantities[store.id] || 0);
                        }, 0);
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                              {product.product_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.product_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.category || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              {totalStock}
                            </td>
                            {stockSummaryData.stores.map((store: any) => {
                              const quantity = product.store_quantities[store.id] || 0;
                              return (
                                <td key={store.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    quantity <= 10 
                                      ? 'bg-red-100 text-red-800' 
                                      : quantity <= 50 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {quantity}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Store Filter, Category Filter and Date Filter */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label htmlFor="store-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Store
            </label>
            <select
              id="store-filter"
              value={selectedStore}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedStore(value === 'all' ? 'all' : Number(value));
              }}
              className="block w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name} ({store.store_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategory(value);
              }}
              className="block w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div hidden>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Inventory as of Date
            </label>
            <input
              id="date-filter"
              type="date"
              className="block w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedStore !== 'all' && (
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
              Store: {getStoreName(selectedStore as number)}
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
              Category: {selectedCategory}
            </span>
          )}
        </div>
        {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedStore === 'all' 
                  ? 'No inventory items found across all stores.' 
                  : 'No inventory items found for the selected store.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedStore === 'all' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Price
                    </th>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inventory Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={`${item.store_id}-${item.product_id}`} className="hover:bg-gray-50">
                      {selectedStore === 'all' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getStoreName(item.store_id)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product_code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.quantity <= 10 
                            ? 'bg-red-100 text-red-800' 
                            : item.quantity <= 50 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.cost_price ? number_format(item.cost_price) : 'N/A'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.inventory_value ? number_format(item.inventory_value) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Store Summary */}
        {/* (Removed from bottom, now at top) */}
      </div>
    </div>
  );
};

export default StoreInventoryPage; 