import api from './api';

export const departmentService = {
  // Get all departments
  getAllDepartments: async (includeStaff = true) => {
    const params = includeStaff ? '?include_staff=true' : '';
    const response = await api.get(`/departments${params}`);
    return response.data;
  },

  // Get department by ID
  getDepartmentById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // Create department (Admin only)
  createDepartment: async (departmentData) => {
    const response = await api.post('/departments', departmentData);
    return response.data;
  },

  // Update department (Admin only)
  updateDepartment: async (id, departmentData) => {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data;
  },

  // Delete department (Admin only)
  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  // Toggle department status (Admin only)
  toggleDepartmentStatus: async (id) => {
    const response = await api.put(`/departments/${id}/toggle-status`);
    return response.data;
  },

  // Staff management
  getPendingStaff: async () => {
    const response = await api.get('/departments/staff/pending');
    return response.data;
  },

  // Get all staff members (Admin only)
  getAllStaff: async () => {
    const response = await api.get('/departments/staff/all');
    return response.data;
  },

  // Approve staff member (Admin only)
  approveStaff: async (userId) => {
    const response = await api.post(`/departments/staff/${userId}/approve`);
    return response.data;
  },

  // Reject staff member (Admin only)
  rejectStaff: async (userId, reason = '') => {
    const response = await api.post(`/departments/staff/${userId}/reject`, { reason });
    return response.data;
  },

  // Delete staff member (Admin only)
  deleteStaff: async (userId) => {
    const response = await api.delete(`/departments/staff/${userId}`);
    return response.data;
  },

  // Get department doctors
  getDepartmentDoctors: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}/doctors`);
    return response.data;
  },

  // Get approved staff by role
  getApprovedStaffByRole: async (role) => {
    const response = await api.get(`/departments/staff/${role}`);
    return response.data;
  },

  // Get unassigned doctors (doctors without department)
  getUnassignedDoctors: async () => {
    const response = await api.get('/departments/staff/unassigned/doctors');
    return response.data;
  },

  // Department staff assignment
  addDoctorToDepartment: async (departmentId, doctorId) => {
    const response = await api.post(`/departments/${departmentId}/doctors/${doctorId}`);
    return response.data;
  },

  removeDoctorFromDepartment: async (departmentId, doctorId) => {
    const response = await api.delete(`/departments/${departmentId}/doctors/${doctorId}`);
    return response.data;
  },

  addNurseToDepartment: async (departmentId, nurseId) => {
    const response = await api.post(`/departments/${departmentId}/nurses/${nurseId}`);
    return response.data;
  },

  removeNurseFromDepartment: async (departmentId, nurseId) => {
    const response = await api.delete(`/departments/${departmentId}/nurses/${nurseId}`);
    return response.data;
  }
};

export default departmentService;
