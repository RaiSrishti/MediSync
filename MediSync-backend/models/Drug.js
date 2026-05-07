// models/Drug.js
const BaseModel = require('./BaseModel');

class Drug extends BaseModel {
  constructor() {
    super('drugs');
  }

  // Helper method to safely parse JSON fields
  static parseJsonField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'object') return field;
    try {
      return JSON.parse(field);
    } catch (error) {
      console.error('Error parsing JSON field:', error);
      return [];
    }
  }

  // Helper method to stringify JSON fields
  static stringifyJsonField(field) {
    if (!field) return JSON.stringify([]);
    if (typeof field === 'string') return field;
    return JSON.stringify(field);
  }

  // Add new drug (Pharmacists only)
  async addDrug(drugData, pharmacistId) {
    const data = {
      ...drugData,
      added_by: pharmacistId,
      created_at: this.db.fn.now(),
      updated_at: this.db.fn.now()
    };

    const result = await this.db(this.table).insert(data);
    const id = result[0];
    return this.findById(id);
  }

  // Update drug information
  async updateDrug(drugId, drugData, pharmacistId) {
    const updateData = {
      ...drugData,
      updated_at: this.db.fn.now()
    };

    await this.db(this.table).where('id', drugId).update(updateData);
    return this.findById(drugId);
  }

  // Search drugs by name, generic name, or category
  async searchDrugs(searchTerm, filters = {}) {
    let query = this.db(this.table)
      .select('*')
      .where('is_available', true);

    if (searchTerm) {
      query = query.where(function() {
        this.where('name', 'like', `%${searchTerm}%`)
          .orWhere('generic_name', 'like', `%${searchTerm}%`)
          .orWhere('category', 'like', `%${searchTerm}%`);
      });
    }

    // Apply filters
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    if (filters.manufacturer) {
      query = query.where('manufacturer', filters.manufacturer);
    }
    if (filters.in_stock) {
      query = query.where('current_stock', '>', 0);
    }
    if (filters.low_stock) {
      query = query.whereRaw('current_stock <= minimum_stock');
    }

    return query.orderBy('name', 'asc');
  }

  // Get drugs with low stock
  async getLowStockDrugs() {
    return this.db(this.table)
      .select('*')
      .whereRaw('current_stock <= minimum_stock')
      .where('is_available', true)
      .orderBy('current_stock', 'asc');
  }

  // Get drugs expiring soon
  async getExpiringDrugs(days = 30) {
    return this.db(this.table)
      .select('*')
      .where('expiry_date', '<=', this.db.raw(`DATE_ADD(CURDATE(), INTERVAL ${days} DAY)`))
      .where('is_available', true)
      .orderBy('expiry_date', 'asc');
  }

  // Dispense drug (reduce actual stock)
  async dispenseDrug(drugId, quantity) {
    const drug = await this.findById(drugId);
    if (!drug) throw new Error('Drug not found');

    if (drug.current_stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${drug.current_stock}, Required: ${quantity}`);
    }

    await this.db(this.table)
      .where('id', drugId)
      .update({
        current_stock: drug.current_stock - quantity,
        dispensed_today: drug.dispensed_today + quantity,
        updated_at: this.db.fn.now()
      });

    return this.findById(drugId);
  }

  // Add stock (when new inventory arrives)
  async addStock(drugId, quantity, pharmacistId) {
    const drug = await this.findById(drugId);
    if (!drug) throw new Error('Drug not found');

    await this.db(this.table)
      .where('id', drugId)
      .update({
        current_stock: drug.current_stock + quantity,
        updated_at: this.db.fn.now()
      });

    // Log stock addition (you might want to create a separate stock_movements table)
    return this.findById(drugId);
  }

  // Get drug categories
  async getCategories() {
    return this.db(this.table)
      .distinct('category')
      .where('is_available', true)
      .orderBy('category', 'asc')
      .pluck('category');
  }

  // Get drug manufacturers
  async getManufacturers() {
    return this.db(this.table)
      .distinct('manufacturer')
      .whereNotNull('manufacturer')
      .where('is_available', true)
      .orderBy('manufacturer', 'asc')
      .pluck('manufacturer');
  }

  // Get pharmacy dashboard statistics
  async getPharmacyStats() {
    const stats = await this.db(this.table)
      .select(
        this.db.raw('COUNT(*) as total_drugs'),
        this.db.raw('SUM(current_stock) as total_stock'),
        this.db.raw('SUM(dispensed_today) as dispensed_today'),
        this.db.raw('COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_count'),
        this.db.raw('COUNT(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as expiring_soon_count')
      )
      .where('is_available', true)
      .first();

    return stats;
  }

  // Check drug availability with stock info
  async checkAvailability(drugId, requiredQuantity) {
    const drug = await this.findById(drugId);
    if (!drug) return { available: false, reason: 'Drug not found' };

    if (!drug.is_available) {
      return { available: false, reason: 'Drug is discontinued' };
    }

    if (drug.current_stock < requiredQuantity) {
      return { 
        available: false, 
        reason: 'Insufficient stock',
        available_quantity: drug.current_stock,
        required_quantity: requiredQuantity
      };
    }

    return { 
      available: true, 
      available_quantity: drug.current_stock,
      drug: drug
    };
  }
}

module.exports = Drug;
