const express = require('express');
const drugController = require('../controllers/drugController');
const authMiddleware = require('../middleware/authMiddleware');
const flexibleAuthMiddleware = require('../middleware/flexibleAuthMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();

// Drug management routes

// Public routes (for viewing drugs)
router.get('/', flexibleAuthMiddleware, drugController.getDrugs); // All authenticated users can view drugs
router.get('/categories', flexibleAuthMiddleware, drugController.getCategories);
router.get('/manufacturers', flexibleAuthMiddleware, drugController.getManufacturers);
router.get('/check-availability', flexibleAuthMiddleware, drugController.checkAvailability);
router.get('/:id', flexibleAuthMiddleware, drugController.getDrugById);

// Pharmacist and Admin only routes
router.post('/', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.addDrug);
router.put('/:id', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.updateDrug);
router.delete('/:id', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.deleteDrug);
router.post('/:id/add-stock', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.addStock);
router.put('/:id/stock', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.updateStock);

// Inventory management routes (Pharmacist and Admin)
router.get('/inventory/low-stock', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.getLowStockDrugs);
router.get('/inventory/expiring', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.getExpiringDrugs);
router.get('/inventory/stats', flexibleAuthMiddleware, requireRole(['pharmacist', 'admin']), drugController.getPharmacyStats);

module.exports = router;
