import api from './api';

export const tokenService = {
  // Token generation removed - only doctors and admin can generate tokens
  // generateToken: async (patientData) => {
  //   const response = await api.post('/tokens/generate', patientData);
  //   return response.data;
  // },

  // Get all tokens
  getAllTokens: async () => {
    const response = await api.get('/tokens');
    return response.data;
  },

  // Get tokens by department
  getTokensByDepartment: async (departmentId) => {
    const response = await api.get(`/tokens/department/${departmentId}`);
    return response.data;
  },

  // Update token status
  updateTokenStatus: async (tokenId, status) => {
    const response = await api.put(`/tokens/${tokenId}/status`, { status });
    return response.data;
  },

  // Call next token
  callNextToken: async (departmentId) => {
    const response = await api.post(`/tokens/next/${departmentId}`);
    return response.data;
  },

  // Get current token for department
  getCurrentToken: async (departmentId) => {
    const response = await api.get(`/tokens/current/${departmentId}`);
    return response.data;
  },

  // Complete token
  completeToken: async (tokenId) => {
    const response = await api.put(`/tokens/${tokenId}/complete`);
    return response.data;
  },

  // Update token status
  updateStatus: async (tokenId, status) => {
    const response = await api.put(`/tokens/${tokenId}/status`, { status });
    return response.data;
  },

  // Call next patient
  callNext: async (departmentId) => {
    const response = await api.post(`/tokens/call-next/${departmentId}`);
    return response.data;
  },

  // Get token statistics
  getTokenStats: async (departmentId) => {
    const response = await api.get(`/tokens/stats/${departmentId}`);
    return response.data;
  },

  // Get department queue
  getDepartmentQueue: async (departmentId, doctorId = null) => {
    const url = doctorId 
      ? `/tokens/queue/${departmentId}?doctor_id=${doctorId}`
      : `/tokens/queue/${departmentId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get token time information and current status
  getTokenTimeInfo: async () => {
    const response = await api.get('/tokens/time-info');
    return response.data;
  },

  // Update token time settings (admin only)
  updateTokenTimeSettings: async (settings) => {
    const response = await api.put('/tokens/time-settings', settings);
    return response.data;
  }
};

export default tokenService;
