import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DoctorDashboard from './DoctorDashboard';
import PatientManager from './PatientManager';
import DoctorSchedule from './DoctorSchedule';
import DoctorOTStatus from './DoctorOTStatus';
import PharmacyInventory from './PharmacyInventory';
import ResponsiveTabs from '../common/ResponsiveTabs';
import Button from '../common/Button';

const DoctorPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏥' },
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'pharmacy', label: 'Pharmacy', icon: '💊' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'ot-status', label: 'OT Status', icon: '🚪' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DoctorDashboard />;
      case 'patients':
        return <PatientManager />;
      case 'pharmacy':
        return <PharmacyInventory />;
      case 'schedule':
        return <DoctorSchedule />;
      case 'ot-status':
        return <DoctorOTStatus />;
      default:
        return <DoctorDashboard />;
    }
  };

  if (!user || user.role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in as a doctor to access this page.
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">MediSync</div>
              <div className="text-lg text-gray-600">|</div>
              <div className="text-lg text-gray-900">Doctor Portal</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Dr. {user.name}</div>
                <div className="text-xs text-gray-500">{user.departmentName || 'Department'}</div>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              </div>
              <Button onClick={logout} variant="secondary" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ResponsiveTabs 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

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
                <span className="font-medium">Doctor Portal v1.0</span>
              </div>
              <div className="hidden sm:block text-gray-400">|</div>
              <div className="flex items-center space-x-2">
                <span className="text-teal-600">🏥</span>
                <span>Department: {user.departmentName || 'N/A'}</span>
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
  );
};

export default DoctorPage;
