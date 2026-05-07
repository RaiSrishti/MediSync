const Department = require('../models/Department');
const User = require('../models/User');
const departmentModel = new Department();
const userModel = new User();

// Create new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // Check if department already exists
    const existing = await departmentModel.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Department already exists' });
    }

    const newDepartment = await departmentModel.create({
      name,
      description,
      is_active: true,
      current_token: 0,
      last_token_number: 0,
      doctors: departmentModel.constructor.stringifyStaffField([]), // Initialize empty doctor array
      nurses: departmentModel.constructor.stringifyStaffField([])   // Initialize empty nurse array
    });

    res.status(201).json({
      message: 'Department created successfully',
      department: newDepartment
    });
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const { active_only, include_staff } = req.query;
    
    let departments;
    if (active_only === 'true') {
      departments = await departmentModel.findAll({ is_active: true });
    } else {
      departments = await departmentModel.findAll();
    }

    // Include staff counts for all departments
    const departmentsWithCounts = await Promise.all(departments.map(async (dept) => {
      try {
        const doctors = await departmentModel.getDepartmentDoctors(dept.id);
        const nurses = await departmentModel.db('users')
          .where('department_id', dept.id)
          .where('role', 'nurse')
          .where('status', 'approved')
          .select('id', 'name', 'email');
        
        const departmentWithCounts = {
          ...dept,
          doctor_count: doctors.length,
          nurse_count: nurses.length
        };

        // Include full staff information if requested
        if (include_staff === 'true') {
          departmentWithCounts.doctors = doctors;
          departmentWithCounts.nurses = nurses;
        }

        return departmentWithCounts;
      } catch (error) {
        console.error(`Error getting counts for department ${dept.id}:`, error);
        return {
          ...dept,
          doctor_count: 0,
          nurse_count: 0
        };
      }
    }));

    res.json({
      departments: departmentsWithCounts,
      count: departmentsWithCounts.length
    });
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Get department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { include_staff } = req.query;
    
    let department;
    if (include_staff === 'true') {
      department = await departmentModel.getDepartmentWithStaff(req.params.id);
    } else {
      department = await departmentModel.findById(req.params.id);
    }
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    console.error('Get department error:', err);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

// Get department doctors (available doctors)
exports.getDepartmentDoctors = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    const doctors = await departmentModel.getDepartmentDoctors(departmentId);
    
    res.json({
      departmentId,
      doctors
    });
  } catch (err) {
    console.error('Get department doctors error:', err);
    res.status(500).json({ error: 'Failed to fetch department doctors' });
  }
};

