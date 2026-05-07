import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import ResponsiveTabs from '../common/ResponsiveTabs';
import Button from '../common/Button';
import DisplayBoard from '../common/DisplayBoard';
import DepartmentView from './DepartmentView';
import ReceptionistOTStatus from './ReceptionistOTStatus';

const ReceptionistPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('display');

  const tabs = [
    { id: 'display', label: 'Display Board', icon: '📊' },
    { id: 'ot-status', label: 'OT Status', icon: '🚪' },
    { id: 'departments', label: 'Departments', icon: '🏥' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'display':
        return <DisplayBoard />;
      case 'ot-status':
        return <ReceptionistOTStatus />;
      case 'departments':
        return <DepartmentView />;
      default:
        return <DisplayBoard />;
    }
  };

  if (!user || user.role !== 'receptionist') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in as a receptionist to access this page.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Receptionist Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user.name}
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                onClick={logout}
                variant="outline"
                className="ml-3"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <ResponsiveTabs 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-t border-teal-200/50 mt-20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏥</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    MediSync Hospital Management System
                  </div>
                  <div className="text-xs text-gray-600">
                    © 2025 All rights reserved
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Receptionist Portal v1.0</span>
                </div>
                <div className="hidden sm:block text-gray-400">|</div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">👩‍💼</span>
                  <span>Receptionist: {user.name}</span>
                </div>
                <div className="hidden sm:block text-gray-400">|</div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">📅</span>
                  <span>Last Login: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ReceptionistPage;
