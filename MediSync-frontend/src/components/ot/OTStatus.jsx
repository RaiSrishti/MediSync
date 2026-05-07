import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import otService from '../../services/otService';
import Button from '../common/Button';
import Card from '../common/Card';

const OTStatus = () => {
  const [ots, setOTs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOTData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchOTData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOTData = async () => {
    setIsLoading(true);
    try {
      const [otsResponse, schedulesResponse] = await Promise.all([
        otService.getAllOTs(),
        otService.getOTSchedules()
      ]);
      setOTs(otsResponse.ots || []);
      setSchedules(schedulesResponse.schedules || []);
    } catch {
      toast.error('Failed to fetch OT data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (otId, newStatus) => {
    try {
      await otService.updateOTStatus(otId, newStatus);
      toast.success('OT status updated');
      fetchOTData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEmergency = async (otId) => {
    try {
      await otService.triggerEmergency(otId, {
        alertType: 'manual',
        message: 'Emergency protocol activated manually'
      });
      toast.success('Emergency protocol activated');
      fetchOTData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to trigger emergency');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'status-online';
      case 'occupied': return 'status-busy';
      case 'maintenance': return 'status-maintenance';
      case 'emergency': return 'status-offline emergency-alert';
      default: return 'status-maintenance';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return (
          <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
        );
      case 'occupied':
        return (
          <svg className="w-5 h-5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
        );
      case 'emergency':
        return (
          <svg className="w-5 h-5 text-danger-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
        );
    }
  };

  if (isLoading && ots.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading OT status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card 
        title="Operation Theatre Status Board" 
        actions={
          <Button onClick={fetchOTData} variant="secondary" size="sm">
            Refresh
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ots.map((ot) => {
            const currentSchedule = schedules.find(s => 
              s.otId === ot.id && 
              new Date(s.scheduledDate).toDateString() === new Date().toDateString()
            );

            return (
              <div
                key={ot.id}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ${getStatusColor(ot.status)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{ot.name}</h3>
                  {getStatusIcon(ot.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <span className="font-medium">Location:</span> {ot.location}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Equipment:</span> {ot.equipment}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> 
                    <span className="ml-1 capitalize font-medium">{ot.status}</span>
                  </p>
                </div>

                {currentSchedule && (
                  <div className="bg-white bg-opacity-50 p-3 rounded mb-4">
                    <p className="text-sm font-medium">Current Schedule:</p>
                    <p className="text-sm">{currentSchedule.patientName}</p>
                    <p className="text-sm">{currentSchedule.procedure}</p>
                    <p className="text-sm">
                      {new Date(currentSchedule.startTime).toLocaleTimeString()} - 
                      {new Date(currentSchedule.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <select
                    value={ot.status}
                    onChange={(e) => handleStatusUpdate(ot.id, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleEmergency(ot.id)}
                    className="whitespace-nowrap"
                  >
                    Emergency
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {ots.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No operation theatres found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OTStatus;
