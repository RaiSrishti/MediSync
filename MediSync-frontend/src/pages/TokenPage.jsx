import React from 'react';
import { useAuth } from '../hooks/useAuth';
import TokenManagement from '../components/tokens/TokenManagement';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const TokenPage = () => {
  const { user } = useAuth();

  const canManageTokens = ['admin', 'doctor'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Token Management</h1>
      </div>

      {canManageTokens && <TokenManagement />}

      {!canManageTokens && (
        <Card title="Access Denied">
          <p className="text-gray-600">You don't have permission to access token management.</p>
          <Button onClick={() => window.history.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      )}
    </div>
  );
};

export default TokenPage;
