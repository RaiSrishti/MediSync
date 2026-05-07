import React, { useState, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import pharmacyService from '../../services/pharmacyService';
import { toast } from 'react-hot-toast';

const LowStockDrugs = () => {
  const [lowStockDrugs, setLowStockDrugs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStockDrugs = useCallback(async () => {
    try {
      setLoading(true);
      // Get all drugs and filter for low stock
      const response = await pharmacyService.getAllDrugs();
      const allDrugs = response.data || [];
      const lowStock = allDrugs.filter(drug => 
        drug.current_stock <= drug.minimum_stock
      );
      setLowStockDrugs(lowStock);
    } catch (error) {
      console.error('Error fetching low stock drugs:', error);
      toast.error('Failed to fetch low stock drugs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStockDrugs();
  }, [fetchLowStockDrugs]);

  const handleUpdateStock = async (drugId, quantity, operation) => {
    try {
      await pharmacyService.updateStock(drugId, quantity, operation);
      toast.success('Stock updated successfully');
      fetchLowStockDrugs();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading low stock drugs...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Drugs</h2>
            <button
              onClick={fetchLowStockDrugs}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {lowStockDrugs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <p className="text-gray-500">Great! No drugs are currently low in stock.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-600 text-xl mr-3">⚠️</div>
                  <div>
                    <p className="text-red-800 font-medium">Low Stock Alert</p>
                    <p className="text-red-600 text-sm">
                      {lowStockDrugs.length} drug(s) need immediate restocking
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockDrugs.map((drug) => (
                  <div key={drug.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{drug.name}</h3>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Critical
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">Generic: {drug.generic_name || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-1">Category: {drug.category}</p>
                    
                    <div className="mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Stock:</span>
                        <span className="font-medium text-red-600">
                          {drug.current_stock} {drug.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Minimum Required:</span>
                        <span className="font-medium text-gray-900">
                          {drug.minimum_stock} {drug.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Shortage:</span>
                        <span className="font-medium text-red-600">
                          {Math.max(0, drug.minimum_stock - drug.current_stock)} {drug.unit}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">Price: ₹{drug.price_per_unit}</p>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          const quantity = prompt('Enter quantity to add:');
                          if (quantity && !isNaN(quantity)) {
                            handleUpdateStock(drug.id, parseInt(quantity), 'add');
                          }
                        }}
                        className="flex-1 text-xs bg-green-100 text-green-800 px-3 py-2 rounded hover:bg-green-200 transition-colors"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => {
                          const newMinimum = prompt('Set new minimum stock level:', drug.minimum_stock);
                          if (newMinimum && !isNaN(newMinimum)) {
                            // This would need a new API endpoint to update minimum stock level
                            toast('Feature coming soon: Update minimum stock level');
                          }
                        }}
                        className="flex-1 text-xs bg-blue-100 text-blue-800 px-3 py-2 rounded hover:bg-blue-200 transition-colors"
                      >
                        Set Min
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LowStockDrugs;
