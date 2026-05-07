import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { departmentService } from '../services/displayService';
import PublicDisplay from '../components/display/PublicDisplay';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const DisplayPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const canAccessDisplay = ['admin', 'receptionist', 'display'].includes(user?.role);

  if (!canAccessDisplay) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Display Management</h1>
        <Card title="Access Denied">
          <p className="text-gray-600">You don't have permission to access display management.</p>
        </Card>
      </div>
    );
  }

  if (selectedDepartment && isFullscreen) {
    return <PublicDisplay departmentId={selectedDepartment} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Display Management</h1>
      </div>

      {!selectedDepartment ? (
        <Card title="Select Department Display">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className="p-6 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{dept.location}</p>
                <p className="text-sm text-gray-500 mt-2">Click to view display</p>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card title={`Display Preview - ${departments.find(d => d.id == selectedDepartment)?.name}`}>
            <div className="flex space-x-4 mb-4">
              <Button onClick={toggleFullscreen}>
                Launch Fullscreen Display
              </Button>
              <Button variant="secondary" onClick={() => setSelectedDepartment('')}>
                Back to Department List
              </Button>
            </div>
            
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <div className="transform scale-50 origin-top-left" style={{ width: '200%', height: '200%' }}>
                <PublicDisplay departmentId={selectedDepartment} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DisplayPage;
