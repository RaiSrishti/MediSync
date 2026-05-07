import React, { useState, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import pharmacyService from '../../services/pharmacyService';
import { toast } from 'react-hot-toast';

const PharmacistInventory = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [showEditDrugModal, setShowEditDrugModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);

  const fetchDrugs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getAllDrugs();
      setDrugs(response.data || []);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      toast.error('Failed to fetch drugs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrugs();
  }, [fetchDrugs]);

  const handleCreateDrug = async (drugData) => {
    try {
      await pharmacyService.addDrug(drugData);
      toast.success('Drug added successfully');
      setShowAddDrugModal(false);
      fetchDrugs();
    } catch (error) {
      console.error('Error creating drug:', error);
      toast.error(error.response?.data?.error || 'Failed to add drug');
    }
  };

  const handleUpdateDrug = async (drugData) => {
    try {
      await pharmacyService.updateDrug(selectedDrug.id, drugData);
      toast.success('Drug updated successfully');
      setShowEditDrugModal(false);
      setSelectedDrug(null);
      fetchDrugs();
    } catch (error) {
      console.error('Error updating drug:', error);
      toast.error('Failed to update drug');
    }
  };

  const handleDeleteDrug = async (drugId, drugName) => {
    if (window.confirm(`Are you sure you want to delete ${drugName}? This action cannot be undone.`)) {
      try {
        await pharmacyService.deleteDrug(drugId);
        toast.success('Drug deleted successfully');
        fetchDrugs();
      } catch (error) {
        console.error('Error deleting drug:', error);
        toast.error('Failed to delete drug');
      }
    }
  };

  const handleUpdateStock = async (drugId, quantity, operation) => {
    try {
      await pharmacyService.updateStock(drugId, quantity, operation);
      toast.success('Stock updated successfully');
      fetchDrugs();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || drug.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(drugs.map(drug => drug.category).filter(Boolean))];

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pharmacy inventory...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pharmacy Inventory</h2>
            <Button 
              onClick={() => setShowAddDrugModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Drug
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search drugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {filteredDrugs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No drugs found. Add your first drug!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrugs.map((drug) => (
                <div key={drug.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{drug.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDrug(drug);
                          setShowEditDrugModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDrug(drug.id, drug.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">Generic: {drug.generic_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mb-1">Category: {drug.category}</p>
                  
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Stock: </span>
                    <span className={`font-medium ${
                      drug.current_stock <= drug.minimum_stock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {drug.current_stock} {drug.unit}
                    </span>
                    {drug.current_stock <= drug.minimum_stock && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">Price: ₹{drug.unit_price}</p>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        const quantity = prompt('Enter quantity to add:');
                        if (quantity && !isNaN(quantity)) {
                          handleUpdateStock(drug.id, parseInt(quantity), 'add');
                        }
                      }}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Add Stock
                    </button>
                    <button
                      onClick={() => {
                        const quantity = prompt('Enter quantity to remove:');
                        if (quantity && !isNaN(quantity)) {
                          handleUpdateStock(drug.id, parseInt(quantity), 'remove');
                        }
                      }}
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Remove Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add Drug Modal */}
      <DrugModal
        isOpen={showAddDrugModal}
        onClose={() => setShowAddDrugModal(false)}
        onSubmit={handleCreateDrug}
        title="Add Drug"
      />

      {/* Edit Drug Modal */}
      <DrugModal
        isOpen={showEditDrugModal}
        onClose={() => {
          setShowEditDrugModal(false);
          setSelectedDrug(null);
        }}
        onSubmit={handleUpdateDrug}
        title="Edit Drug"
        initialData={selectedDrug}
      />
    </div>
  );
};

// Drug Modal Component (reused from AdminPage)
const DrugModal = ({ isOpen, onClose, onSubmit, title, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: '',
    description: '',
    unit: 'tablets',
    unit_price: '',
    current_stock: '',
    minimum_stock: '',
    expiry_date: '',
    manufacturer: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        generic_name: initialData.generic_name || '',
        category: initialData.category || '',
        description: initialData.description || '',
        unit: initialData.unit || 'tablets',
        unit_price: initialData.unit_price || '',
        current_stock: initialData.current_stock || '',
        minimum_stock: initialData.minimum_stock || '',
        expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '',
        manufacturer: initialData.manufacturer || ''
      });
    } else {
      setFormData({
        name: '',
        generic_name: '',
        category: '',
        description: '',
        unit: 'tablets',
        unit_price: '',
        current_stock: '',
        minimum_stock: '',
        expiry_date: '',
        manufacturer: ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category.trim()) {
      toast.error('Drug name and category are required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drug Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter drug name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generic Name
              </label>
              <input
                type="text"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter generic name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dosage"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tablets">Tablets</option>
                <option value="capsules">Capsules</option>
                <option value="ml">ML</option>
                <option value="mg">MG</option>
                <option value="bottles">Bottles</option>
                <option value="strips">Strips</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stock
              </label>
              <input
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current stock"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Level
              </label>
              <input
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter minimum stock level"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manufacturer"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
              rows={3}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PharmacistInventory;
