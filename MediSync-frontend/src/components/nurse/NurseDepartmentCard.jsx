import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import departmentService from '../../services/departmentService';
import { toast } from 'react-hot-toast';

const NurseDepartmentCard = () => {
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDepartmentDetails = useCallback(async () => {
    if (!user?.department_id) return;

    try {
      setLoading(true);
      const response = await departmentService.getDepartmentById(user.department_id);
      setDepartment(response.data || response.department || response);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching department details:', error);
      toast.error('Failed to fetch department details');
    } finally {
      setLoading(false);
    }
  }, [user?.department_id]);

  useEffect(() => {
    fetchDepartmentDetails();
  }, [fetchDepartmentDetails]);

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getAvailabilityColor = (doctor) => {
    if (!doctor.availability || !doctor.availability.length) {
      return 'bg-gray-100 text-gray-800';
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    const isAvailable = doctor.availability.some(slot => 
      slot.day_of_week === currentDay &&
      slot.start_time <= currentTime &&
      slot.end_time >= currentTime &&
      slot.is_active
    );
    
    return isAvailable 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  if (!user?.department_id) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-gray-400 text-4xl mb-4">🏥</div>
          <p className="text-gray-600">No department assigned</p>
        </div>
      </Card>
    );
  }

  if (loading && !department) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-gray-400 text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Loading department details...</p>
        </div>
      </Card>
    );
  }

  if (!department) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-gray-400 text-4xl mb-4">❌</div>
          <p className="text-gray-600">Department not found</p>
          <Button onClick={fetchDepartmentDetails} className="mt-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Department</h2>
              <p className="text-sm text-gray-600">
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            <Button
              onClick={fetchDepartmentDetails}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Department Card */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="p-6">
          {/* Department Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{department.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{department.description}</p>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(department.is_active)}`}>
              {department.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Department Stats */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {department.doctors ? department.doctors.length : 0}
              </div>
              <div className="text-sm text-blue-800 mt-1">Doctors</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {department.nurses ? department.nurses.length : 0}
              </div>
              <div className="text-sm text-green-800 mt-1">Nurses</div>
            </div>
          </div>

          {/* Department Doctors */}
          {department.doctors && department.doctors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Available Doctors</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {department.doctors.map((doctor) => (
                  <div key={doctor.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">Dr. {doctor.name}</h5>
                        <p className="text-sm text-gray-600">{doctor.email}</p>
                        {doctor.phone && (
                          <p className="text-sm text-gray-600">📞 {doctor.phone}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getAvailabilityColor(doctor)}`}>
                        {getAvailabilityColor(doctor).includes('green') ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    
                    {/* Doctor Availability */}
                    {doctor.availability && doctor.availability.length > 0 && (
                      <div className="mt-3">
                        <h6 className="text-xs font-medium text-gray-700 mb-2">Schedule</h6>
                        <div className="text-xs text-gray-600 space-y-1">
                          {doctor.availability
                            .filter(slot => slot.is_active)
                            .map((slot, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="capitalize">{slot.day_of_week}</span>
                                <span>{slot.start_time} - {slot.end_time}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Nurses */}
          {department.nurses && department.nurses.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Department Nurses</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {department.nurses.map((nurse) => (
                  <div key={nurse.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{nurse.name}</h5>
                        <p className="text-sm text-gray-600">{nurse.email}</p>
                        {nurse.phone && (
                          <p className="text-sm text-gray-600">📞 {nurse.phone}</p>
                        )}
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {nurse.id === user.id ? 'You' : 'Nurse'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NurseDepartmentCard;
