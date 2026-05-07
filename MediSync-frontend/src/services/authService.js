import { api, setStoredTokens, clearStoredTokens } from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // Store tokens if provided in response
    if (response.data.tokens) {
      setStoredTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }
    
    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    // Store tokens if provided in response (for auto-approved users like patients)
    if (response.data.tokens) {
      setStoredTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }
    
    return response.data;
  },

  // Emergency access
  emergencyAccess: async (emergencyData) => {
    const response = await api.post('/emergency-auth/verify', emergencyData);
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } finally {
      // Always clear tokens, even if logout request fails
      clearStoredTokens();
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Approve staff
  approveStaff: async (userId) => {
    const response = await api.put(`/auth/approve/${userId}`);
    return response.data;
  },

  // Get pending staff
  getPendingStaff: async () => {
    const response = await api.get('/auth/pending-staff');
    return response.data;
  }
};

export default authService;
