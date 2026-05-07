import api from './api';

export const doctorService = {
  // Token Management - Doctor Specific
  getDoctorQueue: async (departmentId, doctorId) => {
    const url = doctorId 
      ? `/tokens/queue/${departmentId}?doctor_id=${doctorId}`
      : `/tokens/queue/${departmentId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Token Management - Department Specific (for admin/display purposes)
  getDepartmentQueue: async (departmentId) => {
    const response = await api.get(`/tokens/queue/${departmentId}`);
    return response.data;
  },

  // Get all today's tokens for queue management (including completed)
  getAllTodayTokens: async (departmentId) => {
    const response = await api.get(`/tokens/all-today/${departmentId}`);
    return response.data;
  },

  getCurrentPatient: async () => {
    const response = await api.get('/tokens/current-patient');
    return response.data;
  },

  callNextToken: async (departmentId) => {
    const response = await api.post(`/tokens/call-next/${departmentId}`);
    return response.data;
  },

  updateTokenStatus: async (tokenId, status) => {
    const response = await api.put(`/tokens/${tokenId}/status`, { status });
    return response.data;
  },

  completeToken: async (tokenId, serviceNotes) => {
    const response = await api.put(`/tokens/${tokenId}/complete`, { serviceNotes });
    return response.data;
  },

  markNoShow: async (tokenId) => {
    const response = await api.put(`/tokens/${tokenId}/no-show`);
    return response.data;
  },

  setTokenPriority: async (tokenId, priority) => {
    const response = await api.put(`/tokens/${tokenId}/priority`, { priority });
    return response.data;
  },

  // Patient Management
  getDepartmentPatients: async (departmentId) => {
    const response = await api.get(`/patients/department/${departmentId}`);
    return response.data;
  },

  registerPatient: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  getPatientHistory: async (patientId) => {
    const response = await api.get(`/patients/${patientId}/history`);
    return response.data;
  },

  updatePatientNotes: async (patientId, notes) => {
    const response = await api.put(`/patients/${patientId}/notes`, { notes });
    return response.data;
  },

  updatePatientMedicalDetails: async (patientId, medicalData) => {
    const response = await api.put(`/tokens/patient/${patientId}/medical`, medicalData);
    return response.data;
  },

  // Drug/Inventory access (read-only for doctors)
  getAvailableDrugs: async () => {
    const response = await api.get('/drugs');
    return response.data;
  },

  // Department Stats
  getDepartmentStats: async (departmentId) => {
    const response = await api.get(`/tokens/analytics/${departmentId}`);
    return response.data;
  },

  // OT Management (for surgeons)
  getMyOTSchedules: async () => {
    const response = await api.get('/ot/schedules/my-schedules');
    return response.data;
  },

  createOTSchedule: async (scheduleData) => {
    const response = await api.post('/ot/schedules', scheduleData);
    return response.data;
  },

  updateOTSchedule: async (scheduleId, scheduleData) => {
    const response = await api.put(`/ot/schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  // Doctor Availability
  updateAvailability: async (availabilityData) => {
    const response = await api.put('/ot/doctors/my-availability', availabilityData);
    return response.data;
  },

  getMyAvailability: async () => {
    const response = await api.get('/ot/doctors/my-availability');
    return response.data;
  }
};

export default doctorService;
