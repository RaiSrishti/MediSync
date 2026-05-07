import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { pharmacyService } from '../../services/pharmacyService';

const PharmacyInventory = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'out-of-stock'

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await pharmacyService.getAllDrugs();
      
      // Backend returns drugs in response.data
      const drugsData = response.data || response.drugs || response || [];
      
      setDrugs(Array.isArray(drugsData) ? drugsData : []);
      setFilter('all');
    } catch (error) {
      console.error('Error fetching drugs:', error);
      setError(`Failed to load pharmacy inventory: ${error.message}`);
      setDrugs([]); // Ensure drugs is always an array
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDrugs = () => {
    // Ensure drugs is always an array
    if (!Array.isArray(drugs)) {
      return [];
    }

    let filtered = drugs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(drug =>
        drug.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply stock filter for client-side filtering
    if (filter === 'out-of-stock') {
      filtered = filtered.filter(drug => {
        return drug.current_stock === 0;
      });
    }

    return filtered;
  };

  const getStockStatus = (drug) => {
    if (drug.current_stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const filteredDrugs = getFilteredDrugs();

  if (loading) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Loading pharmacy inventory...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <div className="text-red-600 mb-2">Error Loading Inventory</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <Button onClick={fetchDrugs} variant="primary">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Pharmacy Inventory">
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search drugs by name, manufacturer, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'primary' : 'secondary'}
              >
                All Drugs
              </Button>
              <Button 
                onClick={() => setFilter('out-of-stock')}
                variant={filter === 'out-of-stock' ? 'primary' : 'secondary'}
              >
                Out of Stock
              </Button>
              <Button onClick={fetchDrugs} variant="secondary">
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{Array.isArray(drugs) ? drugs.length : 0}</div>
                <div className="text-sm text-gray-600">Total Drugs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Array.isArray(drugs) ? drugs.filter(d => d.current_stock > 0).length : 0}
                </div>
                <div className="text-sm text-gray-600">In Stock</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {Array.isArray(drugs) ? drugs.filter(d => d.current_stock === 0).length : 0}
                </div>
                <div className="text-sm text-gray-600">Out of Stock</div>
              </div>
            </div>
          </div>

          {/* Drug List */}
          {filteredDrugs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">💊</div>
              <div className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'No drugs found matching your criteria' 
                  : 'No drugs available in inventory'}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDrugs.map((drug) => {
                const stockStatus = getStockStatus(drug);
                return (
                  <div
                    key={drug.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {drug.name || 'Unknown Drug'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Manufacturer:</span> {drug.manufacturer || 'N/A'}</p>
                      <p><span className="font-medium">Category:</span> {drug.category || 'N/A'}</p>
                      <p><span className="font-medium">Stock:</span> {drug.current_stock || 0} {drug.unit || 'units'}</p>
                      <p><span className="font-medium">Price:</span> ₹{drug.unit_price || 0}</p>
                      {drug.minimum_stock && (
                        <p><span className="font-medium">Minimum Stock:</span> {drug.minimum_stock}</p>
                      )}
                      {drug.expiry_date && (
                        <p><span className="font-medium">Expires:</span> {new Date(drug.expiry_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    {drug.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {drug.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PharmacyInventory;
