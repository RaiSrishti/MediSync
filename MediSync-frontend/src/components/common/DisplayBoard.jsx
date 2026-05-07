import React, { useState, useEffect, useCallback } from 'react';
import socketService from '../../services/socketService';
import Card from './Card';
import departmentService from '../../services/departmentService';
import tokenService from '../../services/tokenService';
// import authService from '../../services/authService';
import { toast } from 'react-hot-toast';

const DisplayBoard = () => {
  const [departments, setDepartments] = useState([]);
  const [departmentTokens, setDepartmentTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const fetchDepartmentsWithStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAllDepartments(true);
      setDepartments(response.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  }, []);

  const fetchCurrentTokens = useCallback(async () => {
    try {
      const updatedTokens = {};
      // Fetch tokens for each department and doctor combination
      const requests = [];
      departments.forEach(dept => {
        if (dept.doctors && dept.doctors.length > 0) {
          // Fetch tokens for each doctor in the department
          dept.doctors.forEach(doctor => {
            requests.push(
              tokenService.getDepartmentQueue(dept.id, doctor.id)
                .then(res => {
                  return { 
                    departmentId: dept.id, 
                    doctorId: doctor.id, 
                    tokens: res.queue || [] 
                  };
                })
                .catch(err => {
                  console.error(`[DisplayBoard] Error fetching tokens for dept ${dept.id}, doctor ${doctor.id}:`, err);
                  return { 
                    departmentId: dept.id, 
                    doctorId: doctor.id, 
                    tokens: [] 
                  };
                })
            );
          });
        } else {
          // If no doctors, fetch general department queue
          requests.push(
            tokenService.getDepartmentQueue(dept.id)
              .then(res => {
                return { 
                  departmentId: dept.id, 
                  doctorId: null, 
                  tokens: res.queue || [] 
                };
              })
              .catch(err => {
                console.error(`[DisplayBoard] Error fetching tokens for ${dept.id}:`, err);
                return { 
                  departmentId: dept.id, 
                  doctorId: null, 
                  tokens: [] 
                };
              })
          );
        }
      });

      const results = await Promise.allSettled(requests);
      
      results.forEach(result => {
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
        }
      });
      
      setDepartmentTokens(prev => ({ ...prev, ...updatedTokens }));
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to fetch token data');
    } finally {
      setLoading(false);
    }
  }, [departments]);

  // Socket connection and event listeners
  useEffect(() => {
    const initializeSocket = () => {
      if (!socketService.getSocket() || !socketService.isConnected) {
        socketService.connect();
      }

      const socket = socketService.getSocket();

      const handleSocketConnect = () => {
        setIsSocketConnected(true);
        fetchCurrentTokens();
      };

      const handleSocketDisconnect = (reason) => {
        setIsSocketConnected(false);
        
        // Auto-reconnect if not manually disconnected
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          setTimeout(() => {
            if (!socketService.isConnected) {
              socketService.connect();
            }
          }, 2000);
        }
      };

      const handleSocketError = (error) => {
        console.error('[DisplayBoard] Socket error:', error);
        setIsSocketConnected(false);
        setTimeout(() => {
          if (!socketService.isConnected) {
            socketService.connect();
          }
        }, 5000);
      };

      const handleRealtimeUpdate = (data) => {
        fetchCurrentTokens();
      };

      if (socket) {
        socket.on('connect', handleSocketConnect);
        socket.on('disconnect', handleSocketDisconnect);
        socket.on('connect_error', handleSocketError);
        socket.on('tokenStatusUpdated', handleRealtimeUpdate);
        socket.on('departmentUpdate', handleRealtimeUpdate);
        
        // Set initial connection state
        setIsSocketConnected(socket.connected);
      }

      return () => {
        if (socket) {
          socket.off('connect', handleSocketConnect);
          socket.off('disconnect', handleSocketDisconnect);
          socket.off('connect_error', handleSocketError);
          socket.off('tokenStatusUpdated', handleRealtimeUpdate);
          socket.off('departmentUpdate', handleRealtimeUpdate);
        }
      };
    };

    // Initialize socket
    const cleanup = initializeSocket();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check socket connection
        if (!socketService.isConnected) {
          socketService.connect();
        } else {
          // Update connection state based on actual socket status
          const socket = socketService.getSocket();
          if (socket) {
            setIsSocketConnected(socket.connected);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanup && cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchCurrentTokens, departments]);

  // Join department rooms only when departments change
  useEffect(() => {
    const socket = socketService.getSocket();
    if (departments && departments.length > 0 && socket) {
      departments.forEach(dept => {
        socket.emit('joinDepartment', dept.id);
        });
    }
  }, [departments]);

  // Initial data fetch
  useEffect(() => {
    fetchDepartmentsWithStaff();
  }, [fetchDepartmentsWithStaff]);

  // Refresh data when departments change
  useEffect(() => {
    if (departments.length > 0) {
      fetchCurrentTokens();
    }
  }, [departments, fetchCurrentTokens]);

  // Helper functions
  const getCurrentTokenForDoctor = (doctorId, departmentId) => {
    const doctorTokens = departmentTokens[departmentId]?.[doctorId] || [];
    const currentToken = doctorTokens.find(token => token.status === 'in-progress');
    return currentToken ? currentToken.token_number : '-';
  };

  const getDoctorStatus = (doctorId, departmentId) => {
    const doctorTokens = departmentTokens[departmentId]?.[doctorId] || [];
    const inProgress = doctorTokens.some(token => token.status === 'in-progress');
    return inProgress ? 'Busy' : 'Available';
  };

  const getWaitingCountForDoctor = (doctorId, departmentId) => {
    const doctorTokens = departmentTokens[departmentId]?.[doctorId] || [];
    return doctorTokens.filter(token => token.status === 'waiting').length;
  };

  const getWaitingCountForDepartment = (departmentId) => {
    const departmentData = departmentTokens[departmentId];
    if (!departmentData) return 0;
    
    let totalWaiting = 0;
    Object.values(departmentData).forEach(tokens => {
      if (Array.isArray(tokens)) {
        totalWaiting += tokens.filter(token => token.status === 'waiting').length;
      }
    });
    return totalWaiting;
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading display board...</p>
          {!isSocketConnected && (
            <p className="text-yellow-600 mt-2">Connecting to real-time updates...</p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Department Display Board</h2>
              <div className="flex items-center mt-1">
                <span className={`h-2 w-2 rounded-full mr-2 ${
                  isSocketConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-xs text-gray-500">
                  {isSocketConnected ? 'Live updates connected' : 'Disconnected - updates may be delayed'}
                </span>
              </div>
            </div>
            <button
              onClick={fetchCurrentTokens}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {departments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No departments found.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {departments.map((department) => (
                <div key={department.id} className="border border-gray-200 rounded-lg p-6">
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
                      {department.doctors.map((doctor) => (
                        <div key={doctor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-sm text-gray-600">{doctor.specialization || 'General'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Current Token</p>
                              <p className="text-lg font-bold text-blue-600">
                                {getCurrentTokenForDoctor(doctor.id, department.id)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Waiting</p>
                              <p className="text-lg font-bold text-orange-600">
                                {getWaitingCountForDoctor(doctor.id, department.id)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Status</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                getDoctorStatus(doctor.id, department.id) === 'Available'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {getDoctorStatus(doctor.id, department.id)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Tokens Today:</span>
                      <span className="font-medium">
                        {(() => {
                          const departmentData = departmentTokens[department.id];
                          if (!departmentData) return 0;
                          let total = 0;
                          Object.values(departmentData).forEach(tokens => {
                            if (Array.isArray(tokens)) total += tokens.length;
                          });
                          return total;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Currently Waiting:</span>
                      <span className="font-medium">
                        {getWaitingCountForDepartment(department.id)}
                      </span>
                    </div>
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

export default DisplayBoard;