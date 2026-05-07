// controllers/patientController.js
const Patient = require('../models/Patient');
const patientModel = new Patient();

// Helper function to safely stringify JSON fields
const safeJSONStringify = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
};

// Helper function to safely parse JSON fields
const safeJSONParse = (data) => {
  if (!data) return null;
  if (typeof data === 'object') return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('JSON parse error:', error);
      return data; // Return original string if parsing fails
    }
  }
  return data;
};

// Helper function to format patient response
const formatPatientResponse = (patient) => {
  return {
    ...patient,
    current_medications: safeJSONParse(patient.current_medications),
    allergies: safeJSONParse(patient.allergies),
    emergency_contact: safeJSONParse(patient.emergency_contact)
  };
};

// Create patient (Staff only - admin, doctor, nurse, receptionist)
exports.createPatient = async (req, res) => {
  try {
    const {
      email,
      name,
      age,
      gender,
      blood_group,
      phone_number,
      address,
      medical_history,
      current_medications,
      allergies,
      emergency_contact
    } = req.body;

    // Validate required fields
    if (!name || !age || !gender || !phone_number) {
      return res.status(400).json({ error: 'Name, age, gender, and phone number are required' });
    }

    // Check role permissions
    const userRole = req.user.role;
    const allowedRoles = ['admin', 'doctor', 'nurse', 'receptionist'];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only staff members can create patient profiles',
        allowedRoles 
      });
    }

    // Check if patient already exists
    if (email || phone_number) {
      const existingPatient = await patientModel.findByEmailOrPhone(email, phone_number);
      if (existingPatient) {
        return res.status(400).json({ error: 'Patient with this email/phone already exists' });
      }
    }

    // Prepare patient data
    const patientData = {
      email,
      name,
      age,
      gender,
      blood_group,
      phone_number,
      address,
      medical_history,
      current_medications: safeJSONStringify(current_medications),
      allergies: safeJSONStringify(allergies),
      emergency_contact: safeJSONStringify(emergency_contact)
    };

    // Create patient with creator tracking
    const newPatient = await patientModel.createPatient(patientData, req.user.id);
    const responsePatient = formatPatientResponse(newPatient);

    res.status(201).json({
      message: 'Patient profile created successfully',
      patient: responsePatient,
      createdBy: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      note: email ? 'Patient can register with this email to access their profile' : 'Patient profile created without email'
    });
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

// Get patients (Staff only)
exports.getPatients = async (req, res) => {
  try {
    const userRole = req.user.role;
    const allowedRoles = ['admin', 'doctor', 'nurse', 'receptionist'];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Only staff members can view all patients' });
    }

    let patients;
    
    // Different access levels based on role
    if (userRole === 'admin') {
      // Admin can see all patients
      patients = await patientModel.findAll();
    } else if (userRole === 'doctor') {
      // Doctor can see all patients in their department or all if no department
      patients = await patientModel.findAll();
    } else if (userRole === 'nurse' || userRole === 'receptionist') {
      // Nurse/Receptionist can see patients they created or all (depends on hospital policy)
      patients = await patientModel.findAll();
    }
    
    // Parse JSON fields for all patients
    const parsedPatients = patients.map(patient => formatPatientResponse(patient));

    res.json({
      patients: parsedPatients,
      count: parsedPatients.length,
      accessLevel: userRole
    });
  } catch (err) {
    console.error('Get patients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const patient = await patientModel.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    // Parse JSON fields safely
    const responsePatient = formatPatientResponse(patient);

    res.json(responsePatient);
  } catch (err) {
    console.error('Get patient error:', err);
    res.status(500).json({ error: 'Error fetching patient' });
  }
};

