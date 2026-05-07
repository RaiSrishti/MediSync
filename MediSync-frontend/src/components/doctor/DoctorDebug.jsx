import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';

const DoctorDebug = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        
        <div className="space-y-3">
          <div>
            <strong>Authentication Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
          
          <div>
            <strong>Auth Loading:</strong> {isLoading ? 'Loading' : 'Loaded'}
          </div>
          
          <div>
            <strong>User Object:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>User Department ID:</strong> {user?.department_id || 'Missing'}
          </div>
          
          <div>
            <strong>User Role:</strong> {user?.role || 'Missing'}
          </div>
          
          <div>
            <strong>User Name:</strong> {user?.name || 'Missing'}
          </div>
          
          <div>
            <strong>Token in localStorage:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DoctorDebug;
