import React, { useState, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import patientService from '../../services/patientService';
import { toast } from 'react-hot-toast';

const MyTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('active');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMyTokens = useCallback(async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'active' ? null : filter;
      const response = await patientService.getMyTokens(statusFilter, 20);
      setTokens(response.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to fetch your tokens');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMyTokens();
    
    // Auto-refresh every 30 seconds for active tokens
    const interval = setInterval(() => {
      if (filter === 'active') {
        fetchMyTokens();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchMyTokens, filter]);

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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

  const getStatusMessage = (status) => {
    switch (status) {
      case 'waiting':
        return 'Please wait in the waiting area. You will be called soon.';
      case 'called':
        return '🔔 Your token has been called! Please proceed to the consultation room.';
      case 'in_progress':
        return 'Your consultation is currently in progress.';
      case 'completed':
        return 'Your consultation has been completed.';
      case 'cancelled':
        return 'This token was cancelled.';
      case 'no_show':
        return 'Marked as no-show. Please generate a new token if needed.';
      default:
        return 'Status unknown.';
    }
  };

  const activeTokens = tokens.filter(token => 
    ['waiting', 'called', 'in_progress'].includes(token.status)
  );

  const filterOptions = [
    { value: 'active', label: 'Active Tokens', count: activeTokens.length },
    { value: 'completed', label: 'Completed', count: tokens.filter(t => t.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', count: tokens.filter(t => t.status === 'cancelled').length },
    { value: 'no_show', label: 'No Show', count: tokens.filter(t => t.status === 'no_show').length }
  ];

  const filteredTokens = filter === 'active' ? activeTokens : tokens.filter(token => token.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Tokens</h2>
              <p className="text-sm text-gray-600">
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            
            <Button
              onClick={fetchMyTokens}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Active Token Alert */}
      {activeTokens.length > 0 && (
        <Card>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="text-blue-500 text-xl mr-3">🔔</div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">Active Tokens</h3>
                <p className="text-sm text-blue-800">
                  You have {activeTokens.length} active token{activeTokens.length > 1 ? 's' : ''}. 
                  Please stay alert for your token number to be called.
                </p>
                
                {activeTokens.some(token => token.status === 'called') && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                    <p className="text-sm font-medium text-red-800">
                      🚨 URGENT: One or more of your tokens has been called! Please check below.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

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

      {/* Tokens List */}
      <Card>
        <div className="p-6">
          {loading && tokens.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your tokens...</p>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🎫</div>
              <p className="text-gray-500">
                {filter === 'active' 
                  ? 'No active tokens found. Generate a new token to get started.'
                  : `No ${filter} tokens found.`
                }
              </p>
              {filter === 'active' && (
                <Button 
                  onClick={() => {
                    // Use React Router navigation instead of hash
                    // This would need to be handled by parent component
                    // window.location.hash = '#generate'
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Generate New Token
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTokens.map((token) => (
                <div
                  key={token.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    token.status === 'called' 
                      ? 'border-red-300 bg-red-50 shadow-lg' 
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-blue-600">
                        #{token.token_number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {token.department_name}
                        </h3>
                        {token.doctor_name && (
                          <p className="text-sm text-gray-600">
                            Dr. {token.doctor_name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(token.status)}`}>
                      <span className="mr-1">{getStatusIcon(token.status)}</span>
                      {token.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className={`p-3 rounded-lg mb-3 ${
                    token.status === 'called' 
                      ? 'bg-red-100 border border-red-300' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <p className={`text-sm ${
                      token.status === 'called' ? 'text-red-800 font-medium' : 'text-gray-700'
                    }`}>
                      {getStatusMessage(token.status)}
                    </p>
                  </div>

                  {/* Token Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Generated</p>
                      <p className="text-gray-900">{formatDate(token.created_at)}</p>
                      <p className="text-gray-900">{formatTime(token.created_at)}</p>
                    </div>
                    
                    {token.estimated_wait_time && (
                      <div>
                        <p className="text-gray-600">Estimated Wait</p>
                        <p className="text-gray-900">{token.estimated_wait_time} minutes</p>
                      </div>
                    )}
                    
                    {token.called_at && (
                      <div>
                        <p className="text-gray-600">Called At</p>
                        <p className="text-gray-900">{formatTime(token.called_at)}</p>
                      </div>
                    )}
                    
                    {token.completed_at && (
                      <div>
                        <p className="text-gray-600">Completed At</p>
                        <p className="text-gray-900">{formatTime(token.completed_at)}</p>
                      </div>
                    )}
                  </div>

                  {/* Queue Position (for waiting tokens) */}
                  {token.status === 'waiting' && token.queue_position && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Queue Position:</strong> {token.queue_position} 
                        {token.tokens_ahead && ` (${token.tokens_ahead} tokens ahead)`}
                      </p>
                    </div>
                  )}

                  {/* Notes (if any) */}
                  {token.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {token.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Instructions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Status Guide</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">⏳</span>
                <div>
                  <p className="font-medium text-gray-900">Waiting</p>
                  <p className="text-sm text-gray-600">Your token is in the queue</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-lg">📢</span>
                <div>
                  <p className="font-medium text-gray-900">Called</p>
                  <p className="text-sm text-gray-600">Please proceed to consultation room</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-lg">👨‍⚕️</span>
                <div>
                  <p className="font-medium text-gray-900">In Progress</p>
                  <p className="text-sm text-gray-600">Consultation is ongoing</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-medium text-gray-900">Completed</p>
                  <p className="text-sm text-gray-600">Consultation finished successfully</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-lg">❌</span>
                <div>
                  <p className="font-medium text-gray-900">Cancelled</p>
                  <p className="text-sm text-gray-600">Token was cancelled</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-lg">👻</span>
                <div>
                  <p className="font-medium text-gray-900">No Show</p>
                  <p className="text-sm text-gray-600">Patient did not appear when called</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MyTokens;
