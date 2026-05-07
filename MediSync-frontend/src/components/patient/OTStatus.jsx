import React, { useState, useEffect } from 'react';
import patientService from '../../services/patientService';
import Card from '../common/Card';
import toast from 'react-hot-toast';

const OTStatus = () => {
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
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Operation Theatre Status
            </h1>
            <p className="text-gray-600">Current status of operation theatres</p>
          </div>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </Card>

      {/* Operation Theatres Status */}
      {otStatus && otStatus.theatres && (
        <Card title="Operation Theatres">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otStatus.theatres.map((theatre) => (
              <div key={theatre.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">
                    {theatre.name || `OT ${theatre.ot_number || theatre.id}`}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(theatre.status)}`}>
                    {theatre.status}
                  </span>
                </div>
                
                {theatre.currentSurgery && (
                  <div className="text-sm text-gray-600">
                    <div>Surgery: {theatre.currentSurgery.type}</div>
                    <div>Doctor: {theatre.currentSurgery.doctor}</div>
                    <div>Started: {new Date(theatre.currentSurgery.startTime).toLocaleTimeString()}</div>
                  </div>
                )}
                
                {theatre.nextScheduled && (
                  <div className="text-sm text-gray-500 mt-2">
                    <div>Next: {theatre.nextScheduled.type}</div>
                    <div>At: {new Date(theatre.nextScheduled.scheduledTime).toLocaleTimeString()}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Statistics */}
      {otStatus && (otStatus.summary || otStatus.theatres) && (
        <Card title="Theatre Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          </div>
        </Card>
      )}

      {/* General Information */}
      <Card title="General Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Hospital Contact</h4>
            <div className="text-sm text-gray-600">
              <div>Hospital Main: <span className="font-medium">+1-234-567-8900</span></div>
              <div>Information Desk: <span className="font-medium">+1-234-567-8902</span></div>
              <div>Patient Services: <span className="font-medium">+1-234-567-8903</span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Patient Guidelines</h4>
            <div className="text-sm text-gray-600">
              <div>• Scheduled surgeries as per appointment</div>
              <div>• Check with reception for updates</div>
              <div>• Follow all safety protocols</div>
              <div>• Visitors must register at front desk</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OTStatus;
