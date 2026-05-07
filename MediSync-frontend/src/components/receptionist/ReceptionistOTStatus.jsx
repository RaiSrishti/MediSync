import React, { useState, useEffect } from 'react';
import patientService from '../../services/patientService';
import Card from '../common/Card';
import toast from 'react-hot-toast';

const ReceptionistOTStatus = () => {
  const [otStatus, setOtStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOTData();
    // Auto-refresh every 30 seconds for receptionists
    const interval = setInterval(loadOTData, 30000);
    return () => clearInterval(interval);
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
      case 'available': return 'text-green-600 bg-green-100 border-green-200';
      case 'busy': return 'text-red-600 bg-red-100 border-red-200';
      case 'in-use': return 'text-red-600 bg-red-100 border-red-200';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'emergency': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'cleaning': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '✅';
      case 'busy': return '🔴';
      case 'in-use': return '🔴';
      case 'maintenance': return '🔧';
      case 'emergency': return '🚨';
      case 'cleaning': return '🧽';
      default: return '⚪';
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-lg">Loading Operation Theatre Status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Auto-refresh */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Operation Theatre Status
            </h1>
            <p className="text-gray-600">Real-time monitoring for reception desk</p>
            <div className="text-xs text-gray-500 mt-1">
              🔄 Auto-refreshes every 30 seconds
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Now
            </button>
            <div className="text-xs text-gray-500">
              Last updated: {otStatus?.lastUpdated ? new Date(otStatus.lastUpdated).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Status Overview */}
      {otStatus ? (
        <Card title="Quick Overview">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{otStatus.summary?.totalOTs || otStatus.theatres?.length || 0}</div>
              <div className="text-xs text-blue-700">Total OTs</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {otStatus.summary?.availableOTs || otStatus.theatres?.filter(t => t.status === 'available').length || 0}
              </div>
              <div className="text-xs text-green-700">Available</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {otStatus.summary?.inUseOTs || otStatus.theatres?.filter(t => t.status === 'busy' || t.status === 'in-use').length || 0}
              </div>
              <div className="text-xs text-red-700">In Use</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {otStatus.summary?.maintenanceOTs || otStatus.theatres?.filter(t => t.status === 'maintenance').length || 0}
              </div>
              <div className="text-xs text-yellow-700">Maintenance</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{otStatus.summary?.totalSchedulesToday || 0}</div>
              <div className="text-xs text-purple-700">Today's Total</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-600">{otStatus.summary?.inProgressToday || 0}</div>
              <div className="text-xs text-indigo-700">In Progress</div>
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Quick Overview">
          <div className="text-center py-4 text-gray-500">Loading overview data...</div>
        </Card>
      )}

      {/* Operation Theatres Grid */}
      {otStatus && otStatus.theatres && (
        <Card title="Operation Theatres Status">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otStatus.theatres.map((theatre) => (
              <div 
                key={theatre.id} 
                className={`p-4 border-2 rounded-lg transition-all hover:shadow-lg ${getStatusColor(theatre.status)}`}
              >
                {/* Theatre Header */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">
                    {theatre.name || `OT ${theatre.ot_number || theatre.id}`}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">{getStatusIcon(theatre.status)}</span>
                    <span className="text-xs font-semibold uppercase">
                      {theatre.status}
                    </span>
                  </div>
                </div>
                
                {/* Current Activity */}
                {theatre.currentSurgery ? (
                  <div className="mb-3 p-2 bg-white bg-opacity-50 rounded">
                    <div className="text-xs font-semibold text-red-800 mb-1">🔴 CURRENT SURGERY</div>
                    <div className="text-sm">
                      <div className="font-medium">{theatre.currentSurgery.type}</div>
                      <div className="text-xs">Dr. {theatre.currentSurgery.doctor}</div>
                      <div className="text-xs">Patient: {theatre.currentSurgery.patient}</div>
                      <div className="text-xs">
                        Started: {new Date(theatre.currentSurgery.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-2 bg-white bg-opacity-50 rounded">
                    <div className="text-xs text-gray-600">
                      {theatre.status === 'available' ? '✅ Ready for scheduling' : 
                       theatre.status === 'maintenance' ? '🔧 Under maintenance' :
                       theatre.status === 'cleaning' ? '🧽 Being cleaned' :
                       'No current activity'}
                    </div>
                  </div>
                )}
                
                {/* Next Scheduled */}
                {theatre.nextScheduled && (
                  <div className="p-2 bg-white bg-opacity-30 rounded">
                    <div className="text-xs font-semibold text-blue-800 mb-1">📅 NEXT SCHEDULED</div>
                    <div className="text-xs">
                      <div className="font-medium">{theatre.nextScheduled.type}</div>
                      <div>Dr. {theatre.nextScheduled.doctor}</div>
                      <div>At: {new Date(theatre.nextScheduled.scheduledTime).toLocaleTimeString()}</div>
                    </div>
                  </div>
                )}
                
                {/* Theatre Info */}
                <div className="mt-2 text-xs text-gray-700">
                  {theatre.capacity && <div>👥 Capacity: {theatre.capacity}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Today's Activity Summary */}
      {otStatus && otStatus.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Today's Surgery Statistics">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm font-medium">✅ Completed Surgeries</span>
                <span className="text-lg font-bold text-green-600">{otStatus.summary.completedToday}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm font-medium">🔄 Currently In Progress</span>
                <span className="text-lg font-bold text-blue-600">{otStatus.summary.inProgressToday}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span className="text-sm font-medium">⏳ Remaining Today</span>
                <span className="text-lg font-bold text-yellow-600">
                  {otStatus.summary.totalSchedulesToday - otStatus.summary.completedToday - otStatus.summary.inProgressToday}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Reception Information">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded">
                <div className="font-semibold text-blue-800 mb-1">📞 Emergency Contact</div>
                <div className="text-blue-700">
                  <div>OT Emergency: <span className="font-medium">Ext. 911</span></div>
                  <div>Nursing Station: <span className="font-medium">Ext. 245</span></div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded">
                <div className="font-semibold text-green-800 mb-1">ℹ️ For Patients & Visitors</div>
                <div className="text-green-700 text-xs">
                  <div>• Surgery schedules may change</div>
                  <div>• Check with reception for updates</div>
                  <div>• Visiting hours: 2:00 PM - 8:00 PM</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReceptionistOTStatus;
