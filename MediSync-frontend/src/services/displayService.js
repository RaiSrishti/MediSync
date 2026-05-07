import api from './api';

export const displayService = {
  // Get all displays
  getAllDisplays: async () => {
    const response = await api.get('/displays');
    return response.data;
  },

  // Get display by department
  getDisplayByDepartment: async (departmentId) => {
    const response = await api.get(`/displays/department/${departmentId}`);
    return response.data;
  },

  // Update display content
  updateDisplayContent: async (displayId, content) => {
    const response = await api.put(`/displays/${displayId}/content`, { content });
    return response.data;
  },

  // Send announcement
  sendAnnouncement: async (displayId, announcement) => {
    const response = await api.post(`/displays/${displayId}/announcement`, announcement);
    return response.data;
  },

  // Get live display data
  getLiveDisplayData: async (departmentId) => {
    const response = await api.get(`/displays/live/${departmentId}`);
    return response.data;
  },

  // Update display status
  updateDisplayStatus: async (displayId, status) => {
    const response = await api.put(`/displays/${displayId}/status`, { status });
    return response.data;
  }
};

export const departmentService = {
  // Get all departments
  getAllDepartments: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  // Get department by ID
  getDepartmentById: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}`);
    return response.data;
  },

  // Get department staff
  getDepartmentStaff: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}/staff`);
    return response.data;
  }
};

export default displayService;
