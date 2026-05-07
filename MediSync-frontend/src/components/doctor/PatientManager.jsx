import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import doctorService from '../../services/doctorService';

const PatientManager = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      if (!user?.department_id) {
        throw new Error('Department ID is missing from user profile');
      }
      
      const response = await doctorService.getDepartmentPatients(user?.department_id);
      setPatients(response.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(`Failed to load patients: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.department_id) {
      fetchPatients();
    } else if (user && !user.department_id) {
      setError('User account is missing department information. Please contact administrator.');
      setLoading(false);
    }
  }, [user, fetchPatients]);

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.id.toString().includes(searchTerm)
  );

  const getGenderBadge = (gender) => {
    const badges = {
      male: 'bg-blue-100 text-blue-800',
      female: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return badges[gender?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500 mb-2">Loading patients...</div>
          <div className="text-sm text-gray-400">
            {user ? `Loading patients for ${user.departmentName || 'department'}` : 'Authenticating...'}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Patient Management - {user?.departmentName}
          </h2>
          <div className="flex space-x-3">
            <Button onClick={fetchPatients} variant="secondary">
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search patients by name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patient.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getGenderBadge(patient.gender)}`}>
                        {patient.gender?.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        ID: {patient.id}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Age:</span> {patient.age} years
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {patient.phone || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Emergency Contact:</span> {
                          typeof patient.emergency_contact === 'object' && patient.emergency_contact ? 
                            `${patient.emergency_contact.name} (${patient.emergency_contact.phone})` : 
                            patient.emergency_contact || 'N/A'
                        }
                      </div>
                    </div>

                    {patient.address && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Address:</span> {patient.address}
                      </div>
                    )}

                    {patient.medical_history && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Medical History:</span> {
                          typeof patient.medical_history === 'object' ? 
                            JSON.stringify(patient.medical_history) : 
                            patient.medical_history
                        }
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      Registered: {new Date(patient.created_at).toLocaleDateString()}
                      {patient.last_visit && (
                        <span className="ml-4">
                          Last Visit: {new Date(patient.last_visit).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No patients found matching your search' : 'No patients registered in this department'}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{patients.length}</div>
              <div className="text-sm text-gray-500">Total Patients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {patients.filter(p => p.gender?.toLowerCase() === 'male').length}
              </div>
              <div className="text-sm text-gray-500">Male Patients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">
                {patients.filter(p => p.gender?.toLowerCase() === 'female').length}
              </div>
              <div className="text-sm text-gray-500">Female Patients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(patients.reduce((sum, p) => sum + (p.age || 0), 0) / patients.length) || 0}
              </div>
              <div className="text-sm text-gray-500">Average Age</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PatientManager;
