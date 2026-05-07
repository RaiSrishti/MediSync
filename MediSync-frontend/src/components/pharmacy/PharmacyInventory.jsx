import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../services/pharmacyService';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';

const PharmacyInventory = () => {
  const [drugs, setDrugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [stockOperation, setStockOperation] = useState({ quantity: '', operation: 'add' });

  const [newDrug, setNewDrug] = useState({
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    costPrice: '',
    sellingPrice: '',
    minStockLevel: '',
    currentStock: ''
  });

  const categories = [
    'Antibiotics',
    'Analgesics',
    'Cardiovascular',
    'Diabetes',
    'Respiratory',
    'Neurological',
    'Emergency',
    'Surgical',
    'Other'
  ];

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const response = await pharmacyService.getAllDrugs();
      setDrugs(response.drugs || []);
    } catch {
      toast.error('Failed to fetch drugs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDrug = async (e) => {
    e.preventDefault();
    try {
      await pharmacyService.addDrug(newDrug);
      toast.success('Drug added successfully');
      setShowAddModal(false);
      setNewDrug({
        name: '',
        description: '',
        category: '',
        manufacturer: '',
        batchNumber: '',
        expiryDate: '',
        costPrice: '',
        sellingPrice: '',
        minStockLevel: '',
        currentStock: ''
      });
      fetchDrugs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add drug');
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await pharmacyService.updateStock(
        selectedDrug.id,
        parseInt(stockOperation.quantity),
        stockOperation.operation
      );
      toast.success('Stock updated successfully');
      setShowStockModal(false);
      setStockOperation({ quantity: '', operation: 'add' });
      fetchDrugs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleDeleteDrug = async (drugId) => {
    if (window.confirm('Are you sure you want to delete this drug?')) {
      try {
        await pharmacyService.deleteDrug(drugId);
        toast.success('Drug deleted successfully');
        fetchDrugs();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete drug');
      }
    }
  };

  const getStockStatus = (drug) => {
    if (drug.currentStock <= drug.minStockLevel) {
      return { status: 'low', color: 'text-danger-600', bg: 'bg-danger-50' };
    } else if (drug.currentStock <= drug.minStockLevel * 2) {
      return { status: 'medium', color: 'text-warning-600', bg: 'bg-warning-50' };
    }
    return { status: 'good', color: 'text-success-600', bg: 'bg-success-50' };
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Expiring within 30 days
  };

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || drug.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Card 
        title="Pharmacy Inventory" 
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            Add Drug
          </Button>
        }
      >
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search drugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <Button onClick={fetchDrugs} variant="secondary">
            Refresh
          </Button>
        </div>

        {/* Inventory Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading inventory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drug Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrugs.map((drug) => {
                  const stockStatus = getStockStatus(drug);
                  const expiringSoon = isExpiringSoon(drug.expiryDate);
                  
                  return (
                    <tr key={drug.id} className={expiringSoon ? 'bg-warning-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{drug.name}</div>
                          <div className="text-sm text-gray-500">{drug.manufacturer}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drug.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${stockStatus.color}`}>
                          {drug.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drug.minStockLevel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drug.batchNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={expiringSoon ? 'text-warning-600 font-medium' : 'text-gray-900'}>
                          {new Date(drug.expiryDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{drug.sellingPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedDrug(drug);
                            setShowStockModal(true);
                          }}
                        >
                          Update Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteDrug(drug.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredDrugs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No drugs found</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add Drug Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Drug"
        size="lg"
      >
        <form onSubmit={handleAddDrug} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Drug Name *</label>
              <input
                type="text"
                value={newDrug.name}
                onChange={(e) => setNewDrug({...newDrug, name: e.target.value})}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                value={newDrug.category}
                onChange={(e) => setNewDrug({...newDrug, category: e.target.value})}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
              <input
                type="text"
                value={newDrug.manufacturer}
                onChange={(e) => setNewDrug({...newDrug, manufacturer: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Batch Number</label>
              <input
                type="text"
                value={newDrug.batchNumber}
                onChange={(e) => setNewDrug({...newDrug, batchNumber: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                type="date"
                value={newDrug.expiryDate}
                onChange={(e) => setNewDrug({...newDrug, expiryDate: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Stock</label>
              <input
                type="number"
                value={newDrug.currentStock}
                onChange={(e) => setNewDrug({...newDrug, currentStock: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
              <input
                type="number"
                value={newDrug.minStockLevel}
                onChange={(e) => setNewDrug({...newDrug, minStockLevel: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Price</label>
              <input
                type="number"
                step="0.01"
                value={newDrug.sellingPrice}
                onChange={(e) => setNewDrug({...newDrug, sellingPrice: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newDrug.description}
              onChange={(e) => setNewDrug({...newDrug, description: e.target.value})}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Drug</Button>
          </div>
        </form>
      </Modal>

      {/* Stock Update Modal */}
      <Modal 
        isOpen={showStockModal} 
        onClose={() => setShowStockModal(false)}
        title={`Update Stock - ${selectedDrug?.name}`}
        size="md"
      >
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Operation</label>
            <select
              value={stockOperation.operation}
              onChange={(e) => setStockOperation({...stockOperation, operation: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Remove Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              value={stockOperation.quantity}
              onChange={(e) => setStockOperation({...stockOperation, quantity: e.target.value})}
              required
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowStockModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Stock</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PharmacyInventory;
