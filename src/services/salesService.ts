import axios from 'axios';

export interface SalesRep {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  country?: string;
  region?: string;
  route_name_update?: string;
  photoUrl?: string;
  created_at?: string;
  updated_at?: string;
  status?: number; // 1 for active, 0 for inactive
}

export interface CreateSalesRepData {
  name: string;
  email: string;
  phoneNumber: string;
  country?: string;
  region?: string;
  route_name_update?: string;
  photoUrl?: string;
}

export interface UpdateSalesRepData extends CreateSalesRepData {
  id: number;
}

export interface Country { id: number; name: string; }
export interface Region { id: number; name: string; country_id?: number; }
export interface Route { 
  id: number; 
  name: string; 
  region: number;
  region_name: string;
  country_id: number;
  country_name: string;
  sales_rep_id: number;
  sales_rep_name: string;
  status: number;
}

export interface MasterSalesData {
  client_id: number;
  client_name: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
}

const API_BASE_URL = '/api/sales';

export const salesService = {
  // Get all sales reps
  getAllSalesReps: async (): Promise<SalesRep[]> => {
    const response = await axios.get(`${API_BASE_URL}/sales-reps?status=1`);
    return response.data;
  },

  // Create a new sales rep
  createSalesRep: async (data: CreateSalesRepData): Promise<SalesRep> => {
    const response = await axios.post(`${API_BASE_URL}/sales-reps`, data);
    return response.data;
  },

  // Update a sales rep
  updateSalesRep: async (data: UpdateSalesRepData): Promise<SalesRep> => {
    // Map frontend fields to backend expected fields
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phoneNumber, // backend expects 'phone'
      country: data.country,
      region: data.region,
      route_name_update: data.route_name_update, // backend expects 'route_name_update'
      photoUrl: data.photoUrl // backend expects 'photoUrl'
    };
    const response = await axios.put(`${API_BASE_URL}/sales-reps/${data.id}`, payload);
    return response.data;
  },

  // Delete a sales rep
  deleteSalesRep: async (id: number): Promise<{ success: boolean }> => {
    const response = await axios.delete(`${API_BASE_URL}/sales-reps/${id}`);
    return response.data;
  },

  // Update status of a sales rep
  updateSalesRepStatus: async (id: number, status: number): Promise<SalesRep> => {
    const response = await axios.patch(`${API_BASE_URL}/sales-reps/${id}/status`, { status });
    return response.data;
  },

  // Fetch countries
  getCountries: async (): Promise<Country[]> => {
    const response = await axios.get(`${API_BASE_URL}/countries`);
    return response.data;
  },

  // Fetch regions (optionally by country_id)
  getRegions: async (country_id?: number): Promise<Region[]> => {
    const response = await axios.get(`${API_BASE_URL}/regions`, country_id ? { params: { country_id } } : undefined);
    return response.data;
  },

  // Fetch routes (optionally by country_id)
  getRoutes: async (country_id?: number): Promise<Route[]> => {
    const response = await axios.get(`${API_BASE_URL}/routes`, country_id ? { params: { country_id } } : undefined);
    return response.data;
  },

  // Get master sales data for all clients by year
  getMasterSalesData: async (year: number, category?: number[], salesRep?: number[], categoryGroup?: string, startDate?: string, endDate?: string, clientStatus?: string): Promise<MasterSalesData[]> => {
    const response = await axios.get(`${API_BASE_URL}/master-sales`, {
      params: { year, category, salesRep, categoryGroup, startDate, endDate, clientStatus }
    });
    return response.data;
  },

  // Get available categories for master sales filter
  getMasterSalesCategories: async (): Promise<{ id: number; name: string }[]> => {
    const response = await axios.get(`${API_BASE_URL}/master-sales/categories`);
    return response.data;
  },

  // Get available sales reps for master sales filter
  getMasterSalesSalesReps: async (): Promise<{ id: number; name: string }[]> => {
    const response = await axios.get(`${API_BASE_URL}/master-sales/sales-reps`);
    return response.data;
  }
}; 