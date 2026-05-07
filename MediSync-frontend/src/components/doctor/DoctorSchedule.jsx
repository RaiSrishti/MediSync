import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import otService from '../../services/otService';
import { toast } from 'react-hot-toast';

const DoctorSchedule = () => {
  const { user } = useAuth();
  const [assignedOTs, setAssignedOTs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedOTs = useCallback(async () => {
    try {
      if (!user) {
        return;
      }
      
      const response = await otService.getAssignedOTs();
      setAssignedOTs(response.data || []);
    } catch (error) {
      console.error('Error fetching assigned OTs:', error);
      toast.error('Failed to fetch assigned OTs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleCompleteOT = async (otId, otNumber) => {
    if (window.confirm(`Are you sure you want to mark OT ${otNumber} as completed? This will make it available for other procedures.`)) {
      try {
        // Use the specific complete endpoint for doctors
        await otService.completeOT(otId);
        
        toast.success(`OT ${otNumber} marked as completed and is now available`);
        
        // Refresh the assigned OTs list
        fetchAssignedOTs();
      } catch (error) {
        console.error('Error completing OT:', error);
        toast.error('Failed to complete OT');
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchAssignedOTs();
    }
  }, [user, fetchAssignedOTs]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (time) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your schedule...</p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">Dr. {user.name}</p>
          )}
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-600">Please log in to view your schedule.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assigned OTs Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Operation Theatres</h2>
            {user && (
              <div className="text-sm text-gray-600">
                Dr. {user.name} - {user.departmentName || 'Department'}
              </div>
            )}
          </div>
          {assignedOTs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No operation theatres assigned to you currently.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedOTs.map((ot) => (
                <div key={ot.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">OT {ot.ot_number}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ot.status === 'available' ? 'bg-green-100 text-green-800' :
                      ot.status === 'busy' || ot.status === 'in-use' ? 'bg-red-100 text-red-800' :
                      ot.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ot.status}
                    </span>
                  </div>
                  
                  {ot.assignment_date && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Assigned Date:</strong> {formatDate(ot.assignment_date)}
                    </p>
                  )}
                  
                  {ot.assignment_time && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Assigned Time:</strong> {formatTime(ot.assignment_time)}
                    </p>
                  )}
                  
                  {ot.procedure_name && (
                    <p className="text-sm text-gray-600 mb-2">
                      Current: {ot.procedure_name}
                    </p>
                  )}
                  
                  {ot.patient_name && (
                    <p className="text-sm text-gray-600 mb-2">
                      Patient: {ot.patient_name}
                    </p>
                  )}
                  
                  {ot.scheduled_start_time && (
                    <p className="text-sm text-gray-600 mb-3">
                      Started: {formatDateTime(ot.scheduled_start_time)}
                    </p>
                  )}
                  
                  <div className="mt-4">
                    <Button
                      onClick={() => handleCompleteOT(ot.id, ot.ot_number)}
                      size="sm"
                      variant="primary"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Complete Operation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DoctorSchedule;
