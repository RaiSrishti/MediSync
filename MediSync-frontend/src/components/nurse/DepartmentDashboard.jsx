import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import patientService from '../../services/patientService';
import { toast } from 'react-hot-toast';

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const [departmentStats, setDepartmentStats] = useState(null);
  const [patientQueue, setPatientQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user.department_id) return;

    try {
      setLoading(true);
      
      // Fetch department details with staff
      const deptResponse = await patientService.getDepartmentDetails(user.department_id);
      setDepartmentStats(deptResponse.data);

      // Fetch department queue
      const queueResponse = await patientService.getDepartmentQueue(user.department_id);
      setPatientQueue(queueResponse.data || []);

      // Fetch department doctors
      const doctorsResponse = await patientService.getDepartmentDoctors(user.department_id);
      setDoctors(doctorsResponse.data || []);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user.department_id]);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDoctorStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-red-100 text-red-800';
      case 'break':
        return 'bg-yellow-100 text-yellow-800';
      case 'off_duty':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user.department_id) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Department Assigned</h3>
          <p className="text-gray-600">
            You are not assigned to any department. Please contact your administrator.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department Info Header */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {departmentStats?.name || 'Loading Department...'}
              </h2>
              <p className="text-sm text-gray-600">
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            <Button
              onClick={fetchDashboardData}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      {departmentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {patientQueue.filter(p => p.status === 'waiting').length}
              </div>
              <div className="text-sm text-gray-600">Waiting Patients</div>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {doctors.filter(d => d.status === 'available').length}
              </div>
              <div className="text-sm text-gray-600">Available Doctors</div>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {patientQueue.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {patientQueue.length}
              </div>
              <div className="text-sm text-gray-600">Total Tokens Today</div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctors Status */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctors Status</h3>
            
            {doctors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">👨‍⚕️</div>
                <p className="text-gray-500">No doctors found for this department</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Dr. {doctor.name}</h4>
                      <p className="text-sm text-gray-600">{doctor.specialization || 'General'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDoctorStatusColor(doctor.status)}`}>
                        {doctor.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                      </span>
                      {doctor.current_token && (
                        <p className="text-xs text-gray-500 mt-1">
                          Current: #{doctor.current_token}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Current Patient Queue */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Queue</h3>
            
            {patientQueue.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">👥</div>
                <p className="text-gray-500">No patients in queue</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {patientQueue.slice(0, 10).map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        #{patient.token_number} - {patient.patient_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Generated: {formatTime(patient.created_at)}
                      </p>
                      {patient.doctor_name && (
                        <p className="text-xs text-gray-500">
                          Doctor: {patient.doctor_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                        {patient.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      {patient.estimated_wait_time && (
                        <p className="text-xs text-gray-500 mt-1">
                          Wait: {patient.estimated_wait_time} min
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {patientQueue.length > 10 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Showing 10 of {patientQueue.length} patients
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          
          <div className="space-y-3">
            {patientQueue
              .filter(p => p.status === 'completed')
              .slice(0, 5)
              .map((patient) => (
                <div key={`completed-${patient.id}`} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-green-900">
                      #{patient.token_number} - {patient.patient_name}
                    </h4>
                    <p className="text-sm text-green-700">
                      Completed at {formatTime(patient.completed_at)}
                    </p>
                  </div>
                  <div className="text-green-600">
                    ✅ Completed
                  </div>
                </div>
              ))}

            {patientQueue.filter(p => p.status === 'completed').length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">No recent completed consultations</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DepartmentDashboard;