// Get department doctors with availability status
exports.getDepartmentDoctorsWithAvailability = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Get doctors in the department
    const doctors = await departmentModel.getDepartmentDoctors(departmentId);
    
    // Get current availability for each doctor
    const doctorsWithAvailability = await Promise.all(doctors.map(async (doctor) => {
      try {
        // Check if doctor has availability status for today
        const availability = await userModel.db('doctor_availability')
          .where('doctor_id', doctor.id)
          .where('date', userModel.db.raw('CURDATE()'))
          .first();

        return {
          ...doctor,
          availability: availability ? {
            status: availability.status || 'available',
            location: availability.location || 'Department',
            updated_at: availability.updated_at
          } : {
            status: 'available',
            location: 'Department',
            updated_at: null
          }
        };
      } catch (error) {
        console.error(`Error getting availability for doctor ${doctor.id}:`, error);
        return {
          ...doctor,
          availability: {
            status: 'unknown',
            location: 'Unknown',
            updated_at: null
          }
        };
      }
    }));
    
    res.json({
      departmentId,
      doctors: doctorsWithAvailability,
      count: doctorsWithAvailability.length
    });
  } catch (err) {
    console.error('Get department doctors with availability error:', err);
    res.status(500).json({ error: 'Failed to fetch department doctors with availability' });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const existing = await departmentModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if new name conflicts with existing department
    if (name && name !== existing.name) {
      const nameExists = await departmentModel.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ error: 'Department name already exists' });
      }
    }

    const updated = await departmentModel.update(req.params.id, {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description
    });

    res.json({
      message: 'Department updated successfully',
      department: updated
    });
  } catch (err) {
    console.error('Update department error:', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const deleted = await departmentModel.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

// Toggle department active status
exports.toggleDepartmentStatus = async (req, res) => {
  try {
    const department = await departmentModel.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const updated = await departmentModel.update(req.params.id, {
      is_active: !department.is_active
    });

    res.json({
      message: `Department ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
      department: updated
    });
  } catch (err) {
    console.error('Toggle department status error:', err);
    res.status(500).json({ error: 'Failed to update department status' });
  }
};

// Add doctor to department (Admin only)
exports.addDoctorToDepartment = async (req, res) => {
  try {
    const { departmentId, doctorId } = req.params;

    // Verify doctor exists and has correct role
    const doctor = await userModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    if (doctor.role !== 'doctor') {
      return res.status(400).json({ error: 'User is not a doctor' });
    }
    if (doctor.status !== 'approved') {
      return res.status(400).json({ error: 'Doctor is not approved' });
    }

    // Verify department exists
    const department = await departmentModel.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if this is the first doctor being assigned
    const currentDoctors = await departmentModel.getDepartmentDoctors(departmentId);
    const isFirstDoctor = currentDoctors.length === 0;

    // Update doctor's department_id
    await userModel.update(doctorId, { department_id: departmentId });
    
    // If this is the first doctor and department is inactive, activate it
    if (isFirstDoctor && !department.is_active) {
      await departmentModel.update(departmentId, { is_active: true });
    }
    
    res.json({
      message: 'Doctor assigned to department successfully',
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        department_id: departmentId
      },
      departmentStatus: isFirstDoctor && !department.is_active ? 'activated' : 'active'
    });
  } catch (err) {
    console.error('Add doctor to department error:', err);
    res.status(500).json({ error: 'Failed to add doctor to department' });
  }
};

// Remove doctor from department (Admin only)
exports.removeDoctorFromDepartment = async (req, res) => {
  try {
    const { departmentId, doctorId } = req.params;

    // Verify doctor exists
    const doctor = await userModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Remove doctor from department by setting department_id to null
    await userModel.update(doctorId, { department_id: null });
    
    // Get department info to check if it should always stay active
    const department = await departmentModel.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Departments that should always stay active regardless of doctor count
    const alwaysActiveDepartments = ['pharmacy', 'reception', 'administration', 'emergency'];
    
    // Check if department now has 0 doctors and set to inactive if so
    // BUT keep certain departments always active
    const remainingDoctors = await departmentModel.getDepartmentDoctors(departmentId);
    
    const shouldStayActive = department && alwaysActiveDepartments.includes(department.name.toLowerCase());
    
    if (remainingDoctors.length === 0 && department && !shouldStayActive) {
      // Deactivate department if no doctors remain and it's not in always-active list
      await departmentModel.update(departmentId, { is_active: false });
    }
    
    const finalStatus = remainingDoctors.length === 0 && !shouldStayActive ? 'inactive' : 'active';
    
    res.json({
      message: 'Doctor removed from department successfully',
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        department_id: null
      },
      departmentStatus: finalStatus
    });
  } catch (err) {
    console.error('Remove doctor from department error:', err);
    res.status(500).json({ error: 'Failed to remove doctor from department' });
  }
};

// Add nurse to department (Admin only)
exports.addNurseToDepartment = async (req, res) => {
  try {
    const { departmentId, nurseId } = req.params;

    // Verify nurse exists and has correct role
    const nurse = await userModel.findById(nurseId);
    if (!nurse) {
      return res.status(404).json({ error: 'Nurse not found' });
    }
    if (nurse.role !== 'nurse') {
      return res.status(400).json({ error: 'User is not a nurse' });
    }
    if (nurse.status !== 'approved') {
      return res.status(400).json({ error: 'Nurse is not approved' });
    }

    const updated = await departmentModel.addNurse(departmentId, parseInt(nurseId));
    
    res.json({
      message: 'Nurse added to department successfully',
      department: updated
    });
  } catch (err) {
    console.error('Add nurse to department error:', err);
    res.status(500).json({ error: 'Failed to add nurse to department' });
  }
};

// Remove nurse from department (Admin only)
exports.removeNurseFromDepartment = async (req, res) => {
  try {
    const { departmentId, nurseId } = req.params;

    const updated = await departmentModel.removeNurse(departmentId, parseInt(nurseId));
    
    res.json({
      message: 'Nurse removed from department successfully',
      department: updated
    });
  } catch (err) {
    console.error('Remove nurse from department error:', err);
    res.status(500).json({ error: 'Failed to remove nurse from department' });
  }
};

// Get pending staff for approval (Admin only)
exports.getPendingStaff = async (req, res) => {
  try {
    const pendingStaff = await userModel.findPendingStaff();
    
    // Remove sensitive information
    const sanitizedStaff = pendingStaff.map(staff => {
      const { password, refresh_token, ...rest } = staff;
      return rest;
    });

    res.json({
      pendingStaff: sanitizedStaff,
      count: sanitizedStaff.length
    });
  } catch (err) {
    console.error('Get pending staff error:', err);
    res.status(500).json({ error: 'Failed to fetch pending staff' });
  }
};

// Get all staff members (Admin only)
exports.getAllStaff = async (req, res) => {
  try {
    const allStaff = await userModel.findAllStaff();
    
    // Remove sensitive information
    const sanitizedStaff = allStaff.map(staff => {
      const { password, refresh_token, ...rest } = staff;
      return rest;
    });

    res.json({
      staff: sanitizedStaff,
      count: sanitizedStaff.length
    });
  } catch (err) {
    console.error('Get all staff error:', err);
    res.status(500).json({ error: 'Failed to fetch all staff' });
  }
};

// Approve staff member (Admin only)
exports.approveStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const departmentId = req.body?.departmentId; // Make optional
    const adminId = req.user.id;

    const approvedUser = await userModel.approveStaff(userId, adminId);

    // If approving a doctor or nurse and department is specified, add them to department
    if ((approvedUser.role === 'doctor' || approvedUser.role === 'nurse') && departmentId) {
      if (approvedUser.role === 'doctor') {
        await departmentModel.addDoctor(departmentId, parseInt(userId));
      } else {
        await departmentModel.addNurse(departmentId, parseInt(userId));
      }
    }

    res.json({
      message: 'Staff member approved successfully',
      user: userModel.sanitizeUser(approvedUser)
    });
  } catch (err) {
    console.error('Approve staff error:', err);
    res.status(500).json({ error: 'Failed to approve staff member' });
  }
};

// Reject staff member (Admin only)
exports.rejectStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const reason = req.body?.reason || 'No reason provided'; // Provide default reason
    const adminId = req.user.id;

    const rejectedUser = await userModel.rejectStaff(userId, adminId, reason);

    res.json({
      message: 'Staff member rejected successfully',
      user: userModel.sanitizeUser(rejectedUser)
    });
  } catch (err) {
    console.error('Reject staff error:', err);
    res.status(500).json({ error: 'Failed to reject staff member' });
  }
};

// Delete staff member (Admin only)
exports.deleteStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Get user info before deletion for logging
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Check if user is a staff member
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'pharmacist'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(400).json({ error: 'Only staff members can be deleted' });
    }

    // Delete the user
    await userModel.delete(userId);

    res.json({
      message: 'Staff member deleted successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        deleted: true
      }
    });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
};

// Get approved staff by role (Admin only)
exports.getApprovedStaffByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'pharmacist'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const staff = await userModel.findApprovedStaffByRole(role);
    
    // Remove sensitive information
    const sanitizedStaff = staff.map(member => {
      const { password, refresh_token, ...rest } = member;
      return rest;
    });

    res.json({
      staff: sanitizedStaff,
      count: sanitizedStaff.length
    });
  } catch (err) {
    console.error('Get approved staff error:', err);
    res.status(500).json({ error: 'Failed to fetch approved staff' });
  }
};

// Get unassigned doctors (doctors without department_id)
exports.getUnassignedDoctors = async (req, res) => {
  try {
    const unassignedDoctors = await userModel.db('users')
      .where('role', 'doctor')
      .where('status', 'approved')
      .whereNull('department_id')
      .select('id', 'name', 'email', 'created_at');
    
    res.json({
      doctors: unassignedDoctors,
      count: unassignedDoctors.length
    });
  } catch (err) {
    console.error('Get unassigned doctors error:', err);
    res.status(500).json({ error: 'Failed to fetch unassigned doctors' });
  }
};

// Test endpoint to debug department status
exports.debugDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get department info
    const department = await departmentModel.findById(id);
    
    // Get department doctors
    const doctors = await departmentModel.getDepartmentDoctors(id);
    
    // Check if it should be active
    const alwaysActiveDepartments = ['pharmacy', 'reception', 'administration', 'emergency'];
    const shouldStayActive = department && alwaysActiveDepartments.includes(department.name.toLowerCase());
    
    res.json({
      department: department,
      doctors: doctors,
      doctorCount: doctors.length,
      shouldStayActive: shouldStayActive,
      currentStatus: department ? department.is_active : null,
      suggestedStatus: shouldStayActive || doctors.length > 0
    });
  } catch (err) {
    console.error('Debug department status error:', err);
    res.status(500).json({ error: 'Failed to debug department status' });
  }
};
