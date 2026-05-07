import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import PharmacistInventory from '../components/pharmacist/PharmacistInventory';
import LowStockDrugs from '../components/pharmacist/LowStockDrugs';
import PatientMedication from '../components/pharmacist/PatientMedication';

const PharmacyPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('drugs');

  const tabs = [
    { id: 'pharmacy', label: 'Pharmacy Management', icon: '💊' },
    { id: 'lowstock', label: 'Low Stock', icon: '⚠️' },
    { id: 'patients', label: 'Patient Search', icon: '👥' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pharmacy':
        return <PharmacistInventory />;
      case 'lowstock':
        return <LowStockDrugs />;
      case 'patients':
        return <PatientMedication />;
      default:
        return <PharmacistInventory />;
    }
  };

  if (!user || !['pharmacist', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in as a pharmacist to access this page.
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
                {user.role === 'admin' ? 'Pharmacy Management' : 'Pharmacist Dashboard'}
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
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PharmacyPage;
