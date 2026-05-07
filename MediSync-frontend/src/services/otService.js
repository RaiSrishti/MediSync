import api from './api';

export const otService = {
  // Get OTs assigned to the logged-in doctor
  getAssignedOTs: async () => {
    const response = await api.get('/ot/assigned');
    return response.data;
  },
  // Basic OT Management (Admin)
  getAllOTs: async () => {
    const response = await api.get('/ot/all');
    return response.data;
  },

  createOT: async (otData) => {
    const response = await api.post('/ot', otData);
    return response.data;
  },

  updateOT: async (otId, otData) => {
    const response = await api.put(`/ot/${otId}`, otData);
    return response.data;
  },

  // Complete OT (for doctors)
  completeOT: async (otId) => {
    const response = await api.put(`/ot/${otId}/complete`);
    return response.data;
  },

  deleteOT: async (otId) => {
    const response = await api.delete(`/ot/${otId}`);
    return response.data;
  },

  // Get OT by ID
  getOTById: async (otId) => {
    const response = await api.get(`/ot/${otId}`);
    return response.data;
  },

  // Update OT status
  updateOTStatus: async (otId, status, additionalData = {}) => {
    const response = await api.put(`/ot/${otId}/status`, { status, ...additionalData });
    return response.data;
  },

  // Get OT schedules
  getOTSchedules: async () => {
    const response = await api.get('/ot/schedules');
    return response.data;
  },

  // Get upcoming schedules
  getUpcomingSchedules: async (limit = 10) => {
    const response = await api.get(`/ot/schedules/upcoming?limit=${limit}`);
    return response.data;
  },

  // Create OT schedule
  createOTSchedule: async (scheduleData) => {
    const response = await api.post('/ot/schedules', scheduleData);
    return response.data;
  },

  // Update OT schedule
  updateOTSchedule: async (scheduleId, scheduleData) => {
    const response = await api.put(`/ot/schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  // Delete OT schedule
  deleteOTSchedule: async (scheduleId) => {
    const response = await api.delete(`/ot/schedules/${scheduleId}`);
    return response.data;
  },

  // Trigger emergency protocol
  triggerEmergency: async (otId, emergencyData) => {
    const response = await api.post(`/ot/${otId}/emergency`, emergencyData);
    return response.data;
  },

  // Get doctor availability
  getDoctorAvailability: async () => {
    const response = await api.get('/ot/doctors/availability');
    return response.data;
  },

  // Update doctor availability
  updateDoctorAvailability: async (doctorId, availabilityData) => {
    const response = await api.put(`/ot/doctors/${doctorId}/availability`, availabilityData);
    return response.data;
  },

  // Get emergency protocols
  getEmergencyProtocols: async () => {
    const response = await api.get('/ot/emergency-protocols');
    return response.data;
  }
};

export default otService;
