import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import patientService from '../../services/patientService';
import { toast } from 'react-hot-toast';

const PatientMedication = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMedications, setPatientMedications] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      const response = await patientService.searchPatients(searchTerm);
      setSearchResults(response.data || []);
      
      if (response.data.length === 0) {
        toast('No patients found');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    try {
      setLoading(true);
      // Fetch patient's current medications/prescriptions
      const response = await patientService.getPatientMedications(patient.id);
      setPatientMedications(response.data || []);
    } catch (error) {
      console.error('Error fetching patient medications:', error);
      toast.error('Failed to fetch patient medications');
      setPatientMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Medication Search</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by patient name, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Search Results ({searchResults.length})</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{patient.name}</h4>
                        <p className="text-sm text-gray-600">
                          ID: {patient.id} | Phone: {patient.contact_number} | Age: {patient.age}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Patient Medications */}
      {selectedPatient && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Current Medications for {selectedPatient.name}
              </h2>
              <Button
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientMedications([]);
                }}
                variant="outline"
              >
                Clear Selection
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Patient ID:</span>
                  <p className="text-gray-900">{selectedPatient.id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Age:</span>
                  <p className="text-gray-900">{selectedPatient.age}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Gender:</span>
                  <p className="text-gray-900">{selectedPatient.gender}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-900">{selectedPatient.contact_number}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading medications...</p>
              </div>
            ) : patientMedications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">💊</div>
                <p className="text-gray-500">No current medications found for this patient.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientMedications.map((medication, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{medication.drug_name}</h4>
                        <p className="text-sm text-gray-600">Brand: {medication.brand}</p>
                        <p className="text-sm text-gray-600">Dosage: {medication.dosage}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Prescribed by:</span> {medication.doctor_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span> {formatDate(medication.prescribed_date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Duration:</span> {medication.duration || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Instructions:</span>
                        </p>
                        <p className="text-sm text-gray-800">{medication.instructions || 'Follow doctor\'s advice'}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                          medication.status === 'active' ? 'bg-green-100 text-green-800' :
                          medication.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {medication.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PatientMedication;
