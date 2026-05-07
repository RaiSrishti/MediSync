import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import departmentService from '../../services/departmentService';
import { toast } from 'react-hot-toast';

const DepartmentView = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAllDepartments(true);
      setDepartments(response.departments || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getAvailabilityColor = (doctor) => {
    const status = getAvailabilityStatus(doctor);
    switch (status) {
      case 'Available Now':
        return 'bg-green-100 text-green-800';
      case 'Off Hours':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Today':
        return 'bg-orange-100 text-orange-800';
      case 'No Schedule':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityStatus = (doctor) => {
    if (!doctor.availability || !doctor.availability.length) {
      return 'No Schedule';
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if doctor is available at current time
    const isCurrentlyAvailable = doctor.availability.some(slot => {
      if (!slot.is_active) return false;
      
      // Handle day matching
      const slotDay = slot.day_of_week.toLowerCase();
      const dayMatches = slotDay === currentDay || 
                        slotDay === currentDay.slice(0, 3) ||
                        currentDay.includes(slotDay) ||
                        slotDay.includes(currentDay.slice(0, 3));
      
      if (!dayMatches) return false;
      
      // Handle time comparison
      const startTime = slot.start_time.slice(0, 5);
      const endTime = slot.end_time.slice(0, 5);
      
      return currentTime >= startTime && currentTime <= endTime;
    });
    
    if (isCurrentlyAvailable) {
      return 'Available Now';
    }
    
    // Check if doctor has schedule for today but not currently available
    const hasScheduleToday = doctor.availability.some(slot => {
      const slotDay = slot.day_of_week.toLowerCase();
      return slot.is_active && (
        slotDay === currentDay || 
        slotDay === currentDay.slice(0, 3) ||
        currentDay.includes(slotDay) ||
        slotDay.includes(currentDay.slice(0, 3))
      );
    });
    
    return hasScheduleToday ? 'Off Hours' : 'Not Today';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Department Overview</h2>
              <p className="text-sm text-gray-600">
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            <Button
              onClick={fetchDepartments}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Departments Grid */}
      {loading && departments.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <div className="text-gray-400 text-2xl mb-2">⏳</div>
            <p className="text-gray-600">Loading departments...</p>
          </div>
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <div className="text-gray-400 text-4xl mb-4">🏥</div>
            <p className="text-gray-600">No departments found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <Card key={department.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                {/* Department Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-600">{department.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(department.is_active)}`}>
                    {department.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Department Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {department.doctors ? department.doctors.length : 0}
                    </div>
                    <div className="text-xs text-blue-800">Doctors</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {department.nurses ? department.nurses.length : 0}
                    </div>
                    <div className="text-xs text-green-800">Nurses</div>
                  </div>
                </div>

                {/* Available Doctors */}
                {department.doctors && department.doctors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Doctors</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {department.doctors.map((doctor) => (
                        <div key={doctor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Dr. {doctor.name}
                            </p>
                            <p className="text-xs text-gray-600">{doctor.email}</p>
                            {doctor.phone && (
                              <p className="text-xs text-gray-500">📞 {doctor.phone}</p>
                            )}
                            {/* Today's schedule - only show if doctor has availability */}
                            {doctor.availability && doctor.availability.length > 0 && (
                              <div className="mt-1">
                                {doctor.availability
                                  .filter(slot => {
                                    const now = new Date();
                                    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                    const slotDay = slot.day_of_week.toLowerCase();
                                    return slot.is_active && (
                                      slotDay === currentDay || 
                                      slotDay === currentDay.slice(0, 3) ||
                                      currentDay.includes(slotDay) ||
                                      slotDay.includes(currentDay.slice(0, 3))
                                    );
                                  })
                                  .slice(0, 1) // Show only first schedule for today
                                  .map((slot, index) => (
                                    <p key={index} className="text-xs text-blue-600">
                                      Today: {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                    </p>
                                  ))}
                              </div>
                            )}
                          </div>
                          {/* Show status only for doctors with schedules */}
                          {doctor.availability && doctor.availability.length > 0 && (
                            <span className={`px-2 py-1 text-xs rounded-full ${getAvailabilityColor(doctor)}`}>
                              {getAvailabilityStatus(doctor)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setSelectedDepartment(department)}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Department Detail Modal */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedDepartment.name} Department
                </h2>
                <Button
                  onClick={() => setSelectedDepartment(null)}
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doctors Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Doctors ({selectedDepartment.doctors ? selectedDepartment.doctors.length : 0})
                  </h3>
                  {selectedDepartment.doctors && selectedDepartment.doctors.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDepartment.doctors.map((doctor) => (
                        <div key={doctor.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Dr. {doctor.name}</h4>
                              <p className="text-sm text-gray-600">{doctor.email}</p>
                              {doctor.phone && (
                                <p className="text-sm text-gray-600">📞 {doctor.phone}</p>
                              )}
                              {doctor.specialization && (
                                <p className="text-sm text-blue-600">🩺 {doctor.specialization}</p>
                              )}
                            </div>
                            {/* Show status only for doctors with schedules */}
                            {doctor.availability && doctor.availability.length > 0 && (
                              <span className={`px-2 py-1 text-xs rounded-full ${getAvailabilityColor(doctor)}`}>
                                {getAvailabilityStatus(doctor)}
                              </span>
                            )}
                          </div>
                          
                          {/* Doctor Availability - only show if available */}
                          {doctor.availability && doctor.availability.length > 0 ? (
                            <div className="mt-3">
                              <h5 className="text-xs font-medium text-gray-700 mb-2">📅 Weekly Schedule</h5>
                              <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                                {doctor.availability
                                  .filter(slot => slot.is_active)
                                  .map((slot, index) => {
                                    const now = new Date();
                                    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                    const slotDay = slot.day_of_week.toLowerCase();
                                    const isToday = slotDay === currentDay || 
                                                   slotDay === currentDay.slice(0, 3) ||
                                                   currentDay.includes(slotDay) ||
                                                   slotDay.includes(currentDay.slice(0, 3));
                                    
                                    return (
                                      <div key={index} className={`flex justify-between p-1 rounded ${isToday ? 'bg-blue-50 text-blue-800 font-medium' : ''}`}>
                                        <span className="capitalize">
                                          {slot.day_of_week} {isToday ? '(Today)' : ''}
                                        </span>
                                        <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ) : null}

                          {/* Current Status Information */}
                          {doctor.availability && doctor.availability.length > 0 && (
                            <div className="mt-3 p-2 rounded text-center text-xs">
                              {getAvailabilityStatus(doctor) === 'Available Now' && (
                                <div className="bg-green-50 text-green-800 font-medium">
                                  ✅ Currently Available for Appointments
                                </div>
                              )}
                              {getAvailabilityStatus(doctor) === 'Off Hours' && (
                                <div className="bg-yellow-50 text-yellow-800">
                                  ⏰ Available later today - Check schedule above
                                </div>
                              )}
                              {getAvailabilityStatus(doctor) === 'Not Today' && (
                                <div className="bg-orange-50 text-orange-800">
                                  📅 Not available today - Check weekly schedule
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">No doctors assigned to this department</p>
                  )}
                </div>

                {/* Nurses Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Nurses ({selectedDepartment.nurses ? selectedDepartment.nurses.length : 0})
                  </h3>
                  {selectedDepartment.nurses && selectedDepartment.nurses.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDepartment.nurses.map((nurse) => (
                        <div key={nurse.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{nurse.name}</h4>
                              <p className="text-sm text-gray-600">{nurse.email}</p>
                              {nurse.phone && (
                                <p className="text-sm text-gray-600">📞 {nurse.phone}</p>
                              )}
                            </div>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              Nurse
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">No nurses assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentView;
