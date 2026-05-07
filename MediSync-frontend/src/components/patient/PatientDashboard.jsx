import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import patientService from '../../services/patientService';
import socketService from '../../services/socketService';
import Card from '../common/Card';
import ResponsiveTabs from '../common/ResponsiveTabs';
import Button from '../common/Button';
import OTStatus from './OTStatus';
import DisplayBoard from '../common/DisplayBoard';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [myTokens, setMyTokens] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentDoctors, setDepartmentDoctors] = useState([]);
  const [departmentQueue, setDepartmentQueue] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileLoadAttempted, setProfileLoadAttempted] = useState(false);

  // Define tab configuration
  const tabs = [
    { id: 'departments', label: 'Departments & Tokens', icon: '🏥' },
    { id: 'my-tokens', label: 'My Tokens', icon: '🎫' },
    { id: 'ot-status', label: 'Operation Theatre Status', icon: '🚪' },
    { id: 'display', label: 'Display Board', icon: '📺' },
    { id: 'my-profile', label: 'My Profile', icon: '👤' }
  ];

  // Define loadPatientProfile function first
  const loadPatientProfile = useCallback(async () => {
    if (!user) return;
    
    setProfileLoading(true);
    setProfileLoadAttempted(true);
    try {
      const response = await patientService.getMyProfile();
      setPatientProfile(response);
    } catch (error) {
      console.error('Error loading patient profile:', error);
      if (error.response?.status === 404) {
        setPatientProfile({ hasProfile: false, message: error.response.data.message });
      } else {
        setPatientProfile({ hasProfile: false, error: true, message: 'Failed to load profile' });
        toast.error('Failed to load patient profile');
      }
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh availability when a department is selected
  useEffect(() => {
    if (!selectedDepartment) return;

    const refreshAvailability = async () => {
      try {
        const doctorsResponse = await patientService.getDepartmentDoctorsAvailability(selectedDepartment.id);
        setDepartmentDoctors(doctorsResponse.doctors || []);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error refreshing availability:', error);
      }
    };

    // Initial load and then every 30 seconds
    const interval = setInterval(refreshAvailability, 30000);
    
    return () => clearInterval(interval);
  }, [selectedDepartment]);

  // Load patient profile when profile tab is active
  useEffect(() => {
    if (activeTab === 'my-profile' && user && patientProfile === null && !profileLoading && !profileLoadAttempted) {
      loadPatientProfile();
    }
  }, [activeTab, user, patientProfile, profileLoading, profileLoadAttempted, loadPatientProfile]);

  // Load tokens function
  const loadMyTokens = useCallback(async () => {
    if (!user) return;
    
    try {
      const tokensResponse = await patientService.getMyTokens('', 5);
      setMyTokens(tokensResponse.tokens || []);
    } catch (error) {
      console.error('Error loading tokens:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load your tokens');
      }
    }
  }, [user]);

  // Refresh department queue data
  const refreshDepartmentQueue = useCallback(async () => {
    if (selectedDepartment) {
      try {
        const queueResponse = await patientService.getDepartmentQueue(selectedDepartment.id);
        setDepartmentQueue(queueResponse);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error refreshing department queue:', error);
      }
    }
  }, [selectedDepartment]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (!user) return;

    // Connect to socket with authentication token
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
      
      // Join patient-specific room
      socketService.joinPatientRoom(user.id);

      // Listen for token status updates
      const handleTokenStatusUpdate = (data) => {
        toast.success(data.message || `Your token #${data.tokenNumber} status updated`);
        
        // Refresh tokens to get updated status
        loadMyTokens();
        // Also refresh department queue to update counts
        refreshDepartmentQueue();
      };

      // Listen for medical information updates
      const handleMedicalUpdate = (data) => {
        // Check if this update is for the current user
        if (data.patientId && patientProfile?.patient?.id === parseInt(data.patientId)) {
          toast.success('Your medical information has been updated by your doctor');
          // Reload the patient profile to show updated medical info
          loadPatientProfile();
        }
      };

      socketService.onTokenStatusUpdate(handleTokenStatusUpdate);
      
      // Add socket listener for medical updates
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('patientMedicalUpdated', handleMedicalUpdate);
      }

      // Cleanup on unmount
      return () => {
        socketService.offTokenStatusUpdate(handleTokenStatusUpdate);
        if (socket) {
          socket.off('patientMedicalUpdated', handleMedicalUpdate);
        }
        socketService.disconnect();
      };
    }
  }, [user, loadMyTokens, refreshDepartmentQueue, loadPatientProfile, patientProfile?.patient?.id]);

  const updatePatientProfile = async (profileData) => {
    try {
      const response = await patientService.updateMyProfile(profileData);
      // Always include permissions after update
      setPatientProfile(prev => ({
        ...response,
        permissions: prev && prev.permissions ? prev.permissions : {
          canEdit: ['phone_number', 'address', 'emergency_contact'],
          cannotEdit: ['name', 'age', 'medical_history', 'current_medications', 'allergies']
        }
      }));
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const loadInitialData = async () => {
    try {
      // Load departments (public data)
      const deptsResponse = await patientService.getDepartments();
      setDepartments(deptsResponse.departments || []);

      // Only load tokens if user is authenticated
      if (user) {
        loadMyTokens();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentDetails = async (department) => {
    try {
      setSelectedDepartment(department);
      setSelectedDoctor('');
      
      // Show a brief loading toast
      const loadingToast = toast.loading(`Loading ${department.name} details...`);
      
      const [doctorsResponse, queueResponse] = await Promise.all([
        patientService.getDepartmentDoctorsAvailability(department.id),
        patientService.getDepartmentQueue(department.id)
      ]);
      
      // The new endpoint returns doctors with availability already included
      setDepartmentDoctors(doctorsResponse.doctors || []);
      setDepartmentQueue(queueResponse);
      setLastUpdated(new Date());

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Smooth scroll to department details section
      setTimeout(() => {
        const departmentDetailsElement = document.getElementById('department-details');
        if (departmentDetailsElement) {
          departmentDetailsElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100); // Small delay to ensure state is updated and component is rendered
      
    } catch (error) {
      console.error('Error loading department details:', error);
      toast.error('Failed to load department details');
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedDepartment) {
      toast.error('Please select a department first');
      return;
    }

    setGenerating(true);
    try {
      await patientService.generateToken(
        selectedDepartment.id,
        selectedDoctor || null
      );
      
      toast.success('Token generated successfully!');
      
      // Refresh my tokens
      const tokensResponse = await patientService.getMyTokens('', 5);
      setMyTokens(tokensResponse.tokens || []);
      
      // Refresh department queue
      const queueResponse = await patientService.getDepartmentQueue(selectedDepartment.id);
      setDepartmentQueue(queueResponse);
      
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error(error.response?.data?.error || 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const getTokenStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'no-show': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getDoctorAvailabilityStatus = (doctor) => {
    if (!doctor.availability) {
      return { status: 'unknown', color: 'bg-gray-100 text-gray-600', location: 'Unknown' };
    }

    const availability = doctor.availability;
    switch (availability.status) {
      case 'available':
        return { 
          status: 'Available', 
          color: 'bg-green-100 text-green-600', 
          location: availability.location || 'Department' 
        };
      case 'busy':
        return { 
          status: 'Busy', 
          color: 'bg-yellow-100 text-yellow-600', 
          location: availability.location || 'Department' 
        };
      case 'in_surgery':
        return { 
          status: 'In Surgery', 
          color: 'bg-red-100 text-red-600', 
          location: availability.location || 'Operation Theatre' 
        };
      case 'off_duty':
        return { 
          status: 'Off Duty', 
          color: 'bg-gray-100 text-gray-600', 
          location: 'Off Duty' 
        };
      default:
        return { 
          status: 'Available', 
          color: 'bg-green-100 text-green-600', 
          location: availability.location || 'Department' 
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Please Log In</h2>
            <p className="text-gray-600">You need to be logged in to access the patient dashboard.</p>
            <div className="mt-4">
              <a 
                href="/auth" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Login
              </a>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-gray-600">Patient Dashboard - MediSync Healthcare System</p>
        </div>
      </Card>

      {/* Tab Navigation */}
      <ResponsiveTabs 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'departments' && (
        <>
          {/* Departments */}
          <Card title="Departments">
            <p className="text-sm text-gray-600 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
              </svg>
              Click on any department to view doctors and details below
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-md ${
                    selectedDepartment?.id === dept.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => loadDepartmentDetails(dept)}
                >
                  <h3 className="font-medium text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{dept.description}</p>
                  <div className="mt-2 text-xs text-gray-400">
                    Status: {dept.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Department Details */}
          {selectedDepartment && (
            <div id="department-details" className="grid grid-cols-1 lg:grid-cols-2 gap-6 transform transition-all duration-500 ease-in-out">
              {/* Scroll indicator */}
              <div className="lg:col-span-2 text-center mb-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm shadow-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedDepartment.name} Department Details
                </div>
              </div>
              {/* Available Doctors */}
              <Card title={`Doctors in ${selectedDepartment.name}`}>
                <div className="space-y-4">
                  {/* Doctor Statistics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {departmentDoctors.filter(doc => {
                            const availability = getDoctorAvailabilityStatus(doc);
                            return availability.status === 'Available';
                          }).length}
                        </div>
                        <div className="text-sm text-gray-500">Available Now</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {departmentDoctors.length}
                        </div>
                        <div className="text-sm text-gray-500">Total Doctors</div>
                      </div>
                    </div>
                  </div>
                  {/* Doctor List with Availability */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">Doctors in {selectedDepartment.name}</h4>
                      <div className="flex items-center space-x-3">
                        {lastUpdated && (
                          <span className="text-xs text-gray-500">
                            Updated: {lastUpdated.toLocaleTimeString()}
                          </span>
                        )}
                        <button
                          onClick={() => loadDepartmentDetails(selectedDepartment)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                    </div>
                    {departmentDoctors.length === 0 ? (
                      <p className="text-gray-500 text-sm">No doctors available in this department</p>
                    ) : (
                      <div className="space-y-3">
                        {departmentDoctors.map((doctor) => {
                          const availability = getDoctorAvailabilityStatus(doctor);
                          return (
                            <div key={doctor.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-medium text-gray-900">Dr. {doctor.name}</div>
                                  <div className="text-sm text-gray-600">{selectedDepartment.name}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${availability.color}`}>
                                  {availability.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Current Location: {availability.location}
                                </div>
                                {availability.status === 'Available' && (
                                  <div className="text-green-600 text-xs mt-1">
                                    ✓ Available for consultation
                                  </div>
                                )}
                                {availability.status === 'Busy' && (
                                  <div className="text-yellow-600 text-xs mt-1">
                                    ⚠ Currently with patient
                                  </div>
                                )}
                                {availability.status === 'In Surgery' && (
                                  <div className="text-red-600 text-xs mt-1">
                                    🏥 Currently in surgery
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Doctor Selection for Token */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor for Token (Optional)
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Any Available Doctor</option>
                      {departmentDoctors.map((doctor) => {
                        const availability = getDoctorAvailabilityStatus(doctor);
                        return (
                          <option 
                            key={doctor.id} 
                            value={doctor.id}
                            disabled={availability.status === 'Off Duty'}
                          >
                            Dr. {doctor.name} - {availability.status}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecting a specific doctor may increase wait time if they are currently busy
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleGenerateToken}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? 'Generating...' : 'Generate Token'}
                  </Button>
                </div>
              </Card>

              {/* Department Queue */}
              <Card title="Current Queue Status">
                {departmentQueue ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {departmentQueue.stats?.waiting || 0}
                        </div>
                        <div className="text-sm text-gray-500">Waiting</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {departmentQueue.stats?.completed || 0}
                        </div>
                        <div className="text-sm text-gray-500">Completed Today</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-700">
                        Estimated Wait Time
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        {departmentQueue.estimatedWaitTime || '0 minutes'}
                      </div>
                    </div>

                    {departmentQueue.queue && departmentQueue.queue.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Current Queue</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {departmentQueue.queue.slice(0, 5).map((token) => (
                            <div key={token.id} className="flex justify-between text-sm">
                              <span>Token #{token.token_number}</span>
                              <span className={`${getTokenStatusColor(token.status)} px-2 py-1 rounded text-xs`}>
                                {token.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Select a department to view queue status</p>
                )}
              </Card>
            </div>
          )}
        </>
      )}

      {activeTab === 'my-tokens' && (
        <Card title="My Recent Tokens">
          {myTokens.length === 0 ? (
            <p className="text-gray-500">No tokens found. Generate your first token from the Departments tab!</p>
          ) : (
            <div className="space-y-3">
              {myTokens.map((token) => (
                <div key={token.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      Token #{token.token_number} - {token.department_name}
                    </div>
                    {token.doctor_name && (
                      <div className="text-sm text-gray-600">Doctor: {token.doctor_name}</div>
                    )}
                    <div className="text-sm text-gray-500">
                      {formatDateTime(token.created_at)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTokenStatusColor(token.status)}`}>
                    {token.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'ot-status' && <OTStatus />}

      {activeTab === 'display' && <DisplayBoard />}

      {activeTab === 'my-profile' && (
        <Card title="My Patient Profile">
          {profileLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-lg">Loading profile...</div>
            </div>
          ) : patientProfile === null ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Click to load your profile information</p>
              <Button onClick={loadPatientProfile}>Load Profile</Button>
            </div>
          ) : patientProfile.hasProfile === false ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="text-yellow-800">
                  <h3 className="font-medium mb-2">No Profile Found</h3>
                  <p className="text-sm">{patientProfile.message}</p>
                  <p className="text-sm mt-2">Please contact hospital staff to create your medical profile.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
                  {/* Basic Information card removed (duplicate) */}

              {/* Contact Information */}
              {/* Edit Button above Basic Info */}
              <div className="flex justify-end mb-4">
                {!editingProfile && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                  >
                    Edit My Info
                  </Button>
                )}
              </div>
              {editingProfile ? (
                <ProfileEditForm 
                  profile={patientProfile.patient}
                  onSave={updatePatientProfile}
                  onCancel={() => setEditingProfile(false)}
                  permissions={patientProfile.permissions}
                />
              ) : (
                <>
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <div className="mt-1 text-sm text-gray-900">{patientProfile.patient?.name || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <div className="mt-1 text-sm text-gray-900">{patientProfile.patient?.age || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <div className="mt-1 text-sm text-gray-900">{patientProfile.patient?.gender || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                        <div className="mt-1 text-sm text-gray-900">{patientProfile.patient?.blood_group || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  {/* Contact Information */}
                  <div className="bg-white border rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="mt-1 text-sm text-gray-900">{patientProfile.patient?.phone_number || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 text-sm text-gray-900">{patientProfile.patient?.email || 'N/A'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <div className="mt-1 text-sm text-gray-900">{patientProfile.patient?.address || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  {/* Basic Info Card below contact info removed */}
                </>
              )}

              {/* Medical Information */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-4">Medical Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700">Medical History</label>
                    <div className="mt-1 text-sm text-red-900">
                      {patientProfile.patient?.medical_history || 'No medical history recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700">Current Medications</label>
                    <div className="mt-1 text-sm text-red-900">
                      {patientProfile.patient?.current_medications ? (
                        Array.isArray(patientProfile.patient.current_medications) ? (
                          <ul className="list-disc list-inside">
                            {patientProfile.patient.current_medications.map((med, index) => (
                              <li key={`medication-${index}`}>
                                {typeof med === 'object' && med !== null ? (
                                  <div>
                                    <strong>{med.name || 'Unknown medication'}</strong>
                                    {med.dosage && <span> - {med.dosage}</span>}
                                    {med.frequency && <span> ({med.frequency})</span>}
                                    {med.instructions && <div className="text-xs text-gray-600 ml-4">{med.instructions}</div>}
                                  </div>
                                ) : (
                                  med
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          patientProfile.patient.current_medications
                        )
                      ) : (
                        'No current medications'
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700">Allergies</label>
                    <div className="mt-1 text-sm text-red-900">
                      {patientProfile.patient?.allergies ? (
                        Array.isArray(patientProfile.patient.allergies) ? (
                          <ul className="list-disc list-inside">
                            {patientProfile.patient.allergies.map((allergy, index) => (
                              <li key={`allergy-${index}`}>
                                {typeof allergy === 'object' && allergy !== null ? (
                                  <div>
                                    <strong>{allergy.allergen || 'Unknown allergen'}</strong>
                                    {allergy.reaction && <span> - {allergy.reaction}</span>}
                                    {allergy.severity && <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                      allergy.severity === 'severe' ? 'bg-red-200 text-red-800' :
                                      allergy.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                                      'bg-green-200 text-green-800'
                                    }`}>
                                      {allergy.severity}
                                    </span>}
                                  </div>
                                ) : (
                                  allergy
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          patientProfile.patient.allergies
                        )
                      ) : (
                        'No known allergies'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {patientProfile.patient?.emergency_contact && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Name</label>
                      <div className="mt-1 text-sm text-blue-900">
                        {patientProfile.patient.emergency_contact.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Phone</label>
                      <div className="mt-1 text-sm text-blue-900">
                        {patientProfile.patient.emergency_contact.phone || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Relationship</label>
                      <div className="mt-1 text-sm text-blue-900">
                        {patientProfile.patient.emergency_contact.relationship || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Profile Status</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Profile Linked:</span>
                    <span className={patientProfile.isLinked ? 'text-green-600' : 'text-red-600'}>
                      {patientProfile.isLinked ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created by Staff:</span>
                    <span>{patientProfile.createdByStaff ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// Profile Edit Form Component
const ProfileEditForm = ({ profile, onSave, onCancel, permissions }) => {
  const [formData, setFormData] = useState({
    age: profile?.age || '',
    gender: profile?.gender || '',
    blood_group: profile?.blood_group || '',
    phone_number: profile?.phone_number || '',
    address: profile?.address || '',
    emergency_contact: profile?.emergency_contact || {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergency_contact: {
        ...prev.emergency_contact,
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!permissions.canEdit.includes('age')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!permissions.canEdit.includes('gender')}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Blood Group</label>
          <input
            type="text"
            value={formData.blood_group}
            onChange={(e) => setFormData(prev => ({ ...prev, blood_group: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!permissions.canEdit.includes('blood_group')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!permissions.canEdit.includes('phone_number')}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!permissions.canEdit.includes('address')}
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-700 mb-3">Emergency Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.emergency_contact.name}
              onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!permissions.canEdit.includes('emergency_contact')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.emergency_contact.phone}
              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!permissions.canEdit.includes('emergency_contact')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Relationship</label>
            <input
              type="text"
              value={formData.emergency_contact.relationship}
              onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!permissions.canEdit.includes('emergency_contact')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default PatientDashboard;
