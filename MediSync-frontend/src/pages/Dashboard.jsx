import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import PatientDashboard from '../components/patient/PatientDashboard';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // If user is a patient, render the PatientDashboard
  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'System Administrator',
      doctor: 'Medical Doctor',
      nurse: 'Nursing Staff',
      pharmacist: 'Pharmacy Staff',
      receptionist: 'Reception Staff',
      patient: 'Patient'
    };
    return descriptions[role] || 'User';
  };

  const getQuickActions = () => {
    const actions = [];
    
    // Only admin and pharmacist should see the dashboard with quick actions
    if (user?.role === 'admin') {
      actions.push({
        title: 'Generate Token',
        description: 'Create new patient tokens',
        link: '/tokens',
        icon: '🎫',
        color: 'primary'
      });
      
      actions.push({
        title: 'OT Management',
        description: 'Monitor operation theatres',
        link: '/ot',
        icon: '🏥',
        color: 'secondary'
      });
      
      actions.push({
        title: 'Pharmacy',
        description: 'Manage drug inventory',
        link: '/pharmacy',
        icon: '💊',
        color: 'success'
      });
      
      actions.push({
        title: 'Display Board',
        description: 'Public information displays',
        link: '/display',
        icon: '📺',
        color: 'warning'
      });
      
      actions.push({
        title: 'Admin Panel',
        description: 'System administration',
        link: '/admin',
        icon: '⚙️',
        color: 'danger'
      });
    }

    if (user?.role === 'pharmacist') {
      actions.push({
        title: 'Pharmacy',
        description: 'Manage drug inventory',
        link: '/pharmacy',
        icon: '💊',
        color: 'success'
      });
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getWelcomeMessage()}, {user?.name}!
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {getRoleDescription(user?.role)}
              {user?.role !== 'patient' && (
                <span> • {user?.departmentName || 'General'}</span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Welcome to MediSync Hospital Management System
            </p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getQuickActions().map((action, index) => (
            <a
              key={index}
              href={action.link}
              className="block p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="text-4xl mb-3">{action.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </a>
          ))}
        </div>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Today's Activity">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Tokens</span>
              <span className="text-2xl font-bold text-blue-600">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active OTs</span>
              <span className="text-2xl font-bold text-green-600">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Low Stock Items</span>
              <span className="text-2xl font-bold text-yellow-600">--</span>
            </div>
          </div>
        </Card>

        <Card title="Recent Activity">
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">System Info:</span> Real-time updates active
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last Login:</span> {new Date().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> All systems operational
            </div>
          </div>
        </Card>

        <Card title="Quick Stats">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">System Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Real-time Sync</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Monitoring Active</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
