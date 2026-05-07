import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import socketService from '../../services/socketService';
import Card from '../common/Card';
import departmentService from '../../services/departmentService';
import tokenService from '../../services/tokenService';
import { toast } from 'react-hot-toast';

const DepartmentDisplayBoard = () => {
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [departmentTokens, setDepartmentTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const fetchDepartmentWithStaff = useCallback(async () => {
    if (!user?.department_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use API directly with include_staff parameter since service doesn't support it
      const response = await departmentService.getAllDepartments(true);
      // Find the nurse's department from the list
      const departments = response.departments || [];
      const nurseDepartment = departments.find(dept => dept.id === user.department_id);
      
      if (nurseDepartment) {
        setDepartment(nurseDepartment);
      } else {
        console.error('[NurseDepartmentDisplayBoard] Nurse department not found');
        toast.error('Department not found');
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      toast.error('Failed to fetch department');
    }
  }, [user?.department_id]);

  const fetchCurrentTokens = useCallback(async () => {
    if (!department || !user?.department_id) {
      return;
    }

    try {
      const updatedTokens = {};
      // Fetch tokens for each doctor in the department
      const requests = [];
      if (department.doctors && department.doctors.length > 0) {
        department.doctors.forEach(doctor => {
          if (doctor && doctor.id) {
            requests.push(
              tokenService.getDepartmentQueue(department.id, doctor.id)
                .then(res => {
                  return { 
                    departmentId: department.id, 
                    doctorId: doctor.id, 
                    tokens: res.queue || [] 
                  };
                })
                .catch(err => {
                  console.error(`[NurseDepartmentDisplayBoard] Error fetching tokens for doctor ${doctor.id}:`, err);
                  return { 
                    departmentId: department.id, 
                    doctorId: doctor.id, 
                    tokens: [] 
                  };
                })
            );
          }
        });
      } else {
        // If no doctors, fetch general department queue
        requests.push(
          tokenService.getDepartmentQueue(department.id)
            .then(res => {
              return { 
                departmentId: department.id, 
                doctorId: null, 
                tokens: res.queue || [] 
              };
            })
            .catch(err => {
              console.error(`[NurseDepartmentDisplayBoard] Error fetching tokens for department ${department.id}:`, err);
              return { 
                departmentId: department.id, 
                doctorId: null, 
                tokens: [] 
              };
            })
        );
      }

      const results = await Promise.allSettled(requests);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { departmentId, doctorId, tokens } = result.value;
          if (!updatedTokens[departmentId]) {
            updatedTokens[departmentId] = {};
          }
          if (doctorId) {
            updatedTokens[departmentId][doctorId] = tokens;
            } else {
            updatedTokens[departmentId]['general'] = tokens;
            }
        } else {
          console.error(`[NurseDepartmentDisplayBoard] Request ${index} failed:`, result.reason);
        }
      });
      
      setDepartmentTokens(prev => {
        const newTokens = { ...prev, ...updatedTokens };
        return newTokens;
      });
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  }, [department, user?.department_id]);

  useEffect(() => {
    if (user?.department_id) {
      fetchDepartmentWithStaff();
    }
  }, [user?.department_id, fetchDepartmentWithStaff]);

  useEffect(() => {
    if (department) {
      fetchCurrentTokens();

      // Connect to socket.io for real-time updates only if not already connected
      if (!isSocketConnected) {
        socketService.connect();
        setIsSocketConnected(true);

        // Listen for token updates
        socketService.on('tokenUpdate', (data) => {
          if (data.department_id === user.department_id) {
            fetchCurrentTokens();
          }
        });

        socketService.on('tokenGenerated', (data) => {
          if (data.department_id === user.department_id) {
            fetchCurrentTokens();
          }
        });
      }

      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchCurrentTokens, 30000);

      return () => {
        clearInterval(interval);
        // Don't disconnect socket immediately - keep it connected for tab switching
        // Only cleanup listeners for this component
        socketService.off('tokenUpdate');
        socketService.off('tokenGenerated');
      };
    }
  }, [department, fetchCurrentTokens, user?.department_id, isSocketConnected]);

  // Cleanup socket connection when component unmounts completely
  useEffect(() => {
    return () => {
      if (isSocketConnected) {
        socketService.disconnect();
        setIsSocketConnected(false);
      }
    };
  }, [isSocketConnected]);

  // Helper functions
  const getCurrentTokenForDoctor = (doctorId) => {
    if (!department?.id || !doctorId) {
      return '-';
    }
    const doctorTokens = departmentTokens[department.id]?.[doctorId] || [];
    const currentToken = doctorTokens.find(token => token.status === 'in_progress' || token.status === 'in-progress');
    const tokenNumber = currentToken ? currentToken.token_number : '-';
    return tokenNumber;
  };

  const getDoctorStatus = (doctorId) => {
    if (!department?.id || !doctorId) {
      return 'Unknown';
    }
    const doctorTokens = departmentTokens[department.id]?.[doctorId] || [];
    const inProgress = doctorTokens.some(token => token.status === 'in_progress' || token.status === 'in-progress');
    return inProgress ? 'Busy' : 'Available';
  };

  const getWaitingCountForDoctor = (doctorId) => {
    if (!department?.id || !doctorId) {
      return 0;
    }
    const doctorTokens = departmentTokens[department.id]?.[doctorId] || [];
    return doctorTokens.filter(token => token.status === 'waiting').length;
  };

  const getWaitingCountForDepartment = () => {
    if (!department?.id) return 0;
    const departmentData = departmentTokens[department.id];
    if (!departmentData) return 0;
    
    let totalWaiting = 0;
    Object.values(departmentData).forEach(tokens => {
      totalWaiting += tokens.filter(token => token.status === 'waiting').length;
    });
    return totalWaiting;
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

  if (loading || !department) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-gray-400 text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Loading department display board...</p>
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
              <h2 className="text-lg font-semibold text-gray-900">
                {department.name} Department - Display Board
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-600">
                  Live Updates: {isSocketConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
                <p className="text-sm text-gray-600">
                  Total Waiting: {getWaitingCountForDepartment()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchDepartmentWithStaff();
                fetchCurrentTokens();
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </Card>

      {/* Department Display */}
      <Card>
        <div className="p-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
              <span className="text-sm text-gray-500">
                {department.doctors?.length || 0} Doctors
              </span>
            </div>
            
            {(!department.doctors || department.doctors.length === 0) ? (
              <p className="text-gray-500 text-center py-4">No doctors assigned</p>
            ) : (
              <div className="space-y-3">
                {department.doctors.map((doctor, index) => {
                  return (
                    <div key={doctor.id || `doctor-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doctor.name || 'Unknown Doctor'}</p>
                        <p className="text-sm text-gray-600">{doctor.specialization || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Current Token</p>
                          <p className="text-lg font-bold text-blue-600">
                            {getCurrentTokenForDoctor(doctor.id)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Waiting</p>
                          <p className="text-lg font-bold text-orange-600">
                            {getWaitingCountForDoctor(doctor.id)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getDoctorStatus(doctor.id) === 'Available'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getDoctorStatus(doctor.id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Department Status: <span className="font-medium">
                    {getWaitingCountForDepartment() === 0 ? 'No Waiting Patients' : `${getWaitingCountForDepartment()} Patients Waiting`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DepartmentDisplayBoard;
