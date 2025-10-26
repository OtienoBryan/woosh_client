import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';

// Enhanced type definitions
export type RequestConfig<T = any> = AxiosRequestConfig<T>;
export type Response<T = any, D = any> = AxiosResponse<T, D>;
export type ApiResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
};

export interface ApiError extends Error {
  status: number;
  message: string;
  details?: any;
  code?: string;
  response?: any;
  config?: any;
  isAxiosError?: boolean;
  toJSON?: () => object;
  
  // Allow any other properties since we're extending Error
  [key: string]: any;
}

import { API_BASE_URL } from '../config/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // Increased timeout to 30 seconds for serverless functions
  withCredentials: false // Disable credentials for cross-origin requests
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      // Handle authentication errors (401 Unauthorized)
      if (error.response.status === 401) {
        console.warn('Authentication failed - token expired or invalid');
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(new Error('Authentication required. Please log in.'));
      }
      
      // Handle forbidden errors (403 Forbidden)
      if (error.response.status === 403) {
        console.warn('Access forbidden - insufficient permissions');
      }
      
      // Don't transform the error, just pass it through to preserve Axios structure
      return Promise.reject(error);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server. Please check if the server is running.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      return Promise.reject(new Error('Failed to set up request'));
    }
  }
);

// Request interceptor for authentication
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Enhanced utility functions with better typing
export const get = async <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.get<T>(url, config);
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
};

export const post = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.post<T>(url, data, config);
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
};

export const put = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.put<T>(url, data, config);
  return response;
};

export const patch = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.patch<T>(url, data, config);
  return response;
};

export const del = async <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.delete<T>(url, config);
  return response;
};

export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
};

export default api; 