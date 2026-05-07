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
      setOtList(response.data || []);
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
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOTStatus, 30000);
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

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
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
            <p className="text-gray-500">No operation theatres found.</p>
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
                  {/* Current Operation Info */}
                  {ot.status === 'occupied' && ot.current_operation && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Current Operation</h4>
                      <div className="text-sm text-blue-800">
                        <p><strong>Patient:</strong> {ot.current_operation.patient_name || 'N/A'}</p>
                        <p><strong>Doctor:</strong> {ot.current_operation.doctor_name || 'N/A'}</p>
                        <p><strong>Started:</strong> {formatTime(ot.current_operation.start_time)}</p>
                        {ot.current_operation.estimated_duration && (
                          <p><strong>Duration:</strong> {ot.current_operation.estimated_duration} mins</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Equipment Info */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Equipment</h4>
                    <div className="text-sm text-gray-600">
                      {ot.equipment ? (
                        <div className="flex flex-wrap gap-1">
                          {ot.equipment.split(',').map((item, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 px-2 py-1 rounded text-xs"
                            >
                              {item.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No equipment listed</p>
                      )}
                    </div>
                  </div>

                  {/* Next Schedule */}
                  {ot.next_schedule && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Next Scheduled</h4>
                      <div className="text-sm text-gray-600">
                        <p>{formatDate(ot.next_schedule.date)} at {formatTime(ot.next_schedule.time)}</p>
                        <p>{ot.next_schedule.doctor_name}</p>
                      </div>
                    </div>
                  )}

                  {/* Maintenance Info */}
                  {ot.status === 'maintenance' && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-1">Maintenance</h4>
                      <p className="text-sm text-yellow-800">
                        {ot.maintenance_reason || 'Under maintenance'}
                      </p>
                      {ot.maintenance_until && (
                        <p className="text-xs text-yellow-700 mt-1">
                          Until: {formatDate(ot.maintenance_until)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Emergency Info */}
                  {ot.status === 'emergency' && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-1">Emergency Operation</h4>
                      <p className="text-sm text-red-800">
                        Emergency procedure in progress
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons for Available OTs */}
                {ot.status === 'available' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-green-600 text-center">
                      ✅ Ready for next operation
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OTStatusBoard;
