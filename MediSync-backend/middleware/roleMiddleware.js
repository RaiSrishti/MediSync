// middleware/roleMiddleware.js

// Check if user has required role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Check if user can create patients
const canCreatePatients = requireRole(['admin', 'doctor']);

// Check if user can view all patients
const canViewAllPatients = requireRole(['admin', 'doctor', 'nurse', 'receptionist']);

// Check if user can manage patients (full access)
const canManagePatients = requireRole(['admin', 'doctor']);

// Check if user can manage tokens (doctors only)
const canManageTokens = requireRole(['admin', 'doctor']);

// Check if user can set token priority (doctors only)
const canSetTokenPriority = requireRole(['admin', 'doctor']);

// Check if user has admin privileges
const adminOnly = requireRole(['admin']);

// Check if user can manage departments (admin only)
const canManageDepartments = requireRole(['admin']);

// Check if user can manage staff (admin only)
const canManageStaff = requireRole(['admin']);

// Check if user can access patient data (including own profile)
const canAccessPatientData = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userRole = req.user.role;
  const allowedRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'patient'];

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // If patient role, they can only access their own data
  if (userRole === 'patient') {
    req.patientAccessOnly = true; // Flag for controllers to restrict access
  }

  next();
};

module.exports = {
  requireRole,
  canCreatePatients,
  canViewAllPatients,
  canManagePatients,
  canManageTokens,
  canSetTokenPriority,
  adminOnly,
  canManageDepartments,
  canManageStaff,
  canAccessPatientData
};
