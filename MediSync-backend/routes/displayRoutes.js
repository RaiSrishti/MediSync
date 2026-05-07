const express = require('express');
const router = express.Router();
const displayController = require('../controllers/displayController');

// Public routes (no authentication required for displays)

// Get public queue display for all departments
router.get('/public-queue', displayController.getPublicDisplay);

// Get emergency information display
router.get('/emergency-info', displayController.getEmergencyDisplay);

// Get hospital announcements
router.get('/announcements', displayController.getAnnouncementsDisplay);

// Get live hospital statistics
router.get('/live-stats', displayController.getLiveStats);

// Get comprehensive display dashboard
router.get('/dashboard', displayController.getDisplayDashboard);

// Department-specific routes

// Get department-specific display board
router.get('/department/:departmentId', displayController.getDepartmentDisplay);

// Get department queue summary (for small displays)
router.get('/department/:departmentId/summary', displayController.getDepartmentQueueSummary);

module.exports = router;
