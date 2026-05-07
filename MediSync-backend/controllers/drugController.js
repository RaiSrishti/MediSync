const Drug = require('../models/Drug');
const drugModel = new Drug();

// Add new drug (Pharmacists only)
exports.addDrug = async (req, res) => {
  try {
    const pharmacistId = req.user.id;
    const userRole = req.user.role;

    console.log('Drug creation request:', {
      pharmacistId,
      userRole,
      body: req.body
    });

    // Only pharmacists and admins can add drugs
    if (!['pharmacist', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only pharmacists can add drugs',
        allowedRoles: ['pharmacist', 'admin']
      });
    }

    const {
      name,
      generic_name,
      category,
      description,
      manufacturer,
      current_stock,
      minimum_stock,
      unit,
      unit_price,
      expiry_date,
      location,
      usage_instructions,
      side_effects,
      contraindications
    } = req.body;

    // Validate required fields
    if (!name || !category || !unit || !unit_price) {
      console.log('Validation failed:', { name, category, unit, unit_price });
      return res.status(400).json({ 
        error: 'Name, category, unit, and unit price are required' 
      });
    }

    // Check if drug already exists
    const existingDrug = await drugModel.findOne({ name, manufacturer });
    if (existingDrug) {
      return res.status(400).json({ 
        error: 'Drug with this name and manufacturer already exists' 
      });
    }

    const newDrug = await drugModel.addDrug({
      name,
      generic_name,
      category,
      description,
      manufacturer,
      current_stock: parseInt(current_stock) || 0,
      minimum_stock: parseInt(minimum_stock) || 10,
      unit,
      unit_price: parseFloat(unit_price),
      expiry_date,
      location,
      usage_instructions,
      side_effects,
      contraindications
    }, pharmacistId);

    // Emit real-time update
    if (req.app.locals.io) {
      req.app.locals.io.emit('drugAdded', {
        drug: newDrug,
        addedBy: {
          id: pharmacistId,
          name: req.user.name,
          role: userRole
        }
      });
    }

    res.status(201).json({
      message: 'Drug added successfully',
      drug: newDrug
    });
  } catch (err) {
    console.error('Add drug error:', err);
    console.error('Stack trace:', err.stack);
    res.status(400).json({ 
      error: err.message,
      details: 'Check server logs for more information'
    });
  }
};

