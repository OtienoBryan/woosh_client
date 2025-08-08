// Centralized API Configuration
export const API_CONFIG = {
  // Get API URL from environment variable with proper validation
  getBaseUrl: (): string => {
    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      throw new Error('VITE_API_URL environment variable is required but not defined');
    }
    return url.endsWith('/api') ? url : `${url}/api`;
  },
  
  // Get socket URL (API URL without /api)
  getSocketUrl: (): string => {
    const baseUrl = API_CONFIG.getBaseUrl();
    return baseUrl.replace('/api', '');
  },
  
  // Get full URL for a specific endpoint
  getUrl: (endpoint: string): string => {
    const baseUrl = API_CONFIG.getBaseUrl();
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
};

// Export commonly used URLs
export const API_BASE_URL = API_CONFIG.getBaseUrl();
export const SOCKET_URL = API_CONFIG.getSocketUrl();

// Log configuration for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    socketUrl: SOCKET_URL,
    envUrl: import.meta.env.VITE_API_URL
  });
}
