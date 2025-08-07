import axios from 'axios';

export interface JourneyPlan {
  id: number;
  userId: number;
  staffName: string;
  staffPhone: string;
  clientId: number;
  clientName: string;
  serviceTypeId: number;
  serviceTypeName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
//const API_URL = 'http://64.226.66.235'; // Add your backend URL here

const journeyPlanService = {
  getJourneyPlans: async (): Promise<JourneyPlan[]> => {
    try {
      console.log('Making API call to fetch journey plans...');
      const response = await axios.get(`${API_URL}/api/journey-plans`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in journeyPlanService.getJourneyPlans:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          }
        });
      }
      throw error;
    }
  },

  getJourneyPlan: async (id: number): Promise<JourneyPlan> => {
    try {
      const response = await axios.get(`${API_URL}/api/journey-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey plan:', error);
      throw error;
    }
  },

  createJourneyPlan: async (data: Partial<JourneyPlan>): Promise<JourneyPlan> => {
    try {
      const response = await axios.post(`${API_URL}/api/journey-plans`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating journey plan:', error);
      throw error;
    }
  },

  updateJourneyPlan: async (id: number, data: Partial<JourneyPlan>): Promise<JourneyPlan> => {
    try {
      const response = await axios.patch(`${API_URL}/api/journey-plans/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating journey plan:', error);
      throw error;
    }
  },

  deleteJourneyPlan: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/api/journey-plans/${id}`);
    } catch (error) {
      console.error('Error deleting journey plan:', error);
      throw error;
    }
  }
};

export default journeyPlanService; 