const express = require('express');
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');
const flexibleAuthMiddleware = require('../middleware/flexibleAuthMiddleware');
const { canCreatePatients, canViewAllPatients, canManagePatients } = require('../middleware/roleMiddleware');
const router = express.Router();

// Staff routes (role-based access)
router.post('/', flexibleAuthMiddleware, canCreatePatients, patientController.createPatient);
router.get('/', flexibleAuthMiddleware, canViewAllPatients, patientController.getPatients);
router.get('/search', flexibleAuthMiddleware, patientController.searchPatients); // Patient search for pharmacists
router.get('/department/:departmentId', flexibleAuthMiddleware, patientController.getDepartmentPatients);
router.get('/:patientId/history', flexibleAuthMiddleware, patientController.getPatientHistory);
router.get('/:patientId/medications', flexibleAuthMiddleware, patientController.getPatientMedications); // Patient medications
router.put('/:patientId/notes', flexibleAuthMiddleware, patientController.updatePatientNotes);
router.get('/:id', flexibleAuthMiddleware, canViewAllPatients, patientController.getPatientById);
router.put('/:id', flexibleAuthMiddleware, patientController.updatePatient); // Role-based field restrictions handled in controller
router.delete('/:id', flexibleAuthMiddleware, canManagePatients, patientController.deletePatient);

// Patient profile routes (authenticated users only)
router.get('/profile/me', flexibleAuthMiddleware, patientController.getMyProfile);
router.put('/profile/me', flexibleAuthMiddleware, patientController.updateMyProfile);

module.exports = router;
