import React, { useState, useEffect } from 'react';
import patientService from '../../services/patientService';
import Card from '../common/Card';
import toast from 'react-hot-toast';

const DoctorOTStatus = () => {
  const [otStatus, setOtStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOTData();
  }, []);

  const loadOTData = async () => {
    try {
      const statusResponse = await patientService.getOTStatusBoard();
      setOtStatus(statusResponse);
    } catch (error) {
      console.error('Error loading OT data:', error);
      toast.error('Failed to load Operation Theatre information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-red-600 bg-red-100';
      case 'in-use': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'emergency': return 'text-orange-600 bg-orange-100';
      case 'cleaning': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const refreshData = () => {
    setLoading(true);
    loadOTData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading Operation Theatre information...</div>
          <div className="text-sm text-gray-500 mt-2">Fetching real-time theatre data</div>
        </div>
      </div>
    );
  }

  if (!otStatus) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <div className="text-lg text-gray-900 mb-2">No Theatre Data Available</div>
          <div className="text-gray-600 mb-4">Unable to load operation theatre information</div>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Operation Theatre Status
            </h1>
            <p className="text-gray-600">Real-time status of all operation theatres</p>
          </div>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </Card>

      {/* Summary Statistics */}
      {otStatus && (otStatus.summary || otStatus.theatres) && (
        <Card title="Theatre Summary">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {otStatus.summary?.totalOTs || otStatus.theatres?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Theatres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {otStatus.summary?.availableOTs || 
                 otStatus.theatres?.filter(t => t.status === 'available').length || 0}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {otStatus.summary?.inUseOTs || 
                 otStatus.theatres?.filter(t => t.status === 'busy' || t.status === 'in-use').length || 0}
              </div>
              <div className="text-sm text-gray-600">In Use</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {otStatus.summary?.maintenanceOTs || 
                 otStatus.theatres?.filter(t => t.status === 'maintenance').length || 0}
              </div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {otStatus.summary?.totalSchedulesToday || 0}
              </div>
              <div className="text-sm text-gray-600">Scheduled Today</div>
            </div>
          </div>
        </Card>
      )}

      {/* Operation Theatres Status */}
      {otStatus && otStatus.theatres && (
        <Card title="Operation Theatres">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otStatus.theatres.map((theatre) => (
              <div key={theatre.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">
                    {theatre.name || `OT ${theatre.ot_number || theatre.id}`}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(theatre.status)}`}>
                    {theatre.status}
                  </span>
                </div>
                
                {/* Current Surgery Info */}
                {theatre.currentSurgery && (
                  <div className="bg-red-50 p-3 rounded-md mb-3">
                    <div className="text-sm font-medium text-red-800 mb-1">Current Surgery</div>
                    <div className="text-sm text-red-700">
                      <div><strong>Type:</strong> {theatre.currentSurgery.type}</div>
                      <div><strong>Doctor:</strong> {theatre.currentSurgery.doctor}</div>
                      <div><strong>Patient:</strong> {theatre.currentSurgery.patient}</div>
                      <div><strong>Started:</strong> {new Date(theatre.currentSurgery.startTime).toLocaleTimeString()}</div>
                      {theatre.currentSurgery.estimatedDuration && (
                        <div><strong>Duration:</strong> {theatre.currentSurgery.estimatedDuration} mins</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Next Scheduled Surgery */}
                {theatre.nextScheduled && (
                  <div className="bg-blue-50 p-3 rounded-md mb-3">
                    <div className="text-sm font-medium text-blue-800 mb-1">Next Scheduled</div>
                    <div className="text-sm text-blue-700">
                      <div><strong>Type:</strong> {theatre.nextScheduled.type}</div>
                      <div><strong>Doctor:</strong> {theatre.nextScheduled.doctor}</div>
                      <div><strong>Patient:</strong> {theatre.nextScheduled.patient}</div>
                      <div><strong>Scheduled:</strong> {new Date(theatre.nextScheduled.scheduledTime).toLocaleTimeString()}</div>
                      {theatre.nextScheduled.estimatedDuration && (
                        <div><strong>Duration:</strong> {theatre.nextScheduled.estimatedDuration} mins</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Theatre Info */}
                <div className="text-sm text-gray-600">
                  {theatre.capacity && (
                    <div><strong>Capacity:</strong> {theatre.capacity} persons</div>
                  )}
                  {theatre.equipment && (
                    <div><strong>Equipment:</strong> {theatre.equipment}</div>
                  )}
                </div>
                
                {/* Available Theatre */}
                {!theatre.currentSurgery && !theatre.nextScheduled && theatre.status === 'available' && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-green-800">✅ Available for Scheduling</div>
                    <div className="text-xs text-green-600 mt-1">Ready for immediate use</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Today's Schedule Summary */}
      {otStatus && (otStatus.summary || otStatus.theatres) && (
        <Card title="Today's Schedule Overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {otStatus.summary?.completedToday || 0}
              </div>
              <div className="text-sm text-green-700">Completed Surgeries</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {otStatus.summary?.inProgressToday || 
                 otStatus.theatres?.filter(t => t.status === 'busy' || t.status === 'in-use').length || 0}
              </div>
              <div className="text-sm text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {otStatus.summary ? 
                  (otStatus.summary.totalSchedulesToday - otStatus.summary.completedToday - otStatus.summary.inProgressToday) :
                  0
                }
              </div>
              <div className="text-sm text-yellow-700">Pending Today</div>
            </div>
          </div>
        </Card>
      )}

      {/* Last Updated Info */}
      {otStatus && otStatus.lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(otStatus.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DoctorOTStatus;