// Get all drugs with search and filters
exports.getDrugs = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      manufacturer, 
      in_stock, 
      low_stock,
      page = 1, 
      limit = 20 
    } = req.query;

    const filters = {
      category,
      manufacturer,
      in_stock: in_stock === 'true',
      low_stock: low_stock === 'true'
    };

    const drugs = await drugModel.searchDrugs(search, filters);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedDrugs = drugs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedDrugs,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: drugs.length,
        total_pages: Math.ceil(drugs.length / limit)
      }
    });
  } catch (err) {
    console.error('Get drugs error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get drug by ID
exports.getDrugById = async (req, res) => {
  try {
    const drug = await drugModel.findById(req.params.id);
    
    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    res.json({ drug });
  } catch (err) {
    console.error('Get drug error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update drug (Pharmacists only)
exports.updateDrug = async (req, res) => {
  try {
    const drugId = req.params.id;
    const pharmacistId = req.user.id;
    const userRole = req.user.role;

    console.log('Update drug request:', { drugId, pharmacistId, userRole, body: req.body });

    // Only pharmacists and admins can update drugs
    if (!['pharmacist', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only pharmacists can update drugs',
        allowedRoles: ['pharmacist', 'admin']
      });
    }

    const existing = await drugModel.findById(drugId);
    if (!existing) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    console.log('Existing drug:', existing);

    const updatedDrug = await drugModel.updateDrug(drugId, req.body, pharmacistId);

    console.log('Updated drug:', updatedDrug);

    // Emit real-time update
    if (req.app.locals.io) {
      req.app.locals.io.emit('drugUpdated', {
        drug: updatedDrug,
        updatedBy: {
          id: pharmacistId,
          name: req.user.name,
          role: userRole
        }
      });
    }

    res.json({
      message: 'Drug updated successfully',
      drug: updatedDrug
    });
  } catch (err) {
    console.error('Update drug error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

// Delete drug (Pharmacists only)
exports.deleteDrug = async (req, res) => {
  try {
    const drugId = req.params.id;
    const userRole = req.user.role;

    // Only pharmacists and admins can delete drugs
    if (!['pharmacist', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only pharmacists can delete drugs',
        allowedRoles: ['pharmacist', 'admin']
      });
    }

    // Soft delete by setting is_available to false
    const updatedDrug = await drugModel.update(drugId, { 
      is_available: false,
      updated_at: drugModel.db.fn.now()
    });

    if (!updatedDrug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    // Emit real-time update
    if (req.app.locals.io) {
      req.app.locals.io.emit('drugDeleted', {
        drugId,
        deletedBy: {
          id: req.user.id,
          name: req.user.name,
          role: userRole
        }
      });
    }

    res.json({ message: 'Drug deleted successfully' });
  } catch (err) {
    console.error('Delete drug error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Add stock to drug (Pharmacists only)
exports.addStock = async (req, res) => {
  try {
    const drugId = req.params.id;
    const { quantity } = req.body;
    const pharmacistId = req.user.id;
    const userRole = req.user.role;

    // Only pharmacists and admins can add stock
    if (!['pharmacist', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only pharmacists can add stock',
        allowedRoles: ['pharmacist', 'admin']
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const updatedDrug = await drugModel.addStock(drugId, parseInt(quantity), pharmacistId);

    // Emit real-time update
    if (req.app.locals.io) {
      req.app.locals.io.emit('stockAdded', {
        drug: updatedDrug,
        quantityAdded: quantity,
        addedBy: {
          id: pharmacistId,
          name: req.user.name,
          role: userRole
        }
      });
    }

    res.json({
      message: 'Stock added successfully',
      drug: updatedDrug,
      quantityAdded: quantity
    });
  } catch (err) {
    console.error('Add stock error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update stock (add or remove) - Pharmacists only
exports.updateStock = async (req, res) => {
  try {
    const drugId = req.params.id;
    const { quantity, operation } = req.body; // operation: 'add' or 'remove'
    const pharmacistId = req.user.id;
    const userRole = req.user.role;

    console.log('Stock update request:', { drugId, quantity, operation, pharmacistId });

    // Only pharmacists and admins can update stock
    if (!['pharmacist', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Only pharmacists can update stock',
        allowedRoles: ['pharmacist', 'admin']
      });
    }

    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      return res.status(400).json({ error: 'Valid positive quantity is required' });
    }

    if (!['add', 'remove'].includes(operation)) {
      return res.status(400).json({ error: 'Operation must be "add" or "remove"' });
    }

    const drug = await drugModel.findById(drugId);
    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    let newStock;
    if (operation === 'add') {
      newStock = drug.current_stock + parseInt(quantity);
    } else {
      newStock = Math.max(0, drug.current_stock - parseInt(quantity));
    }

    const updateData = { current_stock: newStock };
    const updatedDrug = await drugModel.updateDrug(drugId, updateData, pharmacistId);

    // Emit real-time update
    if (req.app.locals.io) {
      req.app.locals.io.emit('stockUpdated', {
        drug: updatedDrug,
        operation,
        quantity: parseInt(quantity),
        updatedBy: {
          id: pharmacistId,
          name: req.user.name,
          role: userRole
        }
      });
    }

    res.json({
      message: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`,
      drug: updatedDrug
    });
  } catch (err) {
    console.error('Update stock error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

// Get low stock drugs
exports.getLowStockDrugs = async (req, res) => {
  try {
    const lowStockDrugs = await drugModel.getLowStockDrugs();

    res.json({
      success: true,
      data: lowStockDrugs,
      count: lowStockDrugs.length
    });
  } catch (err) {
    console.error('Get low stock drugs error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get expiring drugs
exports.getExpiringDrugs = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const expiringDrugs = await drugModel.getExpiringDrugs(parseInt(days));

    res.json({
      drugs: expiringDrugs,
      count: expiringDrugs.length,
      withinDays: parseInt(days)
    });
  } catch (err) {
    console.error('Get expiring drugs error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get drug categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await drugModel.getCategories();
    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get drug manufacturers
exports.getManufacturers = async (req, res) => {
  try {
    const manufacturers = await drugModel.getManufacturers();
    res.json({ manufacturers });
  } catch (err) {
    console.error('Get manufacturers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get pharmacy dashboard statistics
exports.getPharmacyStats = async (req, res) => {
  try {
    const stats = await drugModel.getPharmacyStats();
    res.json({ stats });
  } catch (err) {
    console.error('Get pharmacy stats error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Check drug availability
exports.checkAvailability = async (req, res) => {
  try {
    const { drugId, quantity } = req.query;

    if (!drugId || !quantity) {
      return res.status(400).json({ 
        error: 'Drug ID and quantity are required' 
      });
    }

    const availability = await drugModel.checkAvailability(
      parseInt(drugId), 
      parseInt(quantity)
    );

    res.json(availability);
  } catch (err) {
    console.error('Check availability error:', err);
    res.status(500).json({ error: err.message });
  }
};
