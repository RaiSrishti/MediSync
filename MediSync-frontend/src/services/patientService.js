// Patient-specific services
import api from './api';

const patientService = {
  // Department related
  getDepartments: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  getDepartmentDetails: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}?include_staff=true`);
    return response.data;
  },

  getDepartmentDoctors: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}/doctors`);
    return response.data;
  },

  getDepartmentQueue: async (departmentId) => {
    const response = await api.get(`/tokens/queue/${departmentId}`);
    return response.data;
  },

  // Token related
  generateToken: async (departmentId, doctorId = null) => {
    const response = await api.post('/tokens/generate', {
      department_id: departmentId,
      doctor_id: doctorId
    });
    return response.data;
  },

  getMyTokens: async (status = null, limit = 10) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit);
    
    const response = await api.get(`/tokens/my-tokens?${params}`);
    return response.data;
  },

  // OT related (Operation Theatre)
  getOTStatusBoard: async () => {
    const response = await api.get('/ot/status-board');
    return response.data;
  },

  getDoctorsAvailability: async () => {
    const response = await api.get('/ot/doctors/availability');
    return response.data;
  },

  // Get doctors availability for a specific department
  getDepartmentDoctorsAvailability: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}/doctors/availability`);
    return response.data;
  },

  getEmergencyDashboard: async () => {
    const response = await api.get('/ot/emergency-dashboard');
    return response.data;
  },

  // Patient profile
  getMyProfile: async () => {
    const response = await api.get('/patients/profile/me');
    return response.data;
  },

  updateMyProfile: async (profileData) => {
    const response = await api.put('/patients/profile/me', profileData);
    return response.data;
  },

  // Patient search and medications (for pharmacists)
  searchPatients: async (searchTerm) => {
    const response = await api.get(`/patients/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  getPatientMedications: async (patientId) => {
    const response = await api.get(`/patients/${patientId}/medications`);
    return response.data;
  }

  // Patient registration removed - only doctors and admin can create patients
  // createPatient: async (patientData) => {
  //   const response = await api.post('/patients', patientData);
  //   return response.data;
  // }
};

export default patientService;
