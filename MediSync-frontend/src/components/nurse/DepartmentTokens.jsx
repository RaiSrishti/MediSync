import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import socketService from '../../services/socketService';
import Card from '../common/Card';
import departmentService from '../../services/departmentService';
import tokenService from '../../services/tokenService';
import { toast } from 'react-hot-toast';

const DepartmentTokens = () => {
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // all, waiting, in_progress

  const fetchDepartmentWithStaff = useCallback(async () => {
    if (!user?.department_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await departmentService.getAllDepartments(true);
      // Find the nurse's department from the list
      const departments = response.departments || [];
      const nurseDepartment = departments.find(dept => dept.id === user.department_id);
      
      if (nurseDepartment) {
        setDepartment(nurseDepartment);
      } else {
        console.error('[DepartmentTokens] Nurse department not found');
        toast.error('Department not found');
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      toast.error('Failed to fetch department');
    }
  }, [user?.department_id]);

  const fetchTokens = useCallback(async () => {
    if (!department || !user?.department_id) {
      return;
    }

    try {
      const allTokens = [];
      // Fetch tokens for each doctor in the department
      if (department.doctors && department.doctors.length > 0) {
        const requests = department.doctors.map(async (doctor) => {
          if (doctor && doctor.id) {
            try {
              const res = await tokenService.getDepartmentQueue(department.id, doctor.id);
              // Add doctor info to each token
              return (res.queue || []).map(token => ({
                ...token,
                doctor_name: doctor.name,
                doctor_id: doctor.id,
                doctor_specialization: doctor.specialization || 'General'
              }));
            } catch (err) {
              console.error(`[DepartmentTokens] Error fetching tokens for doctor ${doctor.id}:`, err);
              return [];
            }
          }
          return [];
        });

        const results = await Promise.all(requests);
        results.forEach(doctorTokens => {
          allTokens.push(...doctorTokens);
        });
      } else {
        // If no doctors, fetch general department queue
        try {
          const res = await tokenService.getDepartmentQueue(department.id);
          allTokens.push(...(res.queue || []));
        } catch (err) {
          console.error(`[DepartmentTokens] Error fetching tokens for department ${department.id}:`, err);
        }
      }

      // Sort tokens by created_at (newest first)
      allTokens.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setTokens(allTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to fetch tokens');
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
      fetchTokens();

      // Connect to socket.io for real-time updates
      socketService.connect();
      setIsSocketConnected(true);

      // Listen for token updates
      socketService.on('tokenUpdate', (data) => {
        if (data.department_id === user.department_id) {
          fetchTokens();
        }
      });

      socketService.on('tokenGenerated', (data) => {
        if (data.department_id === user.department_id) {
          fetchTokens();
        }
      });

      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchTokens, 30000);

      return () => {
        clearInterval(interval);
        socketService.off('tokenUpdate');
        socketService.off('tokenGenerated');
        socketService.disconnect();
        setIsSocketConnected(false);
      };
    }
  }, [department, fetchTokens, user?.department_id]);

  const filteredTokens = tokens.filter(token => {
    if (activeFilter === 'all') return true;
    return token.status === activeFilter;
  });

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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          <p className="text-gray-600">Loading tokens...</p>
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
                {department.name} Department - Tokens
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-600">
                  Live Updates: {isSocketConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
                <p className="text-sm text-gray-600">
                  Total Tokens: {filteredTokens.length}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchDepartmentWithStaff();
                fetchTokens();
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <Card>
        <div className="p-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All Tokens', count: tokens.length },
              { id: 'waiting', label: 'Waiting', count: tokens.filter(t => t.status === 'waiting').length },
              { id: 'in_progress', label: 'In Progress', count: tokens.filter(t => t.status === 'in_progress').length }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tokens List */}
      <Card>
        <div className="p-6">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🎫</div>
              <p className="text-gray-600">No tokens found</p>
              <p className="text-sm text-gray-500 mt-1">
                {activeFilter === 'all' ? 'No tokens in this department' : `No ${activeFilter.replace('_', ' ')} tokens`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTokens.map((token, index) => (
                <div key={token.id || `token-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                        {token.token_number}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {token.patient_name || 'Unknown Patient'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Patient ID: {token.patient_id || 'N/A'}
                        </p>
                        {token.doctor_name && (
                          <p className="text-sm text-gray-600">
                            Doctor: {token.doctor_name} ({token.doctor_specialization})
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(token.status)}`}>
                        {token.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Created: {formatTime(token.created_at)}</p>
                        <p className="text-xs">{formatDate(token.created_at)}</p>
                        {token.updated_at && token.updated_at !== token.created_at && (
                          <p className="text-xs">Updated: {formatTime(token.updated_at)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {token.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Notes:</span> {token.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DepartmentTokens;
