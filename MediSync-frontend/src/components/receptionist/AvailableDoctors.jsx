import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import departmentService from '../../services/departmentService';
import { toast } from 'react-hot-toast';

const AvailableDoctors = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const getAvailabilityColor = (doctor) => {
    const status = getAvailabilityStatus(doctor);
    switch (status) {
      case 'Available Now':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Off Hours':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Not Today':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (doctor) => {
    const status = getAvailabilityStatus(doctor);
    switch (status) {
      case 'Available Now': return '🟢';
      case 'Off Hours': return '🟡';
      case 'Not Today': return '🟠';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Available Doctors</h2>
              <p className="text-sm text-gray-600">
                Real-time doctor availability for patient inquiries
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button
              onClick={fetchDepartments}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Departments with Available Doctors */}
      {loading && departments.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <div className="text-gray-400 text-2xl mb-2">⏳</div>
            <p className="text-gray-600">Loading available doctors...</p>
          </div>
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <div className="text-gray-400 text-4xl mb-4">👨‍⚕️</div>
            <p className="text-gray-600">No departments found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {departments
            .filter(dept => dept.doctors && dept.doctors.some(doctor => doctor.availability && doctor.availability.length > 0))
            .map((department) => (
            <Card key={department.id}>
              <div className="p-6">
                {/* Department Header */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-600">{department.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {department.doctors?.filter(doctor => doctor.availability && doctor.availability.length > 0).length || 0} doctors available
                    </div>
                    <div className="text-xs text-gray-400">
                      {department.doctors?.filter(doctor => getAvailabilityStatus(doctor) === 'Available Now').length || 0} currently available
                    </div>
                  </div>
                </div>

                {/* Available Doctors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {department.doctors
                    ?.filter(doctor => doctor.availability && doctor.availability.length > 0)
                    .map((doctor) => (
                    <div 
                      key={doctor.id} 
                      className={`p-4 border-2 rounded-lg transition-all ${getAvailabilityColor(doctor)}`}
                    >
                      {/* Doctor Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">Dr. {doctor.name}</h4>
                          <p className="text-sm text-gray-600">{doctor.email}</p>
                          {doctor.phone && (
                            <p className="text-sm text-gray-600">📞 {doctor.phone}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-lg">{getStatusIcon(doctor)}</span>
                          <span className="text-xs font-semibold">
                            {getAvailabilityStatus(doctor)}
                          </span>
                        </div>
                      </div>

                      {/* Today's Schedule */}
                      {doctor.availability && doctor.availability.length > 0 && (
                        <div className="mt-3 p-2 bg-white bg-opacity-50 rounded">
                          <h5 className="text-xs font-medium text-gray-700 mb-1">📅 Today's Schedule</h5>
                          <div className="text-xs text-gray-600 space-y-1">
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
                              .map((slot, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                                  <span className="capitalize">{slot.day_of_week}</span>
                                </div>
                              ))}
                            {doctor.availability.filter(slot => {
                              const now = new Date();
                              const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                              const slotDay = slot.day_of_week.toLowerCase();
                              return slot.is_active && (
                                slotDay === currentDay || 
                                slotDay === currentDay.slice(0, 3) ||
                                currentDay.includes(slotDay) ||
                                slotDay.includes(currentDay.slice(0, 3))
                              );
                            }).length === 0 && (
                              <div className="text-gray-500 italic">No schedule for today</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status-specific Information */}
                      {getAvailabilityStatus(doctor) === 'Available Now' && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-center">
                          <div className="text-xs text-green-800 font-medium">✅ Available for Appointments</div>
                        </div>
                      )}
                      
                      {getAvailabilityStatus(doctor) === 'Off Hours' && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-center">
                          <div className="text-xs text-yellow-800">⏰ Will be available later today</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* No Available Doctors Message */}
                {(!department.doctors || !department.doctors.some(doctor => doctor.availability && doctor.availability.length > 0)) && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-2xl mb-2">👨‍⚕️</div>
                    <p>No doctors with scheduled availability in this department</p>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* No Departments with Available Doctors */}
          {departments.filter(dept => dept.doctors && dept.doctors.some(doctor => doctor.availability && doctor.availability.length > 0)).length === 0 && (
            <Card>
              <div className="p-6 text-center">
                <div className="text-gray-400 text-4xl mb-4">👨‍⚕️</div>
                <p className="text-gray-600">No doctors with scheduled availability found</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quick Reference */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🟢</span>
              <span className="text-sm text-gray-700">Available Now</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🟡</span>
              <span className="text-sm text-gray-700">Off Hours (Today)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🟠</span>
              <span className="text-sm text-gray-700">Not Available Today</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚪</span>
              <span className="text-sm text-gray-700">No Schedule</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AvailableDoctors;
