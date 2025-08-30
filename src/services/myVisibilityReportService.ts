import axios from 'axios';

export interface MyVisibilityReport {
  id: number;
  reportId: number;
  outlet?: string;
  outletName?: string;
  companyName?: string;
  country?: string;
  salesRep?: string;
  comment: string;
  imageUrl: string;
  createdAt: string;
  clientId: number;
  userId: number;
}

export interface MyVisibilityReportResponse {
  data: MyVisibilityReport[];
}

const API_BASE_URL = '/api';

export const myVisibilityReportService = {
  getAll: async (): Promise<MyVisibilityReportResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/my-visibility-reports`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my visibility reports:', error);
      throw error;
    }
  },
}; 