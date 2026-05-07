import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Card from '../common/Card';
import { toast } from 'react-hot-toast';
import departmentService from '../../services/departmentService';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await departmentService.getAllDepartments();
        // Sort departments alphabetically for better user experience
        const sortedDepartments = (response.departments || []).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setDepartments(sortedDepartments);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Reset department_id if role is changed to non-medical role
      if (name === 'role' && !['doctor', 'nurse'].includes(value)) {
        newData.department_id = '';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await register(formData);
      
      // Show different messages based on role and response
      if (formData.role === 'patient') {
        toast.success(response.message || 'Registration successful! You can now access your account.');
        // Redirect to dashboard after successful patient registration
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.success(response.message || 'Registration submitted! Please wait for admin approval.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Register for MediSync" className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="receptionist">Receptionist</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {formData.role === 'patient' 
                ? 'Patients can book appointments and view medical records'
                : formData.role === 'doctor' || formData.role === 'nurse'
                ? 'Medical staff must select a department and await admin approval'
                : 'Staff accounts require admin approval before activation'
              }
            </p>
          </div>

          {/* Show department selection only for doctors and nurses */}
          {(['doctor', 'nurse'].includes(formData.role)) && (
            <div>
              <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
                Department *
              </label>
              <select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
                disabled={loadingDepartments}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingDepartments ? 'Loading departments...' : 'Select Department'}
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {departments.length === 0 && !loadingDepartments && (
                <p className="mt-1 text-sm text-red-600">
                  No departments available. Please contact administrator.
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
        >
          Register
        </Button>
      </form>
    </Card>
  );
};

export default RegisterForm;
