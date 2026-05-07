import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import ResponsiveTabs from '../components/common/ResponsiveTabs';
import Button from '../components/common/Button';
import DisplayBoard from '../components/common/DisplayBoard';
import departmentService from '../services/departmentService';
import otService from '../services/otService';
import pharmacyService from '../services/pharmacyService';
import { toast } from 'react-hot-toast';

// Department Modal Component
const DepartmentModal = ({ isOpen, onClose, onSubmit, title, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Department name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter department name"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter department description"
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Doctor Assignment Modal Component
const DoctorAssignmentModal = ({ isOpen, onClose, department, availableDoctors, onAssignDoctor, onRefreshAvailableDoctors, onRefreshDepartments }) => {
  const [departmentDoctors, setDepartmentDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartmentDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartmentDoctors(department.id);
      setDepartmentDoctors(response.doctors || []);
    } catch (error) {
      console.error('Error fetching department doctors:', error);
      setDepartmentDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [department.id]);

  useEffect(() => {
    if (isOpen && department) {
      fetchDepartmentDoctors();
    }
  }, [isOpen, department, fetchDepartmentDoctors]);

  const handleAssign = async (doctorId) => {
    try {
      await onAssignDoctor(department.id, doctorId);
      fetchDepartmentDoctors(); // Refresh the department doctors list
      onRefreshAvailableDoctors(); // Refresh the available doctors list
      onRefreshDepartments(); // Refresh the main departments list to update status
    } catch {
      // Error handling is done in parent component
    }
  };

  const handleRemove = async (doctorId) => {
    try {
      await departmentService.removeDoctorFromDepartment(department.id, doctorId);
      toast.success('Doctor removed successfully');
      
      fetchDepartmentDoctors(); // Refresh the department doctors list
      onRefreshAvailableDoctors(); // Refresh the available doctors list
      onRefreshDepartments(); // Refresh the main departments list to update status
    } catch (error) {
      console.error('Error removing doctor:', error);
      toast.error('Failed to remove doctor');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Manage Doctors - {department.name}</h3>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Current Department Doctors */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Current Doctors ({departmentDoctors.length})</h4>
              {departmentDoctors.length === 0 ? (
                <p className="text-gray-500 text-sm">No doctors assigned to this department.</p>
              ) : (
                <div className="space-y-2">
                  {departmentDoctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-gray-600">{doctor.email}</p>
                      </div>
                      <Button
                        onClick={() => handleRemove(doctor.id)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Doctors to Assign */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Available Doctors to Assign</h4>
              {availableDoctors.length === 0 ? (
                <p className="text-gray-500 text-sm">No unassigned doctors available.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableDoctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-gray-600">{doctor.email}</p>
                        {doctor.specialization && (
                          <p className="text-sm text-blue-600">{doctor.specialization}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAssign(doctor.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// OT Management Component
const OTManagement = () => {
  const [ots, setOTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddOTModal, setShowAddOTModal] = useState(false);
  const [showEditOTModal, setShowEditOTModal] = useState(false);
  const [selectedOT, setSelectedOT] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOTs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await otService.getAllOTs();
      setOTs(response.data || []);
    } catch (error) {
      console.error('Error fetching OTs:', error);
      toast.error('Failed to fetch operation theatres');
    } finally {
      setLoading(false);
    }
  }, []);


  // Fetch all departments (with staff) and aggregate all doctors with department name
  const fetchDoctors = useCallback(async () => {
    try {
      const result = await departmentService.getAllDepartments(true); // include_staff=true
      const departments = Array.isArray(result) ? result : result.departments;
      let allDoctors = [];
      if (Array.isArray(departments)) {
        departments.forEach(dept => {
          if (Array.isArray(dept.doctors)) {
            dept.doctors.forEach(doc => {
              allDoctors.push({
                ...doc,
                department_name: dept.name
              });
            });
          }
        });
      }
      setDoctors(allDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  }, []);

  useEffect(() => {
    fetchOTs();
    fetchDoctors();
  }, [fetchOTs, fetchDoctors]);

  // Helper function to convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    
    try {
      // Handle both "HH:MM:SS" and "HH:MM" formats
      const timeParts = time24.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      
      return `${hours}:${minutes} ${ampm}`;
    } catch {
      return time24; // Return original if parsing fails
    }
  };

  const handleCreateOT = async (otData) => {
    try {
      await otService.createOT(otData);
      toast.success('Operation theatre created successfully');
      setShowAddOTModal(false);
      fetchOTs();
    } catch (error) {
      console.error('Error creating OT:', error);
      toast.error('Failed to create operation theatre');
    }
  };

  const handleUpdateOT = async (otData) => {
    try {
      // Format dates properly
      const formattedData = { ...otData };
      
      // Convert datetime-local to date format for assignment_date
      if (formattedData.assignment_date) {
        // If it's already in YYYY-MM-DD format, keep it
        if (/^\d{4}-\d{2}-\d{2}$/.test(formattedData.assignment_date)) {
          // Already in correct format
        } else {
          // Convert from ISO or other format
          formattedData.assignment_date = formattedData.assignment_date.split('T')[0];
        }
      }
      
      // Convert datetime-local to time format for assignment_time  
      if (formattedData.assignment_time) {
        // If it's already in HH:MM format, keep it
        if (/^\d{2}:\d{2}$/.test(formattedData.assignment_time)) {
          // Already in correct format
        } else {
          // Try to parse as date and extract time
          try {
            const time = new Date(formattedData.assignment_time);
            if (!isNaN(time.getTime())) {
              formattedData.assignment_time = time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
            }
          } catch {
            console.warn('Could not parse assignment_time:', formattedData.assignment_time);
          }
        }
      }
      
      // For cleaning and maintenance status, clear doctor assignment if not provided
      if ((formattedData.status === 'cleaning' || formattedData.status === 'maintenance')) {
        if (!formattedData.doctor_id) {
          formattedData.doctor_id = null;
          formattedData.assignment_date = null;
          formattedData.assignment_time = null;
        }
      }
      
      // Convert empty string doctor_id to null for database compatibility
      if (formattedData.doctor_id === '') {
        formattedData.doctor_id = null;
      }
      
      await otService.updateOT(selectedOT.id, formattedData);
      toast.success('Operation theatre updated successfully');
      setShowEditOTModal(false);
      setSelectedOT(null);
      fetchOTs();
    } catch (error) {
      console.error('Error updating OT:', error);
      toast.error('Failed to update operation theatre');
    }
  };

  const handleDeleteOT = async (otId, otNumber) => {
    if (window.confirm(`Are you sure you want to delete OT ${otNumber}? This action cannot be undone.`)) {
      try {
        await otService.deleteOT(otId);
        toast.success('Operation theatre deleted successfully');
        fetchOTs();
      } catch (error) {
        console.error('Error deleting OT:', error);
        toast.error(error.response?.data?.message || 'Failed to delete operation theatre');
      }
    }
  };

  // Filter OTs based on status
  const filteredOTs = ots.filter(ot => {
    if (statusFilter === 'all') return true;
    return ot.status === statusFilter;
  });

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading operation theatres...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Operation Theatre Management</h2>
            <Button 
              onClick={() => setShowAddOTModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add OT
            </Button>
          </div>
          
          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Filter by Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-use">In Use</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="emergency">Emergency</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {filteredOTs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {statusFilter === 'all' 
                ? 'No operation theatres found. Create your first OT!' 
                : `No operation theatres found with status "${statusFilter.replace('-', ' ')}".`}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOTs.map((ot) => (
                <div key={ot.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">OT {ot.ot_number}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedOT(ot);
                          setShowEditOTModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOT(ot.id, ot.ot_number)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Status: </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ot.status === 'available' ? 'bg-green-100 text-green-800' :
                      ot.status === 'in-use' ? 'bg-red-100 text-red-800' :
                      ot.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ot.status}
                    </span>
                  </div>


                  {(ot.doctor_name || ot.assignment_date || ot.assignment_time) && (
                    <p className="text-sm text-gray-600 mb-2">
                      {ot.doctor_name && (
                        <>Assigned Doctor: {ot.doctor_name}</>
                      )}
                      {ot.assignment_date && (
                        <> on {ot.assignment_date}</>
                      )}
                      {ot.assignment_time && (
                        <> at {formatTimeTo12Hour(ot.assignment_time)}</>
                      )}
                    </p>
                  )}

                  {ot.procedure_name && (
                    <p className="text-sm text-gray-600 mb-2">
                      Current Procedure: {ot.procedure_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </Card>

      {/* Add OT Modal */}
      <OTModal
        isOpen={showAddOTModal}
        onClose={() => setShowAddOTModal(false)}
        onSubmit={handleCreateOT}
        title="Add Operation Theatre"
        doctors={doctors}
      />

      {/* Edit OT Modal */}
      <OTModal
        isOpen={showEditOTModal}
        onClose={() => {
          setShowEditOTModal(false);
          setSelectedOT(null);
        }}
        onSubmit={handleUpdateOT}
        title="Edit Operation Theatre"
        initialData={selectedOT}
        doctors={doctors}
      />
    </div>
  );
};

// OT Modal Component
const OTModal = ({ isOpen, onClose, onSubmit, title, initialData = null, doctors = [] }) => {
  const [formData, setFormData] = useState({
    ot_number: initialData?.ot_number || '',
    status: initialData?.status || 'available',
    theatre: initialData?.theatre || '',
    current_procedure: initialData?.current_procedure || '',
    surgery_type: initialData?.surgery_type || '',
    doctor_id: initialData?.doctor_id || '',
    assignment_date: initialData?.assignment_date || '',
    assignment_time: initialData?.assignment_time || ''
  });

  // Update formData when initialData changes (for edit modal)
  useEffect(() => {
    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Helper function to format time for input[type="time"]
    const formatTimeForInput = (timeStr) => {
      if (!timeStr) return '';
      // If it's already in HH:MM format, return as is
      if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
      // If it's a full datetime, extract time
      const date = new Date(timeStr);
      return date.toTimeString().slice(0, 5); // HH:MM format
    };

    setFormData({
      ot_number: initialData?.ot_number || '',
      status: initialData?.status || 'available',
      theatre: initialData?.theatre || '',
      current_procedure: initialData?.current_procedure || '',
      surgery_type: initialData?.surgery_type || '',
      doctor_id: initialData?.doctor_id || '',
      assignment_date: formatDateForInput(initialData?.assignment_date),
      assignment_time: formatTimeForInput(initialData?.assignment_time)
    });
  }, [initialData]);

  // Clear doctor assignment fields when status is cleaning or maintenance
  useEffect(() => {
    if (formData.status === 'cleaning' || formData.status === 'maintenance') {
      setFormData(prev => ({
        ...prev,
        doctor_id: '',
        assignment_date: '',
        assignment_time: ''
      }));
    }
  }, [formData.status]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ot_number.trim()) {
      toast.error('OT number is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OT Number *
              </label>
              <input
                type="text"
                value={formData.ot_number}
                onChange={(e) => setFormData({ ...formData, ot_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter OT number"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-use">In Use</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="emergency">Emergency</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theatre Name
              </label>
              <input
                type="text"
                value={formData.theatre}
                onChange={(e) => setFormData({ ...formData, theatre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter theatre name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Procedure
              </label>
              <input
                type="text"
                value={formData.current_procedure}
                onChange={(e) => setFormData({ ...formData, current_procedure: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current procedure"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surgery Type
            </label>
            <input
              type="text"
              value={formData.surgery_type}
              onChange={(e) => setFormData({ ...formData, surgery_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter surgery type"
            />
          </div>

          {/* Doctor Assignment Section - Only show for non-cleaning/maintenance status */}
          {formData.status !== 'cleaning' && formData.status !== 'maintenance' && (
            <div className="border-t pt-4 mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-4">Doctor Assignment</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Doctor
                  </label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.department_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Date
                  </label>
                  <input
                    type="date"
                    value={formData.assignment_date}
                    onChange={(e) => setFormData({ ...formData, assignment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Time
                  </label>
                  <input
                    type="time"
                    value={formData.assignment_time}
                    onChange={(e) => setFormData({ ...formData, assignment_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Pharmacy Management Component
const PharmacyManagement = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [showEditDrugModal, setShowEditDrugModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const fetchDrugs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getAllDrugs();
      setDrugs(response.data || []);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      toast.error('Failed to fetch drugs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrugs();
  }, [fetchDrugs]);

  const handleCreateDrug = async (drugData) => {
    try {
      await pharmacyService.addDrug(drugData);
      toast.success('Drug added successfully');
      setShowAddDrugModal(false);
      fetchDrugs();
    } catch (error) {
      console.error('Error creating drug:', error);
      toast.error(error.response?.data?.error || 'Failed to add drug');
    }
  };

  const handleUpdateDrug = async (drugData) => {
    try {
      await pharmacyService.updateDrug(selectedDrug.id, drugData);
      toast.success('Drug updated successfully');
      setShowEditDrugModal(false);
      setSelectedDrug(null);
      fetchDrugs();
    } catch (error) {
      console.error('Error updating drug:', error);
      toast.error('Failed to update drug');
    }
  };

  const handleDeleteDrug = async (drugId, drugName) => {
    if (window.confirm(`Are you sure you want to delete ${drugName}? This action cannot be undone.`)) {
      try {
        await pharmacyService.deleteDrug(drugId);
        toast.success('Drug deleted successfully');
        fetchDrugs();
      } catch (error) {
        console.error('Error deleting drug:', error);
        toast.error('Failed to delete drug');
      }
    }
  };

  const handleUpdateStock = async (drugId, quantity, operation) => {
    try {
      await pharmacyService.updateStock(drugId, quantity, operation);
      toast.success('Stock updated successfully');
      fetchDrugs();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStockFilter = !showLowStock || (drug.current_stock <= drug.minimum_stock);
    
    return matchesSearch && matchesStockFilter;
  });

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pharmacy inventory...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pharmacy Inventory Management</h2>
            <Button 
              onClick={() => setShowAddDrugModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Drug
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search drugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Low Stock Only</span>
              </label>
            </div>
          </div>
          
          {filteredDrugs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No drugs found. Add your first drug!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrugs.map((drug) => (
                <div key={drug.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{drug.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDrug(drug);
                          setShowEditDrugModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDrug(drug.id, drug.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">Generic: {drug.generic_name}</p>
                  <p className="text-sm text-gray-600 mb-1">Category: {drug.category}</p>
                  
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Stock: </span>
                    <span className={`font-medium ${
                      drug.current_stock <= drug.minimum_stock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {drug.current_stock} {drug.unit}
                    </span>
                    {drug.current_stock <= drug.minimum_stock && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">Price: ₹{drug.unit_price}</p>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        const quantity = prompt('Enter quantity to add:');
                        if (quantity && !isNaN(quantity)) {
                          handleUpdateStock(drug.id, parseInt(quantity), 'add');
                        }
                      }}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Add Stock
                    </button>
                    <button
                      onClick={() => {
                        const quantity = prompt('Enter quantity to remove:');
                        if (quantity && !isNaN(quantity)) {
                          handleUpdateStock(drug.id, parseInt(quantity), 'remove');
                        }
                      }}
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Remove Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add Drug Modal */}
      <DrugModal
        isOpen={showAddDrugModal}
        onClose={() => setShowAddDrugModal(false)}
        onSubmit={handleCreateDrug}
        title="Add Drug"
      />

      {/* Edit Drug Modal */}
      <DrugModal
        isOpen={showEditDrugModal}
        onClose={() => {
          setShowEditDrugModal(false);
          setSelectedDrug(null);
        }}
        onSubmit={handleUpdateDrug}
        title="Edit Drug"
        initialData={selectedDrug}
      />
    </div>
  );
};

// Drug Modal Component
const DrugModal = ({ isOpen, onClose, onSubmit, title, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    generic_name: initialData?.generic_name || '',
    category: initialData?.category || '',
    description: initialData?.description || '',
    dosage: initialData?.dosage || '',
    unit: initialData?.unit || 'tablets',
    unit_price: initialData?.unit_price || '',
    current_stock: initialData?.current_stock || '',
    minimum_stock: initialData?.minimum_stock || '',
    expiry_date: initialData?.expiry_date || '',
    manufacturer: initialData?.manufacturer || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData?.name || '',
        generic_name: initialData?.generic_name || '',
        category: initialData?.category || '',
        description: initialData?.description || '',
        dosage: initialData?.dosage || '',
        unit: initialData?.unit || 'tablets',
        unit_price: initialData?.unit_price || '',
        current_stock: initialData?.current_stock || '',
        minimum_stock: initialData?.minimum_stock || '',
        expiry_date: initialData?.expiry_date || '',
        manufacturer: initialData?.manufacturer || ''
      });
    } else if (isOpen && !initialData) {
      // Reset form for new drug
      setFormData({
        name: '',
        generic_name: '',
        category: '',
        description: '',
        dosage: '',
        unit: 'tablets',
        unit_price: '',
        current_stock: '',
        minimum_stock: '',
        expiry_date: '',
        manufacturer: ''
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category.trim()) {
      toast.error('Drug name and category are required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drug Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter drug name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generic Name
              </label>
              <input
                type="text"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter generic name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dosage"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tablets">Tablets</option>
                <option value="capsules">Capsules</option>
                <option value="ml">ML</option>
                <option value="mg">MG</option>
                <option value="bottles">Bottles</option>
                <option value="strips">Strips</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stock
              </label>
              <input
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current stock"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock
              </label>
              <input
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter minimum stock"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manufacturer"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
              rows={3}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingStaff, setPendingStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staffFilter, setStaffFilter] = useState('all'); // 'all', 'pending'
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDoctorAssignmentModal, setShowDoctorAssignmentModal] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffResponse, deptResponse, allStaffResponse] = await Promise.all([
        departmentService.getPendingStaff(),
        departmentService.getAllDepartments(),
        departmentService.getAllStaff()
      ]);
      
      setPendingStaff(staffResponse.pendingStaff || []);
      setDepartments(deptResponse.departments || []);
      setAllStaff(allStaffResponse.staff || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStaff = async (userId) => {
    try {
      await departmentService.approveStaff(userId);
      toast.success('Staff member approved successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error approving staff:', error);
      toast.error('Failed to approve staff member');
    }
  };

  const handleRejectStaff = async (userId, reason = '') => {
    try {
      await departmentService.rejectStaff(userId, reason);
      toast.success('Staff member rejected and removed');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting staff:', error);
      toast.error('Failed to reject staff member');
    }
  };

  const handleDeleteStaff = async (userId, staffName) => {
    if (window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      try {
        await departmentService.deleteStaff(userId);
        toast.success('Staff member deleted successfully');
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting staff:', error);
        toast.error('Failed to delete staff member');
      }
    }
  };

  const handleCreateDepartment = async (departmentData) => {
    try {
      await departmentService.createDepartment(departmentData);
      toast.success('Department created successfully');
      setShowAddDepartmentModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Failed to create department');
    }
  };

  const handleUpdateDepartment = async (departmentData) => {
    try {
      await departmentService.updateDepartment(selectedDepartment.id, departmentData);
      toast.success('Department updated successfully');
      setShowEditDepartmentModal(false);
      setSelectedDepartment(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    }
  };

  const handleToggleDepartmentStatus = async (departmentId) => {
    try {
      await departmentService.toggleDepartmentStatus(departmentId);
      toast.success('Department status updated successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error toggling department status:', error);
      toast.error('Failed to update department status');
    }
  };

  const handleDeleteDepartment = async (departmentId, departmentName) => {
    if (window.confirm(`Are you sure you want to delete ${departmentName}? This action cannot be undone.`)) {
      try {
        await departmentService.deleteDepartment(departmentId);
        toast.success('Department deleted successfully');
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting department:', error);
        toast.error('Failed to delete department');
      }
    }
  };

  const fetchAvailableDoctors = async () => {
    try {
      const response = await departmentService.getUnassignedDoctors();
      setAvailableDoctors(response.doctors || []);
    } catch (error) {
      console.error('Error fetching unassigned doctors:', error);
      setAvailableDoctors([]);
    }
  };

  const handleAssignDoctor = async (departmentId, doctorId) => {
    try {
      await departmentService.addDoctorToDepartment(departmentId, doctorId);
      toast.success('Doctor assigned successfully');
      setShowDoctorAssignmentModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error assigning doctor:', error);
      toast.error('Failed to assign doctor');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 mb-4">Current role: {user?.role || 'None'}</p>
            <Button href="/dashboard">Go to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'staff', label: 'Staff Management', icon: '👥' },
    { id: 'departments', label: 'Departments', icon: '🏥' },
    { id: 'ot', label: 'OT Management', icon: '🚪' },
    { id: 'pharmacy', label: 'Pharmacy', icon: '💊' },
    { id: 'display', label: 'Display', icon: '📺' },
    { id: 'system', label: 'System Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user?.name}. Manage your hospital system.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <ResponsiveTabs 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            forceDropdownOn="md"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="text-3xl">👥</div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Staff</p>
                        <p className="text-2xl font-bold text-gray-900">{pendingStaff.length}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="text-3xl">🏥</div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Departments</p>
                        <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="text-3xl">✅</div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">System Status</p>
                        <p className="text-lg font-bold text-green-600">Online</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="text-3xl">📈</div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Activity</p>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Staff Management Tab */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                {/* Staff Filter */}
                <Card>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setStaffFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          staffFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All Staff ({allStaff.filter(s => s.status === 'approved' || s.is_approved).length})
                      </button>
                      <button
                        onClick={() => setStaffFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          staffFilter === 'pending'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pending Approval ({allStaff.filter(s => s.status === 'pending').length})
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Staff List */}
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {staffFilter === 'all' && 'All Approved Staff Members'}
                      {staffFilter === 'pending' && 'Pending Staff Approvals'}
                    </h2>
                    
                    {(() => {
                      const filteredStaff = allStaff.filter(staff => {
                        if (staffFilter === 'pending') return staff.status === 'pending';
                        if (staffFilter === 'all') return staff.status === 'approved' || staff.is_approved;
                        return false;
                      });

                      if (filteredStaff.length === 0) {
                        return (
                          <p className="text-gray-500">
                            {staffFilter === 'pending' && 'No pending staff approvals.'}
                            {staffFilter === 'all' && 'No approved staff members.'}
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {filteredStaff.map((staff) => (
                            <div key={staff.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900">{staff.name}</h3>
                                  <p className="text-sm text-gray-600">{staff.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-600">Role: {staff.role}</span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      staff.status === 'pending' 
                                        ? 'bg-orange-100 text-orange-800'
                                        : staff.status === 'approved' || staff.is_approved
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {staff.status === 'pending' ? 'Pending' : 
                                       staff.status === 'approved' || staff.is_approved ? 'Approved' : 'Unknown'}
                                    </span>
                                  </div>
                                  {staff.department_name && (
                                    <p className="text-sm text-gray-600">Department: {staff.department_name}</p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    Registered: {new Date(staff.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {staff.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => handleApproveStaff(staff.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                        size="sm"
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        onClick={() => handleRejectStaff(staff.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                        size="sm"
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {(staff.status === 'approved' || staff.is_approved) && (
                                    <>
                                      <span className="text-green-600 text-sm font-medium">✓ Approved</span>
                                      <Button
                                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                        className="bg-red-600 hover:bg-red-700 ml-2"
                                        size="sm"
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
                      <Button 
                        onClick={() => setShowAddDepartmentModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add Department
                      </Button>
                    </div>
                    
                    {departments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No departments found. Create your first department!</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map((dept) => (
                          <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900">{dept.name}</h3>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedDepartment(dept);
                                    setShowEditDepartmentModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{dept.description}</p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Status:</span>
                                <button
                                  onClick={() => handleToggleDepartmentStatus(dept.id)}
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                                    dept.is_active 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                >
                                  {dept.is_active ? 'Active' : 'Inactive'}
                                </button>
                              </div>
                            </div>
                            
                            <div className="border-t pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Doctors: {dept.doctor_count || 0}</span>
                                <Button
                                  onClick={() => {
                                    setSelectedDepartment(dept);
                                    fetchAvailableDoctors();
                                    setShowDoctorAssignmentModal(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  Manage Doctors
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* OT Management Tab */}
            {activeTab === 'ot' && (
              <OTManagement />
            )}

            {/* Pharmacy Management Tab */}
            {activeTab === 'pharmacy' && (
              <PharmacyManagement />
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <DisplayBoard />
            )}

            {/* System Settings Tab */}
            {activeTab === 'system' && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">Token Time Settings</h3>
                      <p className="text-sm text-gray-600 mt-1">Configure token generation hours and automatic cleanup</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => navigate('/admin/token-settings')}
                      >
                        Configure Token Times
                      </Button>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">Database Status</h3>
                      <p className="text-sm text-gray-600 mt-1">Monitor database connectivity and performance</p>
                      <Button variant="outline" size="sm" className="mt-2">Check Status</Button>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">System Backup</h3>
                      <p className="text-sm text-gray-600 mt-1">Create and manage system backups</p>
                      <Button variant="outline" size="sm" className="mt-2">Create Backup</Button>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">System Logs</h3>
                      <p className="text-sm text-gray-600 mt-1">View system logs and error reports</p>
                      <Button variant="outline" size="sm" className="mt-2">View Logs</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
        
        {/* Add Department Modal */}
        {showAddDepartmentModal && (
          <DepartmentModal
            isOpen={showAddDepartmentModal}
            onClose={() => setShowAddDepartmentModal(false)}
            onSubmit={handleCreateDepartment}
            title="Add New Department"
          />
        )}
        
        {/* Edit Department Modal */}
        {showEditDepartmentModal && selectedDepartment && (
          <DepartmentModal
            isOpen={showEditDepartmentModal}
            onClose={() => {
              setShowEditDepartmentModal(false);
              setSelectedDepartment(null);
            }}
            onSubmit={handleUpdateDepartment}
            title="Edit Department"
            initialData={selectedDepartment}
          />
        )}
        
        {/* Doctor Assignment Modal */}
        {showDoctorAssignmentModal && selectedDepartment && (
          <DoctorAssignmentModal
            isOpen={showDoctorAssignmentModal}
            onClose={() => {
              setShowDoctorAssignmentModal(false);
              setSelectedDepartment(null);
            }}
            department={selectedDepartment}
            availableDoctors={availableDoctors}
            onAssignDoctor={handleAssignDoctor}
            onRefreshAvailableDoctors={fetchAvailableDoctors}
            onRefreshDepartments={fetchData}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