// Update patient (Role-based field restrictions)
exports.updatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    const existing = await patientModel.findById(patientId);
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if patient role is trying to update someone else's profile
    if (userRole === 'patient') {
      if (existing.user_id !== userId) {
        return res.status(403).json({ error: 'Patients can only update their own profile' });
      }
    }

    // Prepare update data with JSON field handling
    const updateData = { ...req.body };
    
    // Handle JSON fields
    if (updateData.current_medications) {
      updateData.current_medications = safeJSONStringify(updateData.current_medications);
    }
    if (updateData.allergies) {
      updateData.allergies = safeJSONStringify(updateData.allergies);
    }
    if (updateData.emergency_contact) {
      updateData.emergency_contact = safeJSONStringify(updateData.emergency_contact);
    }

    // Use role-based update method
    const updated = await patientModel.updatePatient(patientId, updateData, userRole, userId);
    const responsePatient = formatPatientResponse(updated);

    // Get field restrictions for response
    const restrictions = {
      patient: 'Can only update: phone, address, emergency contact',
      receptionist: 'Can update: basic info, contact details',
      nurse: 'Can update: basic info, contact details, allergies',
      doctor: 'Can update: all fields except email',
      admin: 'Full access to all fields'
    };

    res.json({
      message: 'Patient updated successfully',
      patient: responsePatient,
      restrictions: restrictions[userRole],
      updatedBy: {
        id: userId,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Update patient error:', err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Only admin and doctors can delete patients
    if (!['admin', 'doctor'].includes(userRole)) {
      return res.status(403).json({ error: 'Only admin and doctors can delete patient profiles' });
    }

    const deleted = await patientModel.delete(req.params.id);
    if (deleted) {
      res.json({ 
        message: 'Patient deleted successfully',
        deletedBy: {
          id: req.user.id,
          role: userRole
        }
      });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (err) {
    console.error('Delete patient error:', err);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};

// Get current user's patient profile (For patients who registered)
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const patient = await patientModel.getByUserId(userId);
    
    if (!patient) {
      // For patient role users, automatically create a basic profile
      if (req.user.role === 'patient') {
        const basicPatientData = {
          user_id: userId,
          email: req.user.email,
          name: req.user.name,
          age: null,
          gender: null,
          blood_group: null,
          phone_number: null,
          address: null,
          medical_history: null,
          current_medications: null,
          allergies: null,
          emergency_contact: null
        };
        
        const newPatientProfile = await patientModel.createPatient(basicPatientData, userId);
        
        const responsePatient = formatPatientResponse(newPatientProfile);
        
        return res.json({
          message: 'Patient profile created and retrieved successfully',
          patient: responsePatient,
          isLinked: true,
          createdByStaff: false,
          autoCreated: true,
          permissions: {
            canEdit: ['phone_number', 'address', 'emergency_contact'],
            cannotEdit: ['name', 'age', 'medical_history', 'current_medications', 'allergies']
          }
        });
      }
      
      return res.status(404).json({ 
        message: 'No patient profile found. Contact staff to create your medical profile.',
        hasProfile: false 
      });
    }

    const responsePatient = formatPatientResponse(patient);
    
    res.json({
      message: 'Patient profile retrieved successfully',
      patient: responsePatient,
      isLinked: patient.is_linked,
      createdByStaff: patient.created_by_staff,
      permissions: {
        canEdit: ['age', 'gender', 'blood_group', 'phone_number', 'address', 'emergency_contact'],
        cannotEdit: ['name', 'medical_history', 'current_medications', 'allergies']
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

// Update current user's patient profile (Limited access for patients)
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Find existing patient profile
    const existingPatient = await patientModel.getByUserId(userId);
    
    if (!existingPatient) {
      return res.status(404).json({ message: 'No patient profile found' });
    }

    // Use role-based update method
    const updatedPatient = await patientModel.updatePatient(existingPatient.id, req.body, userRole, userId);
    const responsePatient = formatPatientResponse(updatedPatient);

    res.json({
      message: 'Profile updated successfully',
      patient: responsePatient,
      note: 'Only contact information can be updated. For medical information changes, contact hospital staff.'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get patients by department (Doctor/Nurse access)
exports.getDepartmentPatients = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const userRole = req.user.role;

    // Check role permissions - only doctors, nurses, and admins can access
    if (!['doctor', 'nurse', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors and nurses can view department patients',
        allowedRoles: ['doctor', 'nurse', 'admin']
      });
    }

    // If user is a doctor, ensure they can only see patients from their department
    if (userRole === 'doctor' && req.user.department_id && req.user.department_id != departmentId) {
      return res.status(403).json({ 
        error: 'Doctors can only view patients from their own department'
      });
    }

    const patients = await patientModel.getByDepartment(departmentId);
    
    // Format the response
    const formattedPatients = patients.map(formatPatientResponse);

    res.json({
      patients: formattedPatients,
      count: formattedPatients.length
    });
  } catch (error) {
    console.error('Get department patients error:', error);
    res.status(500).json({ error: 'Failed to fetch department patients' });
  }
};

// Get patient history (consultation history)
exports.getPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const userRole = req.user.role;

    // Check role permissions
    if (!['doctor', 'nurse', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors and nurses can view patient history',
        allowedRoles: ['doctor', 'nurse', 'admin']
      });
    }

    const history = await patientModel.getConsultationHistory(patientId);

    res.json({
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({ error: 'Failed to fetch patient history' });
  }
};

// Update patient notes (Doctor access)
exports.updatePatientNotes = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { notes } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Check role permissions - only doctors can update notes
    if (!['doctor', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors can update patient notes',
        allowedRoles: ['doctor', 'admin']
      });
    }

    // Update patient medical details with notes
    const updatedPatient = await patientModel.updateMedicalDetails(patientId, { notes }, userId);

    res.json({
      message: 'Patient notes updated successfully',
      patient: formatPatientResponse(updatedPatient)
    });
  } catch (error) {
    console.error('Update patient notes error:', error);
    res.status(500).json({ error: 'Failed to update patient notes' });
  }
};

// Search patients (for pharmacists and staff)
exports.searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    const userRole = req.user.role;

    // Check role permissions
    if (!['pharmacist', 'doctor', 'nurse', 'receptionist', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to search patients',
        allowedRoles: ['pharmacist', 'doctor', 'nurse', 'receptionist', 'admin']
      });
    }

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters long' });
    }

    const searchTerm = q.trim();
    const patients = await patientModel.searchPatients(searchTerm);

    res.json({
      data: patients.map(formatPatientResponse),
      count: patients.length
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
};

// Get patient medications (for pharmacists and doctors)
exports.getPatientMedications = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const userRole = req.user.role;

    // Check role permissions
    if (!['pharmacist', 'doctor', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to view patient medications',
        allowedRoles: ['pharmacist', 'doctor', 'admin']
      });
    }

    const medications = await patientModel.getPatientMedications(patientId);

    res.json({
      data: medications,
      count: medications.length
    });
  } catch (error) {
    console.error('Get patient medications error:', error);
    res.status(500).json({ error: 'Failed to fetch patient medications' });
  }
};
