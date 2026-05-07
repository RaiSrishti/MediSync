import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import displayService, { departmentService } from '../../services/displayService';
import tokenService from '../../services/tokenService';

const PublicDisplay = ({ departmentId }) => {
  const [_displayData, setDisplayData] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [department, setDepartment] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisplayData = useCallback(async () => {
    try {
      const [displayResponse, tokensResponse, deptResponse, currentTokenResponse] = await Promise.all([
        displayService.getLiveDisplayData(departmentId),
        tokenService.getTokensByDepartment(departmentId),
        departmentService.getDepartmentById(departmentId),
        tokenService.getCurrentToken(departmentId).catch(() => ({ token: null }))
      ]);

      setDisplayData(displayResponse.display || {});
      setDepartment(deptResponse.department || {});
      setCurrentToken(currentTokenResponse.token);
      
      const tokens = tokensResponse.tokens || [];
      setWaitingTokens(tokens.filter(token => token.status === 'waiting'));
      
      // Extract announcements from display data
      if (displayResponse.display?.announcements) {
        setAnnouncements(displayResponse.display.announcements);
      }
    } catch {
      toast.error('Failed to fetch display data');
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    if (departmentId) {
      fetchDisplayData();
      // Set up real-time updates
      const interval = setInterval(fetchDisplayData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [departmentId, fetchDisplayData]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-2xl text-gray-600">Loading display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary-800">
                {department?.name || 'Department Display'}
              </h1>
              <p className="text-xl text-gray-600 mt-2">{formatDate()}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">
                {formatTime(new Date())}
              </div>
              <div className="text-lg text-gray-600">Live</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Token Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Current Token</h2>
              
              {currentToken ? (
                <div className="text-center">
                  <div className="text-8xl font-bold text-primary-600 mb-4">
                    {currentToken.tokenNumber}
                  </div>
                  <div className="text-2xl font-semibold text-gray-800 mb-2">
                    {currentToken.patientName}
                  </div>
                  {currentToken.priority === 'emergency' && (
                    <div className="inline-block px-4 py-2 bg-danger-100 text-danger-800 rounded-full text-lg font-medium animate-pulse">
                      EMERGENCY
                    </div>
                  )}
                  {currentToken.priority === 'urgent' && (
                    <div className="inline-block px-4 py-2 bg-warning-100 text-warning-800 rounded-full text-lg font-medium">
                      URGENT
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">⏳</div>
                  <div className="text-2xl">No active token</div>
                </div>
              )}
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg shadow-lg p-6 mt-6">
                <h3 className="text-xl font-bold text-warning-800 mb-4">📢 Announcements</h3>
                <div className="space-y-3">
                  {announcements.map((announcement, index) => (
                    <div key={index} className="text-warning-800">
                      <p className="text-lg">{announcement.message}</p>
                      <p className="text-sm opacity-75">{formatTime(announcement.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Waiting Queue */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Waiting Queue</h3>
              
              {waitingTokens.length > 0 ? (
                <div className="space-y-3">
                  {waitingTokens.slice(0, 10).map((token, index) => (
                    <div 
                      key={token.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index < 3 ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-lg">{token.tokenNumber}</div>
                        <div className="text-sm text-gray-600">{token.patientName}</div>
                      </div>
                      <div className="text-right">
                        {token.priority === 'emergency' && (
                          <span className="text-xs px-2 py-1 bg-danger-100 text-danger-600 rounded">
                            Emergency
                          </span>
                        )}
                        {token.priority === 'urgent' && (
                          <span className="text-xs px-2 py-1 bg-warning-100 text-warning-600 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {waitingTokens.length > 10 && (
                    <div className="text-center text-gray-500 text-sm">
                      +{waitingTokens.length - 10} more waiting
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">✓</div>
                  <div>No tokens waiting</div>
                </div>
              )}
            </div>

            {/* Department Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Department Info</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Location:</span>
                  <span className="ml-2 text-gray-600">{department?.location || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Contact:</span>
                  <span className="ml-2 text-gray-600">{department?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Head:</span>
                  <span className="ml-2 text-gray-600">{department?.head || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {waitingTokens.length}
                  </div>
                  <div className="text-sm text-gray-600">Waiting</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {currentToken ? 1 : 0}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500">
          <p>MediSync Hospital Management System</p>
          <p className="text-sm">Real-time updates every 10 seconds</p>
        </div>
      </div>
    </div>
  );
};

export default PublicDisplay;
