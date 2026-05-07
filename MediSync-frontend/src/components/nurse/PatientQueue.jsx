import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import tokenService from '../../services/tokenService';
import { toast } from 'react-hot-toast';

const PatientQueue = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchQueue = useCallback(async () => {
    if (!user.department_id) return;

    try {
      setLoading(true);
      const response = await tokenService.getDepartmentQueue(user.department_id);
      setQueue(response.queue || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast.error('Failed to fetch patient queue');
    } finally {
      setLoading(false);
    }
  }, [user.department_id]);

  useEffect(() => {
    fetchQueue();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleStatusUpdate = async (tokenId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [tokenId]: true }));
      
      await tokenService.updateStatus(tokenId, newStatus);
      toast.success(`Token status updated to ${newStatus.replace('_', ' ')}`);
      
      // Refresh queue
      await fetchQueue();
    } catch (error) {
      console.error('Error updating token status:', error);
      toast.error('Failed to update token status');
    } finally {
      setActionLoading(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  const handleCallNext = async () => {
    try {
      setLoading(true);
      await tokenService.callNext(user.department_id);
      toast.success('Next patient called');
      
      // Refresh queue
      await fetchQueue();
    } catch (error) {
      console.error('Error calling next patient:', error);
      toast.error('Failed to call next patient');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'called':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return '⏳';
      case 'called':
        return '📢';
      case 'in_progress':
        return '👨‍⚕️';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'no_show':
        return '👻';
      default:
        return '❓';
    }
  };

  const filteredQueue = queue.filter(patient => {
    if (filter === 'all') return true;
    return patient.status === filter;
  });

  const filterOptions = [
    { value: 'all', label: 'All Patients', count: queue.length },
    { value: 'waiting', label: 'Waiting', count: queue.filter(p => p.status === 'waiting').length },
    { value: 'called', label: 'Called', count: queue.filter(p => p.status === 'called').length },
    { value: 'in_progress', label: 'In Progress', count: queue.filter(p => p.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: queue.filter(p => p.status === 'completed').length }
  ];

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
      {/* Header with Actions */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Patient Queue Management</h2>
              <p className="text-sm text-gray-600">
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCallNext}
                disabled={loading || queue.filter(p => p.status === 'waiting').length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📢 Call Next Patient
              </Button>
              <Button
                onClick={fetchQueue}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <Card>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Patient Queue */}
      <Card>
        <div className="p-6">
          {loading && queue.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading patient queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <p className="text-gray-500">
                {filter === 'all' ? 'No patients in queue' : `No ${filter.replace('_', ' ')} patients`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((patient) => (
                <div
                  key={patient.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-blue-600">
                          #{patient.token_number}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {patient.patient_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Generated: {formatTime(patient.created_at)}
                          </p>
                          {patient.doctor_name && (
                            <p className="text-sm text-gray-600">
                              Doctor: {patient.doctor_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(patient.status)}`}>
                        <span className="mr-1">{getStatusIcon(patient.status)}</span>
                        {patient.status?.replace('_', ' ').toUpperCase()}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {patient.status === 'waiting' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(patient.id, 'called')}
                              disabled={actionLoading[patient.id]}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              📢 Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(patient.id, 'no_show')}
                              disabled={actionLoading[patient.id]}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              No Show
                            </Button>
                          </>
                        )}

                        {patient.status === 'called' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(patient.id, 'in_progress')}
                              disabled={actionLoading[patient.id]}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              👨‍⚕️ Start
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(patient.id, 'waiting')}
                              disabled={actionLoading[patient.id]}
                            >
                              ↩️ Back to Queue
                            </Button>
                          </>
                        )}

                        {patient.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(patient.id, 'completed')}
                            disabled={actionLoading[patient.id]}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ✅ Complete
                          </Button>
                        )}

                        {(patient.status === 'waiting' || patient.status === 'called') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(patient.id, 'cancelled')}
                            disabled={actionLoading[patient.id]}
                            className="text-red-600 hover:text-red-800"
                          >
                            ❌ Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(patient.estimated_wait_time || patient.notes) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {patient.estimated_wait_time && (
                        <p className="text-sm text-gray-600">
                          <strong>Estimated wait:</strong> {patient.estimated_wait_time} minutes
                        </p>
                      )}
                      {patient.notes && (
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {patient.notes}
                        </p>
                      )}
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

export default PatientQueue;
