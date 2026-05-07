import api from './api';

export const pharmacyService = {
  // Get all drugs
  getAllDrugs: async () => {
    const response = await api.get('/drugs');
    return response.data;
  },

  // Get drug by ID
  getDrugById: async (drugId) => {
    const response = await api.get(`/drugs/${drugId}`);
    return response.data;
  },

  // Add new drug
  addDrug: async (drugData) => {
    const response = await api.post('/drugs', drugData);
    return response.data;
  },

  // Update drug
  updateDrug: async (drugId, drugData) => {
    const response = await api.put(`/drugs/${drugId}`, drugData);
    return response.data;
  },

  // Delete drug
  deleteDrug: async (drugId) => {
    const response = await api.delete(`/drugs/${drugId}`);
    return response.data;
  },

  // Update drug stock
  updateStock: async (drugId, quantity, operation) => {
    const response = await api.put(`/drugs/${drugId}/stock`, { quantity, operation });
    return response.data;
  },

  // Get low stock drugs
  getLowStockDrugs: async () => {
    const response = await api.get('/drugs/inventory/low-stock');
    return response.data;
  },

  // Get drug usage statistics
  getDrugStats: async () => {
    const response = await api.get('/drugs/stats');
    return response.data;
  },

  // Search drugs
  searchDrugs: async (query) => {
    const response = await api.get(`/drugs/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get drugs by category
  getDrugsByCategory: async (category) => {
    const response = await api.get(`/drugs/category/${category}`);
    return response.data;
  }
};

export default pharmacyService;
