const express = require('express');
const tokenController = require('../controllers/tokenController');
const authMiddleware = require('../middleware/authMiddleware');
const flexibleAuthMiddleware = require('../middleware/flexibleAuthMiddleware');
const { canCreatePatients, canManageTokens, canSetTokenPriority, requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();

// Token generation (staff who can create patients)
router.post('/', flexibleAuthMiddleware, canCreatePatients, tokenController.generateToken);

// Patient self-service token generation (patients only)
router.post('/generate', flexibleAuthMiddleware, requireRole(['patient']), tokenController.generatePatientToken);

// Get my tokens (patients can see their own tokens)
router.get('/my-tokens', flexibleAuthMiddleware, requireRole(['patient']), tokenController.getMyTokens);

// Queue viewing (public endpoint for display boards)
router.get('/queue/:department', tokenController.getQueue);

// Get all today's tokens for queue management (staff only)
router.get('/all-today/:departmentId', authMiddleware, canManageTokens, tokenController.getAllTodayTokens);

// Token management (only doctors and nurses)
router.put('/:id/status', flexibleAuthMiddleware, canManageTokens, tokenController.updateTokenStatus);
router.post('/call-next/:department', flexibleAuthMiddleware, canManageTokens, tokenController.callNextToken);
router.put('/:id/complete', flexibleAuthMiddleware, canManageTokens, tokenController.completeToken);
router.put('/:id/no-show', flexibleAuthMiddleware, canManageTokens, tokenController.markNoShow);

// Priority management (doctors only)
router.put('/:id/priority', authMiddleware, canSetTokenPriority, tokenController.setPriority);

// Doctor dashboard - current patient management (doctors only)
router.get('/current-patient', authMiddleware, requireRole(['doctor', 'admin']), tokenController.getCurrentPatient);
router.put('/patient/:patientId/medical', authMiddleware, requireRole(['doctor', 'admin']), tokenController.updatePatientMedicalDetails);

// Analytics and history (all staff)
router.get('/analytics/:department', authMiddleware, tokenController.getDepartmentAnalytics);
router.get('/history/:patientId', authMiddleware, tokenController.getPatientHistory);

// Token time management
router.get('/time-info', tokenController.getTokenTimeInfo);
router.get('/time-settings', tokenController.getTimeSettings);
router.put('/time-settings', authMiddleware, requireRole(['admin']), tokenController.updateTokenTimeSettings);
router.get('/debug-settings', authMiddleware, requireRole(['admin']), tokenController.getSystemSettings);
router.get('/debug-queue/:department?', tokenController.debugQueue);

module.exports = router;