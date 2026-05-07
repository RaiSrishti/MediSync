import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import doctorService from '../../services/doctorService';
import socketService from '../../services/socketService';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [currentPatient, setCurrentPatient] = useState(null);
  const [doctorQueue, setDoctorQueue] = useState([]);
  const [departmentStats, setDepartmentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMedicalDetails, setShowMedicalDetails] = useState(false);
  const [editingMedication, setEditingMedication] = useState(false);
  const [lastPatientId, setLastPatientId] = useState(null);
  const [medicationForm, setMedicationForm] = useState({
    current_medications: [],
    allergies: [],
    medical_history: [],
    diagnosis: '',
    treatment_plan: '',
    notes: ''
  });

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Dashboard loading timed out. Please refresh the page or contact support.');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      if (!user?.department_id) {
        throw new Error('Department ID is missing from user profile');
      }

      const [currentPatientRes, queueRes, statsRes] = await Promise.all([
        doctorService.getCurrentPatient().catch(() => {
          return null;
        }),
        doctorService.getDoctorQueue(user?.department_id, user?.id).catch(() => {
          return { queue: [], stats: {}, estimatedWaitTime: "0 minutes" };
        }),
        doctorService.getDepartmentStats(user?.department_id).catch(() => {
          return null;
        })
      ]);

      setCurrentPatient(currentPatientRes?.patient || null);
      setDoctorQueue(queueRes?.queue || []);
      setDepartmentStats(queueRes?.stats || statsRes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.department_id) {
      fetchDashboardData();
    } else if (user && !user.department_id) {
      // User is loaded but missing department_id
      setError('User account is missing department information. Please contact administrator.');
      setLoading(false);
    } else if (user === null) {
      // User is null, likely still loading auth
      }
  }, [user, fetchDashboardData]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (user?.department_id) {
      const token = localStorage.getItem('token');
      socketService.connect(token);
      
      const socket = socketService.getSocket();
      if (socket) {
        // Join department room for real-time updates
        socket.emit('joinRoom', `department_${user.department_id}`);
        
        // Listen for token events
        const handleTokenGenerated = () => {
          fetchDashboardData();
        };
        
        const handleNextTokenCalled = () => {
          fetchDashboardData();
        };
        
        const handleTokenCompleted = () => {
          fetchDashboardData();
        };
        
        const handleTokenStatusUpdated = () => {
          fetchDashboardData();
        };
        
        // Attach event listeners
        socket.on('tokenGenerated', handleTokenGenerated);
        socket.on('nextTokenCalled', handleNextTokenCalled);
        socket.on('tokenCompleted', handleTokenCompleted);
        socket.on('tokenStatusUpdated', handleTokenStatusUpdated);
        socket.on('tokenNoShow', handleTokenCompleted); // Same as completed
        socket.on('tokenPriorityUpdated', handleTokenStatusUpdated);
        
        // Cleanup function
        return () => {
          socket.off('tokenGenerated', handleTokenGenerated);
          socket.off('nextTokenCalled', handleNextTokenCalled);
          socket.off('tokenCompleted', handleTokenCompleted);
          socket.off('tokenStatusUpdated', handleTokenStatusUpdated);
          socket.off('tokenNoShow', handleTokenCompleted);
          socket.off('tokenPriorityUpdated', handleTokenStatusUpdated);
          socketService.disconnect();
        };
      }
    }
  }, [user?.department_id, fetchDashboardData]);

  const handleCallNext = async () => {
    try {
      await doctorService.callNextToken(user.department_id);
      fetchDashboardData();
    } catch (error) {
      console.error('Error calling next token:', error);
      setError('Failed to call next token');
    }
  };

  const handleCompleteConsultation = async () => {
    if (!currentPatient) return;
    
    try {
      // Use token_id from the currentPatient object (which comes from backend patient data)
      const tokenId = currentPatient.token_id;
      if (!tokenId) {
        throw new Error('Token ID not found in current patient data');
      }
      await doctorService.completeToken(tokenId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error completing consultation:', error);
      setError('Failed to complete consultation');
    }
  };

  const handleMarkNoShow = async () => {
    if (!currentPatient) return;
    
    try {
      // Use token_id from the currentPatient object (which comes from backend patient data)
      const tokenId = currentPatient.token_id;
      if (!tokenId) {
        throw new Error('Token ID not found in current patient data');
      }
      await doctorService.markNoShow(tokenId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking no-show:', error);
      setError('Failed to mark as no-show');
    }
  };

  // Initialize medication form when current patient changes
  useEffect(() => {
    if (currentPatient && currentPatient.id !== lastPatientId) {
      setMedicationForm({
        current_medications: currentPatient.current_medications || [],
        allergies: currentPatient.allergies || [],
        medical_history: currentPatient.medical_history || [],
        diagnosis: currentPatient.diagnosis || '',
        treatment_plan: currentPatient.treatment_plan || '',
        notes: currentPatient.notes || ''
      });
      setLastPatientId(currentPatient.id);
    }
  }, [currentPatient, lastPatientId]);

  const handleMedicationUpdate = async (e) => {
    e.preventDefault();
    if (!currentPatient) return;

    try {
      setEditingMedication(false);
      await doctorService.updatePatientMedicalDetails(currentPatient.id, medicationForm);
      fetchDashboardData(); // Refresh to get updated patient data
      setError('');
    } catch (error) {
      console.error('Error updating medical details:', error);
      setError('Failed to update medical details');
    }
  };

  const addMedication = () => {
    setMedicationForm(prev => ({
      ...prev,
      current_medications: [...prev.current_medications, { name: '', dosage: '', frequency: '', instructions: '' }]
    }));
  };

  const removeMedication = (index) => {
    setMedicationForm(prev => ({
      ...prev,
      current_medications: prev.current_medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index, field, value) => {
    setMedicationForm(prev => ({
      ...prev,
      current_medications: prev.current_medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const addAllergy = () => {
    setMedicationForm(prev => ({
      ...prev,
      allergies: [...prev.allergies, { allergen: '', reaction: '', severity: 'mild' }]
    }));
  };

  const removeAllergy = (index) => {
    setMedicationForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const updateAllergy = (index, field, value) => {
    setMedicationForm(prev => ({
      ...prev,
      allergies: prev.allergies.map((allergy, i) => 
        i === index ? { ...allergy, [field]: value } : allergy
      )
    }));
  };

  if (loading) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500 mb-2">Loading dashboard...</div>
          <div className="text-sm text-gray-400">
            {user ? `Loading data for Dr. ${user.name}` : 'Authenticating...'}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <div className="text-red-600 mb-2">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4 text-center">{error}</div>
          <Button onClick={fetchDashboardData} variant="primary">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Dr. {user?.name}!
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {user?.departmentName || 'Department'} • {new Date().toLocaleDateString()}
            </p>
          </div>
          <Button onClick={fetchDashboardData} variant="secondary">
            Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Current Patient */}
      <Card title="Current Patient">
        {currentPatient ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Token #{currentPatient.token_number} - {currentPatient.name}
                  </h3>
                  <p className="text-gray-600">
                    Age: {currentPatient.age} • Gender: {currentPatient.gender}
                  </p>
                  <p className="text-sm text-gray-500">
                    Phone: {currentPatient.phone_number || 'N/A'} • Emergency Contact: {
                      currentPatient.emergency_contact 
                        ? (typeof currentPatient.emergency_contact === 'string' 
                            ? currentPatient.emergency_contact 
                            : `${currentPatient.emergency_contact.name || 'N/A'} (${currentPatient.emergency_contact.phone || 'N/A'})`)
                        : 'N/A'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Waiting Time</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentPatient.consultation_time || currentPatient.total_wait_time || 0} min
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={handleCompleteConsultation} className="flex-1">
                  Complete Consultation
                </Button>
                <Button variant="danger" onClick={handleMarkNoShow}>
                  Mark No-Show
                </Button>
                <Button 
                  onClick={() => setShowMedicalDetails(!showMedicalDetails)}
                  variant="secondary"
                >
                  {showMedicalDetails ? 'Hide' : 'Show'} Medical Details
                </Button>
              </div>
            </div>

            {/* Medical Details Panel */}
            {showMedicalDetails && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Medical Details</h4>
                  <Button 
                    onClick={() => setEditingMedication(!editingMedication)}
                    variant="secondary"
                    size="sm"
                  >
                    {editingMedication ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {editingMedication ? (
                  <form onSubmit={handleMedicationUpdate} className="space-y-6">
                    {/* Current Medications */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Current Medications
                        </label>
                        <Button type="button" onClick={addMedication} size="sm" variant="secondary">
                          Add Medication
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {medicationForm.current_medications.map((med, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              <input
                                type="text"
                                placeholder="Medication name"
                                value={med.name || ''}
                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Dosage (e.g., 500mg)"
                                value={med.dosage || ''}
                                onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Frequency (e.g., twice daily)"
                                value={med.frequency || ''}
                                onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  placeholder="Instructions"
                                  value={med.instructions || ''}
                                  onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Button 
                                  type="button" 
                                  onClick={() => removeMedication(index)}
                                  variant="danger"
                                  size="sm"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Allergies */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Allergies
                        </label>
                        <Button type="button" onClick={addAllergy} size="sm" variant="secondary">
                          Add Allergy
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {medicationForm.allergies.map((allergy, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg">
                            <div className="grid grid-cols-3 gap-3">
                              <input
                                type="text"
                                placeholder="Allergen"
                                value={allergy.allergen || ''}
                                onChange={(e) => updateAllergy(index, 'allergen', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Reaction"
                                value={allergy.reaction || ''}
                                onChange={(e) => updateAllergy(index, 'reaction', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                              <div className="flex space-x-2">
                                <select
                                  value={allergy.severity || 'mild'}
                                  onChange={(e) => updateAllergy(index, 'severity', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="severe">Severe</option>
                                </select>
                                <Button 
                                  type="button" 
                                  onClick={() => removeAllergy(index)}
                                  variant="danger"
                                  size="sm"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Diagnosis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnosis
                      </label>
                      <textarea
                        value={medicationForm.diagnosis}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter diagnosis..."
                      />
                    </div>

                    {/* Treatment Plan */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Treatment Plan
                      </label>
                      <textarea
                        value={medicationForm.treatment_plan}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, treatment_plan: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter treatment plan..."
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consultation Notes
                      </label>
                      <textarea
                        value={medicationForm.notes}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter consultation notes..."
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button type="submit" className="flex-1">
                        Update Medical Details
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setEditingMedication(false)}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {/* Display Current Medications */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Current Medications</h5>
                      {currentPatient.current_medications && currentPatient.current_medications.length > 0 ? (
                        <div className="space-y-2">
                          {currentPatient.current_medications.map((med, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium">{med.name}</div>
                              <div className="text-sm text-gray-600">
                                {med.dosage} • {med.frequency}
                                {med.instructions && ` • ${med.instructions}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No current medications recorded</p>
                      )}
                    </div>

                    {/* Display Allergies */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Allergies</h5>
                      {currentPatient.allergies && currentPatient.allergies.length > 0 ? (
                        <div className="space-y-2">
                          {currentPatient.allergies.map((allergy, index) => (
                            <div key={index} className="p-3 bg-red-50 rounded-lg">
                              <div className="font-medium">{allergy.allergen}</div>
                              <div className="text-sm text-gray-600">
                                {allergy.reaction} • Severity: {allergy.severity}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No known allergies</p>
                      )}
                    </div>

                    {/* Display Diagnosis */}
                    {currentPatient.diagnosis && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Diagnosis</h5>
                        <p className="text-gray-700">{currentPatient.diagnosis}</p>
                      </div>
                    )}

                    {/* Display Treatment Plan */}
                    {currentPatient.treatment_plan && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Treatment Plan</h5>
                        <p className="text-gray-700">{currentPatient.treatment_plan}</p>
                      </div>
                    )}

                    {/* Display Notes */}
                    {currentPatient.notes && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Consultation Notes</h5>
                        <p className="text-gray-700">{currentPatient.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No patient currently in consultation</div>
            <Button onClick={handleCallNext} disabled={doctorQueue.length === 0}>
              {doctorQueue.length > 0 ? 'Call Next Patient' : 'No Patients in Queue'}
            </Button>
          </div>
        )}
      </Card>

      {/* Doctor's Patient Queue */}
      <Card title={`My Patient Queue (${doctorQueue.length} patients)`}>
        {doctorQueue.length > 0 ? (
          <div className="space-y-3">
            {doctorQueue.slice(0, 5).map((token, index) => (
              <div 
                key={token.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index === 0 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold text-gray-900">
                    #{token.token_number}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{token.patient_name}</div>
                    <div className="text-sm text-gray-500">
                      Age: {token.age} • {token.gender}
                      {token.priority > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Waiting</div>
                  <div className="font-semibold text-gray-900">{token.wait_time} min</div>
                </div>
              </div>
            ))}
            {doctorQueue.length > 5 && (
              <div className="text-center text-gray-500 py-2">
                ... and {doctorQueue.length - 5} more patients
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No patients in your queue
          </div>
        )}
      </Card>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Today's Activity">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Patients Seen</span>
              <span className="text-2xl font-bold text-green-600">
                {departmentStats?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Currently Waiting</span>
              <span className="text-2xl font-bold text-blue-600">
                {departmentStats?.waiting || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">No Shows</span>
              <span className="text-2xl font-bold text-red-600">
                {departmentStats?.no_show || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Performance">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Tokens</span>
              <span className="text-2xl font-bold text-gray-600">
                {departmentStats?.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Consultations Today</span>
              <span className="text-2xl font-bold text-teal-600">
                {departmentStats?.completed || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
