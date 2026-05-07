import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import otService from '../../services/otService';
import { toast } from 'react-hot-toast';

const OTStatusBoard = () => {
  const [otList, setOtList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOTStatus = async () => {
    try {
      setLoading(true);
      const response = await otService.getStatusBoard();
      // Filter to show only general status (no sensitive details)
      const publicOtData = (response.data || []).map(ot => ({
        id: ot.id,
        name: ot.name,
        status: ot.status,
        equipment: ot.equipment,
        // Don't show patient names or doctor details for privacy
        has_operation: ot.status === 'occupied',
        estimated_completion: ot.estimated_completion
      }));
      setOtList(publicOtData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching OT status:', error);
      toast.error('Failed to fetch OT status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTStatus();
    
    // Auto-refresh every 60 seconds (less frequent for patients)
    const interval = setInterval(fetchOTStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'occupied':
        return '🔴';
      case 'available':
        return '🟢';
      case 'maintenance':
        return '🟡';
      case 'emergency':
        return '🟠';
      default:
        return '⚪';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'occupied':
        return 'Operation in progress';
      case 'available':
        return 'Available for operations';
      case 'maintenance':
        return 'Under maintenance';
      case 'emergency':
        return 'Emergency operation';
      default:
        return 'Status unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Operation Theatre Status</h2>
              <p className="text-sm text-gray-600">
                General status information - Updated {lastUpdated && lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <Button
              onClick={fetchOTStatus}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {otList.filter(ot => ot.status === 'available').length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </Card>

        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {otList.filter(ot => ot.status === 'occupied').length}
            </div>
            <div className="text-sm text-gray-600">In Use</div>
          </div>
        </Card>

        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {otList.filter(ot => ot.status === 'maintenance').length}
            </div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </div>
        </Card>

        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {otList.filter(ot => ot.status === 'emergency').length}
            </div>
            <div className="text-sm text-gray-600">Emergency</div>
          </div>
        </Card>
      </div>

      {/* OT Status Grid */}
      {loading && otList.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading OT status...</p>
          </div>
        </Card>
      ) : otList.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏥</div>
            <p className="text-gray-500">No operation theatre information available.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otList.map((ot) => (
            <Card key={ot.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {ot.name || `OT ${ot.id}`}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ot.status)}`}>
                    <span className="mr-1">{getStatusIcon(ot.status)}</span>
                    {ot.status?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {getStatusDescription(ot.status)}
                    </p>
                    
                    {ot.has_operation && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ⚕️ Surgery currently in progress
                        </p>
                        {ot.estimated_completion && (
                          <p className="text-xs text-blue-600 mt-1">
                            Expected completion: {new Date(ot.estimated_completion).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    )}

                    {ot.status === 'maintenance' && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          🔧 Maintenance in progress
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Temporarily unavailable
                        </p>
                      </div>
                    )}

                    {ot.status === 'emergency' && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-red-800">
                          🚨 Emergency operation in progress
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Priority surgery underway
                        </p>
                      </div>
                    )}

                    {ot.status === 'available' && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✅ Ready for next operation
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Equipment Info (if available) */}
                  {ot.equipment && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1 text-sm">Available Equipment</h4>
                      <div className="flex flex-wrap gap-1">
                        {ot.equipment.split(',').slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600"
                          >
                            {item.trim()}
                          </span>
                        ))}
                        {ot.equipment.split(',').length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{ot.equipment.split(',').length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Information Note */}
      <Card>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-blue-500 text-xl mr-3">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Information Note</p>
              <p>
                This board shows general operation theatre availability for your information. 
                For specific appointment details or emergency situations, please contact hospital staff directly.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OTStatusBoard;
