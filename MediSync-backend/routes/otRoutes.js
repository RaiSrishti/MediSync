// ...existing code...

const express = require('express');
const router = express.Router();
const otController = require('../controllers/otController');
const authMiddleware = require('../middleware/authMiddleware');
const flexibleAuthMiddleware = require('../middleware/flexibleAuthMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Public emergency dashboard (no authentication required)
router.get('/emergency-dashboard', otController.getEmergencyDashboard);

// Public status board for patients (no authentication required)
router.get('/status-board', otController.getOTStatusBoard);

// Routes that accept both normal and emergency authentication
router.get('/doctors/availability', flexibleAuthMiddleware, otController.getAllDoctorsAvailability);

// Basic OT Management (Admin only)
router.get('/all', flexibleAuthMiddleware, requireRole(['admin']), otController.getAllOTs);
router.get('/assigned', flexibleAuthMiddleware, requireRole(['doctor']), otController.getAssignedOTs);
router.get('/:otId', flexibleAuthMiddleware, requireRole(['admin', 'doctor', 'nurse']), otController.getOTById);
router.post('/', flexibleAuthMiddleware, requireRole(['admin']), otController.createOT);
router.put('/:otId', flexibleAuthMiddleware, requireRole(['admin']), otController.updateOT);
router.put('/:otId/complete', flexibleAuthMiddleware, requireRole(['doctor']), (req, res) => otController.completeOT(req, res));
router.delete('/:otId', flexibleAuthMiddleware, requireRole(['admin']), otController.deleteOT);
router.put('/:otId/status', flexibleAuthMiddleware, requireRole(['admin', 'doctor', 'nurse']), otController.updateOTStatus);

// Doctor availability management
router.put('/doctors/:doctorId/availability', 
  flexibleAuthMiddleware, requireRole(['doctor', 'nurse', 'admin']), 
  otController.updateDoctorAvailability
);
router.post('/doctors/initialize-daily-availability', 
  flexibleAuthMiddleware, requireRole(['admin', 'nurse']), 
  otController.initializeDailyAvailability
);

// Schedule management routes
router.get('/schedules/upcoming', flexibleAuthMiddleware, otController.getUpcomingSchedules);
router.get('/schedules/check-availability', flexibleAuthMiddleware, otController.checkAvailability);

// Create schedules - Doctors and Admins only
router.post('/schedules', 
  flexibleAuthMiddleware, requireRole(['doctor', 'admin']), 
  otController.createSchedule
);

// Emergency schedules - Can be created by doctors, nurses, and admins
router.post('/schedules/emergency', 
  flexibleAuthMiddleware, requireRole(['doctor', 'nurse', 'admin']), 
  otController.createEmergencySchedule
);

// Update schedule status - Medical staff only
router.put('/schedules/:scheduleId/status', 
  flexibleAuthMiddleware, requireRole(['doctor', 'nurse', 'admin']), 
  otController.updateScheduleStatus
);

// Statistics and reporting - Admin and medical staff
router.get('/statistics/utilization', 
  flexibleAuthMiddleware, requireRole(['doctor', 'nurse', 'admin']), 
  otController.getOTUtilizationStats
);

module.exports = router;
