import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import patientService from '../../services/patientService';
import { toast } from 'react-hot-toast';

const TokenGeneration = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await patientService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const fetchDepartmentDoctors = async (departmentId) => {
    if (!departmentId) return;
    
    try {
      const response = await patientService.getDepartmentDoctors(departmentId);
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors');
    }
  };

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedDoctor('');
    setDoctors([]);
    setGeneratedToken(null);
    
    if (departmentId) {
      fetchDepartmentDoctors(departmentId);
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedDepartment) {
      toast.error('Please select a department');
      return;
    }

    try {
      setLoading(true);
      const response = await patientService.generateToken(
        selectedDepartment,
        selectedDoctor || null
      );

      if (response.success) {
        setGeneratedToken(response.data);
        toast.success('Token generated successfully!');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error(error.response?.data?.error || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleNewToken = () => {
    setGeneratedToken(null);
    setSelectedDepartment('');
    setSelectedDoctor('');
    setDoctors([]);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {generatedToken ? (
        /* Token Generated Success */
        <Card>
          <div className="p-6 text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Token Generated Successfully!</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                #{generatedToken.token_number}
              </div>
              <p className="text-lg text-blue-800 mb-4">Your Token Number</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p className="text-gray-600"><strong>Department:</strong></p>
                  <p className="text-gray-900">{generatedToken.department_name}</p>
                </div>
                
                {generatedToken.doctor_name && (
                  <div className="text-left">
                    <p className="text-gray-600"><strong>Doctor:</strong></p>
                    <p className="text-gray-900">Dr. {generatedToken.doctor_name}</p>
                  </div>
                )}
                
                <div className="text-left">
                  <p className="text-gray-600"><strong>Date:</strong></p>
                  <p className="text-gray-900">{formatDate(generatedToken.created_at)}</p>
                </div>
                
                <div className="text-left">
                  <p className="text-gray-600"><strong>Time:</strong></p>
                  <p className="text-gray-900">{formatTime(generatedToken.created_at)}</p>
                </div>
                
                <div className="text-left">
                  <p className="text-gray-600"><strong>Status:</strong></p>
                  <p className="text-yellow-600 font-medium">WAITING</p>
                </div>
                
                {generatedToken.estimated_wait_time && (
                  <div className="text-left">
                    <p className="text-gray-600"><strong>Estimated Wait:</strong></p>
                    <p className="text-gray-900">{generatedToken.estimated_wait_time} minutes</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p>Please keep this token number safe. You can check your token status in the "My Tokens" tab.</p>
              <p className="mt-2">You will be called when it's your turn. Please stay in the waiting area.</p>
            </div>

            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => window.print()} 
                variant="outline"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🖨️ Print Token
              </Button>
              <Button 
                onClick={handleNewToken}
                className="bg-green-600 hover:bg-green-700"
              >
                Generate Another Token
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Token Generation Form */
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Generate New Token</h2>
            
            <div className="space-y-6">
              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Department *
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a department...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                      {dept.description && ` - ${dept.description}`}
                    </option>
                  ))}
                </select>
                
                {selectedDepartment && (
                  <p className="mt-2 text-sm text-gray-600">
                    💡 You can select a specific doctor or choose "Any Available Doctor" for faster service.
                  </p>
                )}
              </div>

              {/* Doctor Selection */}
              {selectedDepartment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor (Optional)
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Available Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name}
                        {doctor.specialization && ` - ${doctor.specialization}`}
                      </option>
                    ))}
                  </select>
                  
                  {doctors.length === 0 && (
                    <p className="mt-2 text-sm text-yellow-600">
                      ⚠️ No doctors currently available in this department. You can still generate a token for the next available doctor.
                    </p>
                  )}
                </div>
              )}

              {/* Current Queue Info */}
              {selectedDepartment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Queue Information</h3>
                  <div className="text-sm text-blue-800">
                    <p>• Tokens are called in order of generation</p>
                    <p>• You can check your status in the "My Tokens" tab</p>
                    <p>• Emergency cases may be prioritized</p>
                    <p>• Please arrive 10 minutes before your estimated time</p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateToken}
                  disabled={!selectedDepartment || loading}
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    '🎫 Generate Token'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {!generatedToken && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How Token Generation Works</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">📝 Step 1: Select Department</h4>
                <p className="text-sm text-gray-600">
                  Choose the department you need to visit based on your medical requirement.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">👨‍⚕️ Step 2: Choose Doctor (Optional)</h4>
                <p className="text-sm text-gray-600">
                  Select a specific doctor or let the system assign the next available one.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🎫 Step 3: Generate Token</h4>
                <p className="text-sm text-gray-600">
                  Your unique token number will be generated with estimated wait time.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">⏰ Step 4: Wait for Your Turn</h4>
                <p className="text-sm text-gray-600">
                  Monitor your token status and be ready when your number is called.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TokenGeneration;
