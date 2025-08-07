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

// Validate and get API base URL
const getApiBaseUrl = (): string => {
  // Hardcoded production URL for testing
  const PRODUCTION_API_URL = 'https://64.226.66.235:5000/api';
  
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // In development, use environment variable or fallback to localhost
    const url = import.meta.env.VITE_API_URL;
    console.log('Environment variables:', import.meta.env);
    console.log('VITE_API_URL:', url);
    if (!url) {
      console.warn('VITE_API_URL is not defined, falling back to production server');
      return PRODUCTION_API_URL;
    }
    return url.endsWith('/api') ? url : `${url}/api`;
  } else {
    // In production, use the hardcoded production URL
    console.log('Using production API URL:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }
};

const API_BASE_URL = getApiBaseUrl();
console.log('Using API base URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: true
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

// Add response interceptor for debugging
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
      return Promise.reject(new Error(error.response.data.message || 'An error occurred'));
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

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making request to:', config.url, 'with config:', config);
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse<any> => {
    console.log('Received response:', response.status, response.data);
    return response as unknown as Response<any>;
  },
  async (error: unknown): Promise<never> => {
    console.error('Response error:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 408;
        timeoutError.code = 'timeout';
        (timeoutError as any).details = error.config;
        throw timeoutError;
      }

      if (!error.response) {
        const networkError = new Error(error.message || 'Network error') as ApiError;
        networkError.status = 0;
        networkError.code = 'network';
        throw networkError;
      }

      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
        case 404:
        case 500:
          break;
      }

      const errorData = new Error(
        typeof data === 'object' && data !== null && 'message' in data 
          ? (data as { message: string }).message 
          : 'An error occurred'
      ) as ApiError;
      
      errorData.status = status;
      errorData.code = `http-${status}`;
      (errorData as any).response = error.response;
      
      if (typeof data === 'object' && data !== null) {
        (errorData as any).details = data;
      }
      
      throw errorData;
    }

    const unknownError = new Error(
      error instanceof Error ? error.message : 'An unknown error occurred'
    ) as ApiError;
    unknownError.status = 500;
    unknownError.code = 'unknown';
    
    if (error instanceof Error) {
      unknownError.stack = error.stack;
    }
    
    throw unknownError;
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