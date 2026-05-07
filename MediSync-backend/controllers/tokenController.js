const Token = require('../models/Token');
const Patient = require('../models/Patient');
const Department = require('../models/Department');
const tokenModel = new Token();
const patientModel = new Patient();
const departmentModel = new Department();

// Helper function to emit token updates
const emitTokenUpdate = async (req, departmentId) => {
  try {
    const queue = await tokenModel.getDepartmentQueue(departmentId);
    if (req.app.locals.io) {
      req.app.locals.io.to(`department_${departmentId}`).emit('tokenStatusUpdated', {
        departmentId,
        queue,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error emitting token update:', error);
  }
};

// Helper function to emit department updates
const emitDepartmentUpdate = async (req, departmentId, action) => {
  try {
    if (req.app.locals.io) {
      req.app.locals.io.emit('departmentUpdate', {
        departmentId,
        action,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error emitting department update:', error);
  }
};

// Generate new token
exports.generateToken = async (req, res) => {
  try {
    const { patient_id, department_id, doctor_id, priority = 0 } = req.body;

    if (!patient_id || !department_id) {
      return res.status(400).json({ error: 'Patient ID and Department ID are required' });
    }

    // Check if token generation is allowed at current time
    try {
      const timeCheck = await tokenModel.systemSettings.isTokenGenerationAllowed();
      
      if (!timeCheck.allowed) {
        return res.status(403).json({ 
          error: 'Token generation not allowed at this time',
          message: timeCheck.message,
          timeWindow: timeCheck.timeWindow
        });
      }
    } catch (timeError) {
      console.error('Error checking token generation time:', timeError);
      // Continue with token generation if time check fails
    }

    const patient = await patientModel.findById(patient_id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const department = await departmentModel.findById(department_id);
    if (!department) return res.status(404).json({ error: 'Department not found' });

    const token = await tokenModel.generate(patient_id, department_id, doctor_id);
    
    if (priority > 0) {
      await tokenModel.setPriority(token.id, priority);
    }

    await emitTokenUpdate(req, department_id);

    res.status(201).json({
      message: 'Token generated successfully',
      token,
    });
  } catch (err) {
    console.error('Generate token error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get department queue
exports.getQueue = async (req, res) => {
  try {
    const department_id = req.params.department;
    const requestedDoctorId = req.query.doctor_id; // Allow filtering by doctor via query param
    
    // Handle both authenticated and unauthenticated requests
    const user_id = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;

    if (!department_id) {
      return res.status(400).json({ error: 'Department ID is required' });
    }

    // Determine doctor filtering logic
    let doctorId = null;
    if (requestedDoctorId) {
      // If specific doctor requested via query param, use that
      doctorId = requestedDoctorId;
    } else if (userRole === 'doctor') {
      // If authenticated doctor, show their tokens
      doctorId = user_id;
    }
    // For admin or public access without doctor filter, show all tokens (doctorId remains null)

    const isAdmin = (userRole === 'admin');

    let queue = [];
    let stats = {};
    let estimatedWaitTime = 0;

    try {
      // For public access (display boards), show all tokens in queue
      // For authenticated users, apply role-based filtering
      queue = await tokenModel.getDepartmentQueue(department_id, doctorId) || [];
    } catch (queueErr) {
      console.error('Queue error:', queueErr.message);
      queue = [];
    }

    try {
      stats = await tokenModel.getTodayStats(department_id, doctorId) || {};
    } catch (statsErr) {
      console.error('Stats error:', statsErr.message);
      stats = { total_tokens: 0, completed: 0, waiting: 0, in_progress: 0, no_show: 0 };
    }

    try {
      estimatedWaitTime = await tokenModel.estimateWaitTime(department_id, doctorId) || 0;
    } catch (waitErr) {
      console.error('Wait time error:', waitErr.message);
      estimatedWaitTime = 0;
    }

    res.json({
      queue: Array.isArray(queue) ? queue.map(token => ({
        ...token,
        id: token.id, // Ensure ID is always present
        token_number: token.token_number,
        status: token.status,
        patient_name: token.patient_name,
        doctor_name: token.doctor_name,
        created_at: token.created_at,
        estimated_time: token.estimated_time
      })) : [],
      stats: {
        total: stats.total_tokens || 0,
        completed: stats.completed_tokens || 0,
        waiting: stats.waiting_tokens || 0,
        in_progress: stats.in_progress_tokens || 0,
        no_show: stats.no_show_tokens || 0,
        avg_consultation_time: stats.avg_consultation_time || 0
      },
      estimatedWaitTime: `${estimatedWaitTime} minutes`,
      debug: {
        queueLength: Array.isArray(queue) ? queue.length : 0,
        departmentId: department_id,
        doctorId: doctorId,
        userRole: userRole
      }
    });
  } catch (err) {
    console.error('Get queue error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all today's tokens for a department (including completed)
exports.getAllTodayTokens = async (req, res) => {
  try {
    const department_id = req.params.departmentId;
    const userRole = req.user?.role;
    const user_id = req.user?.id;

    if (!department_id) {
      return res.status(400).json({ error: 'Department ID is required' });
    }

    let doctorId = null;
    
    // For doctor role, filter by their own tokens
    if (userRole === 'doctor') {
      doctorId = user_id;
    }

    const allTokens = await tokenModel.getAllTodayTokens(department_id, doctorId) || [];
    const stats = await tokenModel.getTodayStats(department_id, doctorId) || {};

    res.json({
      success: true,
      data: allTokens,
      stats: stats,
      meta: {
        departmentId: department_id,
        doctorId: doctorId,
        userRole: userRole
      }
    });
  } catch (err) {
    console.error('Get all today tokens error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update token status
exports.updateTokenStatus = async (req, res) => {
  try {
    const tokenId = req.params.id;
    const { status } = req.body;
    const userRole = req.user.role;

    // Validate tokenId
    if (!tokenId || tokenId === 'undefined' || tokenId === 'null') {
      return res.status(400).json({ 
        error: 'Valid token ID is required',
        received: tokenId
      });
    }

    if (!['doctor', 'nurse', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors and nurses can update token status',
        allowedRoles: ['doctor', 'nurse', 'admin']
      });
    }

    if (!['waiting', 'in-progress', 'completed', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedToken = await tokenModel.updateTokenStatus(tokenId, status);
    
    if (!updatedToken) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = await tokenModel.findById(tokenId);
    await emitTokenUpdate(req, token.department_id);

    res.json({
      message: 'Token status updated successfully',
      token: updatedToken,
      updatedBy: {
        id: req.user._id,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Update token status error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Call next token
exports.callNextToken = async (req, res) => {
  try {
    const department_id = req.params.department;
    const userRole = req.user.role;

    if (userRole !== 'doctor') {
      return res.status(403).json({ 
        error: 'Only doctors can call next token',
        allowedRoles: ['doctor']
      });
    }

    const doctorId = req.user.id;
    const nextToken = await tokenModel.callNextToken(department_id, doctorId);

    if (!nextToken) {
      return res.status(404).json({ message: 'No tokens waiting in queue' });
    }

    await emitTokenUpdate(req, department_id);

    // Notify specific patient
    if (req.app.locals.io && nextToken.patient_id) {
      req.app.locals.io.to(`patient_${nextToken.patient_id}`).emit('tokenCalled', {
        tokenId: nextToken.id,
        tokenNumber: nextToken.token_number,
        departmentId: department_id,
        doctorName: req.user.name
      });
    }

    res.json({
      message: 'Next token called successfully',
      token: nextToken,
      calledBy: {
        id: req.user._id,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Call next token error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Complete token
exports.completeToken = async (req, res) => {
  try {
    const tokenId = req.params.id;
    const userRole = req.user.role;

    // Validate tokenId
    if (!tokenId || tokenId === 'undefined' || tokenId === 'null') {
      return res.status(400).json({ 
        error: 'Valid token ID is required',
        received: tokenId
      });
    }

    // Check if token exists first
    const existingToken = await tokenModel.findById(tokenId);
    if (!existingToken) {
      return res.status(404).json({ 
        error: 'Token not found',
        tokenId: tokenId,
        message: `Token with ID ${tokenId} does not exist`
      });
    }

    if (!['doctor', 'nurse', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors and nurses can complete tokens',
        allowedRoles: ['doctor', 'nurse', 'admin']
      });
    }

    const completedToken = await tokenModel.completeToken(tokenId);

    if (!completedToken) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = await tokenModel.findById(tokenId);
    await emitTokenUpdate(req, token.department_id);

    res.json({
      message: 'Token completed successfully',
      token: completedToken,
      completedBy: {
        id: req.user._id,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Complete token error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark token as no-show
exports.markNoShow = async (req, res) => {
  try {
    const tokenId = req.params.id;
    const userRole = req.user.role;

    // Validate tokenId
    if (!tokenId || tokenId === 'undefined' || tokenId === 'null') {
      return res.status(400).json({ 
        error: 'Valid token ID is required',
        received: tokenId
      });
    }

    if (!['doctor', 'nurse', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors and nurses can mark tokens as no-show',
        allowedRoles: ['doctor', 'nurse', 'admin']
      });
    }

    const updatedToken = await tokenModel.markNoShow(tokenId);

    if (!updatedToken) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = await tokenModel.findById(tokenId);
    await emitTokenUpdate(req, token.department_id);

    res.json({
      message: 'Token marked as no-show',
      token: updatedToken,
      markedBy: {
        id: req.user._id,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Mark no-show error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Set token priority
exports.setPriority = async (req, res) => {
  try {
    const tokenId = req.params.id;
    const { priority } = req.body;
    const userRole = req.user.role;

    // Validate tokenId
    if (!tokenId || tokenId === 'undefined' || tokenId === 'null') {
      return res.status(400).json({ 
        error: 'Valid token ID is required',
        received: tokenId
      });
    }

    if (!['doctor', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors can set token priority',
        allowedRoles: ['doctor', 'admin']
      });
    }

    if (priority < 0 || priority > 10) {
      return res.status(400).json({ error: 'Priority must be between 0 and 10' });
    }

    const updatedToken = await tokenModel.setPriority(tokenId, priority);

    if (!updatedToken) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = await tokenModel.findById(tokenId);
    await emitTokenUpdate(req, token.department_id);

    res.json({
      message: 'Token priority updated successfully',
      token: updatedToken,
      updatedBy: {
        id: req.user._id,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Set priority error:', err);
    res.status(500).json({ error: err.message });
  }
};
// Get department analytics
exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const department_id = req.params.department;
    const user_id = req.user.id;
    const userRole = req.user.role;

    // For doctors, only show their own analytics
    const doctorId = userRole === 'doctor' ? user_id : null;

    let todayStats = {};
    let estimatedWaitTime = 0;

    try {
      todayStats = await tokenModel.getTodayStats(department_id, doctorId) || {};
    } catch (statsErr) {
      console.error('Analytics stats error:', statsErr.message);
      todayStats = { 
        total_tokens: 0, 
        completed_tokens: 0, 
        waiting_tokens: 0, 
        in_progress_tokens: 0, 
        no_show_tokens: 0,
        avg_consultation_time: 0
      };
    }

    try {
      estimatedWaitTime = await tokenModel.estimateWaitTime(department_id, doctorId) || 0;
    } catch (waitErr) {
      console.error('Analytics wait time error:', waitErr.message);
      estimatedWaitTime = 0;
    }

    res.json({
      todayStats,
      estimatedWaitTime: `${estimatedWaitTime} minutes`
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get patient token history
exports.getPatientHistory = async (req, res) => {
  try {
    const patient_id = req.params.patientId;
    const limit = parseInt(req.query.limit) || 10;

    const history = await tokenModel.getTokenHistory(patient_id, limit);

    res.json({
      history
    });
  } catch (err) {
    console.error('Get patient history error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get current patient for doctor (in-progress token)
exports.getCurrentPatient = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const userRole = req.user.role;
    const departmentId = req.user.department_id;

    // Only doctors can access current patient
    if (!['doctor', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors can access current patient details',
        allowedRoles: ['doctor', 'admin']
      });
    }

    // Check if doctor has a department
    if (!departmentId && userRole === 'doctor') {
      return res.status(400).json({
        error: 'Doctor must be assigned to a department',
        note: 'Contact admin to assign you to a department'
      });
    }

    let currentPatient;
    
    if (userRole === 'admin') {
      // Admin can see current patient from any department (for testing)
      // For now, just return null if no department specified
      return res.status(200).json({ 
        message: 'No current patient (admin user)',
        patient: null
      });
    } else {
      // Get current patient for doctor's department
      try {
        const doctorId = userRole === 'doctor' ? req.user.id : null;
        currentPatient = await tokenModel.getCurrentTokenWithPatient(departmentId, doctorId);
      } catch (patientErr) {
        console.error('Error getting current patient:', patientErr);
        return res.status(500).json({ 
          error: 'Error getting current patient',
          message: patientErr.message
        });
      }
    }

    if (!currentPatient) {
      return res.status(200).json({ 
        message: 'No patient currently in progress',
        note: 'Call next token to start consultation',
        patient: null
      });
    }

    // Parse JSON fields safely
    const safeJsonParse = (jsonString) => {
      try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      } catch (e) {
        return jsonString; // Return as-is if parsing fails
      }
    };

    if (currentPatient.medical_history) {
      currentPatient.medical_history = safeJsonParse(currentPatient.medical_history);
    }
    if (currentPatient.current_medications) {
      currentPatient.current_medications = safeJsonParse(currentPatient.current_medications);
    }
    if (currentPatient.allergies) {
      currentPatient.allergies = safeJsonParse(currentPatient.allergies);
    }

    // Get consultation history
    const consultationHistory = await patientModel.getConsultationHistory(currentPatient.id);

    res.json({
      message: 'Current patient retrieved successfully',
      patient: currentPatient,
      consultationHistory,
      tokenInfo: {
        token_id: currentPatient.token_id,
        token_number: currentPatient.token_number,
        wait_time: currentPatient.total_wait_time,
        consultation_time: currentPatient.consultation_time
      }
    });
  } catch (err) {
    console.error('Get current patient error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update patient medical details during consultation (Doctors only)
exports.updatePatientMedicalDetails = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const doctorId = req.user.id;
    const userRole = req.user.role;
    const medicalData = req.body;



    // Only doctors can update medical details
    if (!['doctor', 'admin'].includes(userRole)) {
      console.log('Access denied - role not authorized:', userRole);
      return res.status(403).json({ 
        error: 'Only doctors can update medical details',
        allowedRoles: ['doctor', 'admin']
      });
    }

    // Verify this patient is currently being seen by this doctor
    // Simplified access: Allow doctors to update any patient
    let canUpdatePatient = false;
    
    if (userRole === 'admin') {
      canUpdatePatient = true;
    } else {
      // Check if patient exists
      const patient = await patientModel.findById(patientId);
      
      if (patient) {
        canUpdatePatient = true;
      }
    }

    if (!canUpdatePatient) {
      return res.status(404).json({ 
        error: 'Patient not found',
        message: `Patient with ID ${patientId} does not exist.`
      });
    }

    // Update medical details
    const updatedPatient = await patientModel.updateMedicalDetails(patientId, medicalData, doctorId);

    // Emit real-time update if needed
    if (req.app.locals.io) {
      // Emit to all patients for medical updates notification
      req.app.locals.io.emit('patientMedicalUpdated', {
        patientId: parseInt(patientId),
        updatedBy: {
          id: doctorId,
          role: userRole
        }
      });
    }

    res.json({
      message: 'Patient medical details updated successfully',
      patient: updatedPatient,
      updatedBy: {
        id: doctorId,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Update patient medical details error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Create prescription for current patient (Doctors only)
exports.createCurrentPatientPrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const userRole = req.user.role;

    // Only doctors can create prescriptions
    if (!['doctor', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only doctors can create prescriptions',
        allowedRoles: ['doctor', 'admin']
      });
    }

    // Get current patient
    const currentPatient = await tokenModel.getDoctorCurrentPatients(doctorId);
    
    if (!currentPatient) {
      return res.status(404).json({ 
        error: 'No patient currently in progress'
      });
    }

    const {
      diagnosis,
      medications,
      instructions,
      notes
    } = req.body;

    // Validate required fields
    if (!diagnosis || !medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ 
        error: 'Diagnosis and medications are required' 
      });
    }

    // Create prescription using the prescription controller logic
    const Prescription = require('../models/Prescription');
    const Drug = require('../models/Drug');
    const prescriptionModel = new Prescription();
    const drugModel = new Drug();

    // Validate each medication
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.drug_id || !med.quantity || !med.dosage || !med.frequency) {
        return res.status(400).json({ 
          error: `Medication ${i + 1}: drug_id, quantity, dosage, and frequency are required` 
        });
      }

      // Check drug availability
      const availability = await drugModel.checkAvailability(med.drug_id, med.quantity);
      if (!availability.available) {
        return res.status(400).json({ 
          error: `Medication ${i + 1}: ${availability.reason}`,
          availableQuantity: availability.available_quantity
        });
      }
    }

    const newPrescription = await prescriptionModel.createPrescription({
      patient_id: currentPatient.id,
      token_id: currentPatient.token_id,
      diagnosis,
      medications,
      instructions,
      notes
    }, doctorId);

    // Emit real-time update to pharmacists
    if (req.app.locals.io) {
      req.app.locals.io.emit('newPrescription', {
        prescription: newPrescription,
        createdBy: {
          id: doctorId,
          name: req.user.name,
          role: userRole
        }
      });
    }

    res.status(201).json({
      message: 'Prescription created successfully for current patient',
      prescription: newPrescription,
      patientInfo: {
        name: currentPatient.name,
        token_number: currentPatient.token_number
      }
    });
  } catch (err) {
    console.error('Create current patient prescription error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Generate token for patient (self-service)
exports.generatePatientToken = async (req, res) => {
  try {
    const { department_id, doctor_id } = req.body;
    const userId = req.user.id;  // Use the processed user.id from middleware

    if (!department_id) {
      return res.status(400).json({ error: 'Department is required' });
    }

    // Check if token generation is allowed at current time
    try {
      const timeCheck = await tokenModel.systemSettings.isTokenGenerationAllowed();
      if (!timeCheck.allowed) {
        return res.status(403).json({ 
          error: 'Token generation not allowed at this time',
          message: timeCheck.message,
          timeWindow: {
            startTime: timeCheck.startTime,
            endTime: timeCheck.endTime
          }
        });
      }
    } catch (timeError) {
      console.error('Error checking token generation time:', timeError);
      // Continue with token generation if time check fails
    }

    // Find patient profile for this user
    const patient = await patientModel.getByUserId(userId);
    if (!patient) {
      return res.status(404).json({ 
        error: 'Patient profile not found. Please contact reception to create your medical profile.',
        userId: userId,
        debug: 'No patient record found for this user ID'
      });
    }

    // Check if patient already has an active token for today
    const existingToken = await tokenModel.getActiveTokenForPatient(patient.id);
    if (existingToken) {
      return res.status(400).json({ 
        error: 'You already have an active token for today',
        existingToken 
      });
    }

    // Generate token with optional doctor preference
    const tokenResult = await tokenModel.generateWithDoctor(patient.id, department_id, doctor_id);
    
    // The generateWithDoctor method should return the token with details
    res.status(201).json({
      message: 'Token generated successfully',
      token: tokenResult
    });
  } catch (err) {
    console.error('Generate patient token error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};

// Get patient's own tokens
exports.getMyTokens = async (req, res) => {
  try {
    const userId = req.user.id;  // Use the processed user.id from middleware
    const { status, limit = 10 } = req.query;

    // Find patient profile for this user
    const patient = await patientModel.getByUserId(userId);
    if (!patient) {
      // Return empty tokens array instead of 404 for better UX
      return res.json({
        tokens: [],
        message: 'No patient profile found. Please contact reception to complete your medical profile setup.',
        hasProfile: false
      });
    }

    // Get tokens with optional status filter
    const tokens = await tokenModel.getPatientTokens(patient.id, status, limit);

    res.json({
      tokens,
      patientId: patient.id,
      patientName: patient.name
    });
  } catch (err) {
    console.error('Get my tokens error:', err);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
};

// Get token generation time information
exports.getTokenTimeInfo = async (req, res) => {
  try {
    const timeInfo = await tokenModel.getTokenTimeInfo();
    const timeCheck = await tokenModel.systemSettings.isTokenGenerationAllowed();
    
    res.json({
      timeWindow: timeInfo,
      currentStatus: {
        allowed: timeCheck.allowed,
        message: timeCheck.message
      },
      currentTime: new Date().toTimeString().slice(0, 5)
    });
  } catch (err) {
    console.error('Get token time info error:', err);
    res.status(500).json({ error: 'Failed to fetch token time information' });
  }
};

// Debug endpoint to check current time settings
exports.getTimeSettings = async (req, res) => {
  try {
    const isEnabled = await tokenModel.systemSettings.getSetting('token_time_restriction_enabled');
    const startTime = await tokenModel.systemSettings.getSetting('token_generation_start_time');
    const endTime = await tokenModel.systemSettings.getSetting('token_generation_end_time');
    const timeCheck = await tokenModel.systemSettings.isTokenGenerationAllowed();
    
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    const currentTimeUTC = now.toTimeString().slice(0, 5);
    const currentTimeIST = istTime.toTimeString().slice(0, 5);
    
    res.json({
      message: 'Current time settings',
      settings: {
        enabled: isEnabled,
        startTime: startTime,
        endTime: endTime,
        currentTimeUTC: currentTimeUTC,
        currentTimeIST: currentTimeIST,
        serverTimeUTC: now.toISOString(),
        serverTimeIST: istTime.toISOString()
      },
      timeCheck: timeCheck,
      debugInfo: {
        timezoneOffset: '+05:30 (IST)',
        note: 'System uses IST for time restrictions'
      }
    });
  } catch (err) {
    console.error('Get time settings error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Admin endpoint to update token time settings
exports.updateTokenTimeSettings = async (req, res) => {
  try {
    const { startTime, endTime, enabled } = req.body;
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return res.status(400).json({ error: 'Invalid start time format. Use HH:MM' });
    }
    if (endTime && !timeRegex.test(endTime)) {
      return res.status(400).json({ error: 'Invalid end time format. Use HH:MM' });
    }

    const updates = [];
    
    if (startTime !== undefined) {
      await tokenModel.systemSettings.updateSetting('token_generation_start_time', startTime);
      updates.push(`Start time: ${startTime}`);
    }
    
    if (endTime !== undefined) {
      await tokenModel.systemSettings.updateSetting('token_generation_end_time', endTime);
      updates.push(`End time: ${endTime}`);
    }
    
    if (enabled !== undefined) {
      await tokenModel.systemSettings.updateSetting('token_time_restriction_enabled', enabled.toString());
      updates.push(`Restrictions ${enabled ? 'enabled' : 'disabled'}`);
    }

    res.json({
      message: 'Token time settings updated successfully',
      updates: updates,
      updatedAt: new Date()
    });
  } catch (err) {
    console.error('Update token time settings error:', err);
    res.status(500).json({ error: 'Failed to update token time settings' });
  }
};

// Debug endpoint to check all system settings
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await tokenModel.systemSettings.getAllSettings();
    const timeCheck = await tokenModel.systemSettings.isTokenGenerationAllowed();
    
    res.json({
      settings,
      currentTimeCheck: timeCheck,
      currentTime: new Date().toTimeString().slice(0, 5),
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Get system settings error:', err);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
};

// Debug endpoint to check queue data structure
exports.debugQueue = async (req, res) => {
  try {
    const departmentId = req.params.department || 1;
    
    // Get raw queue data
    const rawQueue = await tokenModel.db.raw(`
      SELECT 
        t.*,
        p.name as patient_name,
        p.phone_number as patient_phone,
        p.age as patient_age,
        u.name as doctor_name
      FROM tokens t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN users u ON t.doctor_id = u.id
      WHERE t.department_id = ?
        AND DATE(t.created_at) = CURDATE()
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [departmentId]);

    // Get processed queue data  
    const processedQueue = await tokenModel.getDepartmentQueue(departmentId);
    const stats = await tokenModel.getTodayStats(departmentId);
    
    res.json({
      departmentId,
      rawQueueCount: rawQueue[0].length,
      rawQueue: rawQueue[0],
      processedQueueCount: processedQueue.length,
      processedQueue,
      stats,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Debug queue error:', err);
    res.status(500).json({ error: 'Failed to debug queue', details: err.message });
  }
};
