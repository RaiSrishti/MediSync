import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TokenPage from './pages/TokenPage';
import OTPage from './pages/OTPage';
import PharmacyPage from './pages/PharmacyPage';
import DisplayPage from './pages/DisplayPage';
import AdminPage from './pages/AdminPage';
import TokenTimeSettings from './pages/admin/TokenTimeSettings';
import DoctorPage from './components/doctor/DoctorPage';
import NursePage from './components/nurse/NursePage';
import ReceptionistPage from './components/receptionist/ReceptionistPage';

// Layout Component
const Layout = ({ children }) => {
  const { logout } = useAuth();

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
            
            {/* Actions Section */}
            <div className="flex items-center space-x-3">
              <button
                onClick={logout}
                className="group relative bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 backdrop-blur-sm"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </span>
              </button>
            </div>
          </div>
        </div>
        {/* Subtle gradient line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      {children}
    </Layout>
  );
};

// Public Route Component (for auth page)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect based on role
    if (user.role === 'doctor') {
      return <Navigate to="/doctor" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'pharmacist') {
      return <Navigate to="/pharmacy" replace />;
    }
    if (user.role === 'nurse') {
      return <Navigate to="/nurse" replace />;
    }
    if (user.role === 'receptionist') {
      return <Navigate to="/receptionist" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/tokens" element={
              <ProtectedRoute allowedRoles={['admin', 'staff', 'doctor', 'nurse']}>
                <TokenPage />
              </ProtectedRoute>
            } />
            
            <Route path="/ot" element={
              <ProtectedRoute allowedRoles={['admin', 'staff', 'doctor', 'nurse']}>
                <OTPage />
              </ProtectedRoute>
            } />
            
            <Route path="/pharmacy" element={
              <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
                <PharmacyPage />
              </ProtectedRoute>
            } />
            
            <Route path="/display" element={
              <ProtectedRoute>
                <DisplayPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/token-settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TokenTimeSettings />
              </ProtectedRoute>
            } />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorPage />
              </ProtectedRoute>
            } />
            
            {/* Nurse Routes */}
            <Route path="/nurse" element={
              <ProtectedRoute allowedRoles={['nurse']}>
                <NursePage />
              </ProtectedRoute>
            } />
            
            {/* Receptionist Routes */}
            <Route path="/receptionist" element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <ReceptionistPage />
              </ProtectedRoute>
            } />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
