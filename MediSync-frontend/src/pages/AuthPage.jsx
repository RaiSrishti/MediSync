import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Button from '../components/common/Button';
import EmergencyModal from '../components/common/EmergencyModal';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 shadow-xl border-b border-teal-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-lg font-bold">🏥</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Medi<span className="text-cyan-200">Sync</span>
                </h1>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-cyan-100 text-xs font-medium">Healthcare Management</span>
                </div>
              </div>
            </div>
            
            {/* Emergency Button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="group relative bg-red-500/90 hover:bg-red-500 border border-red-400/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 backdrop-blur-sm animate-pulse hover:animate-none"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-base animate-bounce">🚨</span>
                  <span className="hidden sm:inline font-semibold">Emergency</span>
                </span>
              </button>
            </div>
          </div>
        </div>
        {/* Subtle gradient line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-800 mb-2">MediSync</h1>
            <p className="text-xl text-gray-600">Hospital Management System</p>
          </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <Button
              variant={activeTab === 'login' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('login')}
              className="mr-1"
            >
              Login
            </Button>
            <Button
              variant={activeTab === 'register' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('register')}
            >
              Register
            </Button>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="flex justify-center">
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-12 border-t border-teal-200/30">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">🏥</span>
              </div>
              <div className="text-gray-700 font-medium">
                MediSync Hospital Management System
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="hidden sm:block text-gray-400">|</div>
              <div className="flex items-center space-x-2">
                <span className="text-teal-600">🔒</span>
                <span>Secure Login Portal</span>
              </div>
              <div className="hidden sm:block text-gray-400">|</div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📞</span>
                <span>24/7 Emergency Support</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              © 2025 MediSync. All rights reserved. | Version 1.0 | Healthcare Management Solution
            </div>
          </div>
        </footer>
      </div>
    </div>

    {/* Emergency Modal */}
    <EmergencyModal 
      isOpen={isEmergencyModalOpen}
      onClose={() => setIsEmergencyModalOpen(false)}
    />
  </div>
);
};

export default AuthPage;
