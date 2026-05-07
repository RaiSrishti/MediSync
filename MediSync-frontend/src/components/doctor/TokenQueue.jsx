import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import doctorService from '../../services/doctorService';

const TokenQueue = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityLevel, setPriorityLevel] = useState(1);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const [allTokensRes, currentRes] = await Promise.all([
        doctorService.getAllTodayTokens(user?.department_id),
        doctorService.getCurrentPatient().catch(() => ({ data: null }))
      ]);
      
      setTokens(allTokensRes.data || []);
      setCurrentToken(currentRes.data);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setError('Failed to load token queue');
    } finally {
      setLoading(false);
    }
  }, [user?.department_id]);

  useEffect(() => {
    if (user?.department_id) {
      fetchTokens();
    }
  }, [user?.department_id, fetchTokens]);

  const handleCallNext = async () => {
    try {
      await doctorService.callNextToken(user.department_id);
      fetchTokens();
    } catch (err) {
      console.error('Error calling next token:', err);
      setError('Failed to call next token');
    }
  };

  const handleCompleteToken = async (tokenId) => {
    try {
      await doctorService.completeToken(tokenId);
      fetchTokens();
    } catch (err) {
      console.error('Error completing token:', err);
      setError('Failed to complete token');
    }
  };

  const handleMarkNoShow = async (tokenId) => {
    try {
      await doctorService.markNoShow(tokenId);
      fetchTokens();
    } catch (err) {
      console.error('Error marking no-show:', err);
      setError('Failed to mark as no-show');
    }
  };

  const handleSetPriority = async () => {
    if (!selectedToken) return;
    
    try {
      await doctorService.setTokenPriority(selectedToken.id, priorityLevel);
      setShowPriorityModal(false);
      setSelectedToken(null);
      setPriorityLevel(1);
      fetchTokens();
    } catch (err) {
      console.error('Error setting priority:', err);
      setError('Failed to set priority');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      waiting: 'bg-yellow-100 text-yellow-800',
      called: 'bg-blue-100 text-blue-800',
      in_consultation: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      no_show: 'bg-red-100 text-red-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    if (priority === 0) return null;
    
    const levels = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      2: 'bg-orange-100 text-orange-800 border-orange-200',
      3: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return levels[priority] || levels[1];
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading token queue...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Token Queue - {user?.departmentName}
          </h2>
          <div className="flex space-x-3">
            <Button onClick={fetchTokens} variant="secondary">
              Refresh
            </Button>
            <Button 
              onClick={handleCallNext} 
              disabled={tokens.filter(t => t.status === 'waiting').length === 0}
            >
              Call Next
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Current Patient */}
        {currentToken && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Patient</h3>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    Token #{currentToken.token_number} - {currentToken.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Age: {currentToken.age} • Gender: {currentToken.gender}
                  </div>
                  <div className="text-sm text-gray-500">
                    Phone: {currentToken.phone || 'N/A'}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleCompleteToken(currentToken.id)}
                    size="sm"
                  >
                    Complete
                  </Button>
                  <Button 
                    onClick={() => handleMarkNoShow(currentToken.id)}
                    variant="danger"
                    size="sm"
                  >
                    No Show
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Waiting Queue ({tokens.filter(t => t.status === 'waiting').length} patients)
          </h3>
          
          {tokens.length > 0 ? (
            <div className="space-y-2">
              {tokens
                .filter(token => token.status === 'waiting')
                .sort((a, b) => {
                  // Sort by priority first (higher priority first), then by token number
                  if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                  }
                  return a.token_number - b.token_number;
                })
                .map((token, index) => (
                  <div 
                    key={token.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold text-gray-900">
                          #{token.token_number}
                        </div>
                        {index === 0 && (
                          <div className="text-xs text-blue-600 font-medium">NEXT</div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-gray-900">
                            {token.patient_name}
                          </div>
                          {token.priority > 0 && (
                            <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityBadge(token.priority)}`}>
                              Priority {token.priority}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Age: {token.age} • Gender: {token.gender}
                        </div>
                        <div className="text-sm text-gray-500">
                          Waiting: {token.wait_time} minutes
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(token.status)}`}>
                        {token.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <Button
                        onClick={() => {
                          setSelectedToken(token);
                          setShowPriorityModal(true);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Set Priority
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No patients in queue
            </div>
          )}
        </div>

        {/* Completed Tokens Today */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Completed Today ({tokens.filter(t => t.status === 'completed').length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tokens
              .filter(token => token.status === 'completed')
              .slice(0, 10)
              .map((token) => (
                <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">#{token.token_number} - {token.patient_name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      Completed at {new Date(token.updated_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(token.status)}`}>
                    COMPLETED
                  </span>
                </div>
              ))}
          </div>
        </div>
      </Card>

      {/* Priority Modal */}
      <Modal
        isOpen={showPriorityModal}
        onClose={() => {
          setShowPriorityModal(false);
          setSelectedToken(null);
          setPriorityLevel(1);
        }}
        title="Set Token Priority"
      >
        {selectedToken && (
          <div className="space-y-4">
            <div className="text-gray-600">
              Setting priority for Token #{selectedToken.token_number} - {selectedToken.patient_name}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Normal (No Priority)</option>
                <option value={1}>Priority Level 1 (Low)</option>
                <option value={2}>Priority Level 2 (Medium)</option>
                <option value={3}>Priority Level 3 (High)</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={handleSetPriority} className="flex-1">
                Set Priority
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowPriorityModal(false);
                  setSelectedToken(null);
                  setPriorityLevel(1);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TokenQueue;
