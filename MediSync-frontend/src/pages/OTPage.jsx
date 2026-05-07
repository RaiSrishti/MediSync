import React from 'react';
import { useAuth } from '../hooks/useAuth';
import OTStatus from '../components/ot/OTStatus';
import Card from '../components/common/Card';

const OTPage = () => {
  const { user } = useAuth();

  const canAccessOT = ['admin', 'doctor', 'nurse', 'receptionist'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Operation Theatre Management</h1>
      </div>

      {canAccessOT ? (
        <OTStatus />
      ) : (
        <Card title="Access Denied">
          <p className="text-gray-600">You don't have permission to access OT management.</p>
        </Card>
      )}
    </div>
  );
};

export default OTPage;
