const express = require('express');
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');
const flexibleAuthMiddleware = require('../middleware/flexibleAuthMiddleware');
const { canManageDepartments, canManageStaff } = require('../middleware/roleMiddleware');
const router = express.Router();

// Department management routes (Admin only)
router.post('/', flexibleAuthMiddleware, canManageDepartments, departmentController.createDepartment);
router.get('/', departmentController.getDepartments); // Public - can view departments
router.get('/:id', departmentController.getDepartmentById); // Public - can view department details
router.get('/:id/doctors', departmentController.getDepartmentDoctors); // Public - get available doctors
router.get('/:id/doctors/availability', departmentController.getDepartmentDoctorsWithAvailability); // Public - get doctors with availability
router.get('/:id/debug', flexibleAuthMiddleware, canManageDepartments, departmentController.debugDepartmentStatus); // Debug endpoint
router.put('/:id', flexibleAuthMiddleware, canManageDepartments, departmentController.updateDepartment);
router.delete('/:id', flexibleAuthMiddleware, canManageDepartments, departmentController.deleteDepartment);
router.put('/:id/toggle-status', flexibleAuthMiddleware, canManageDepartments, departmentController.toggleDepartmentStatus);

// Staff assignment routes (Admin only)
router.post('/:departmentId/doctors/:doctorId', flexibleAuthMiddleware, canManageDepartments, departmentController.addDoctorToDepartment);
router.delete('/:departmentId/doctors/:doctorId', flexibleAuthMiddleware, canManageDepartments, departmentController.removeDoctorFromDepartment);
router.post('/:departmentId/nurses/:nurseId', authMiddleware, canManageDepartments, departmentController.addNurseToDepartment);
router.delete('/:departmentId/nurses/:nurseId', authMiddleware, canManageDepartments, departmentController.removeNurseFromDepartment);

// Staff management routes (Admin only)
router.get('/staff/pending', authMiddleware, canManageStaff, departmentController.getPendingStaff);
router.get('/staff/all', authMiddleware, canManageStaff, departmentController.getAllStaff);
router.get('/staff/unassigned/doctors', authMiddleware, canManageStaff, departmentController.getUnassignedDoctors);
router.post('/staff/:userId/approve', authMiddleware, canManageStaff, departmentController.approveStaff);
router.post('/staff/:userId/reject', authMiddleware, canManageStaff, departmentController.rejectStaff);
router.delete('/staff/:userId', authMiddleware, canManageStaff, departmentController.deleteStaff);
router.get('/staff/:role', authMiddleware, canManageStaff, departmentController.getApprovedStaffByRole);

module.exports = router;
