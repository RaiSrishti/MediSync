const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const userModel = new User();

// ===== Helper functions =====
const generateAccessToken = (user) => {
  return jwt.sign({ _id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ _id: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

// Hash refresh token before DB storage
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Common cookie settings (keeping as fallback, but removing problematic domain)
const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None',
  maxAge: 15 * 60 * 1000, // 15 min
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Cookie clear options (without maxAge to avoid deprecation warning)
const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None',
};

// ===== Register =====
const signUp = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', department_id } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const userExists = await userModel.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role and department requirements
    const allowedRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role specified',
        allowedRoles: allowedRoles
      });
    }

    // Department is required for doctors and nurses
    if (['doctor', 'nurse'].includes(role) && !department_id) {
      return res.status(400).json({ message: `Department is required for ${role}s` });
    }

    // Create user account
    const newUser = await userModel.createUser({ 
      name, 
      email, 
      password, 
      role,
      department_id: (['doctor', 'nurse'].includes(role)) ? department_id : null
    });

    // Handle different registration flows based on role
    if (role === 'patient') {
      // Normal patient registration flow with immediate approval
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Store hashed refresh token in DB
      await userModel.updateRefreshToken(newUser.id, hashToken(refreshToken));

      // Set cookies (fallback for browsers that support them)
      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

      // Check for existing patient profile
      let linkedPatient = null;
      const Patient = require('../models/Patient');
      const patientModel = new Patient();
      const existingPatient = await patientModel.findUnlinkedByEmail(email);
      
      if (existingPatient) {
        // Link existing patient profile to new user account
        await patientModel.linkToUser(existingPatient.id, newUser.id);
        linkedPatient = existingPatient;
        
        return res.status(201).json({
          message: 'Registration successful! Your medical profile has been linked.',
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
          tokens: {
            accessToken,
            refreshToken
          },
          hasExistingProfile: true,
          patientProfile: {
            id: existingPatient.id,
            name: existingPatient.name,
            createdByStaff: true
          }
        });
      } else {
        // Create a basic patient profile for new registration
        const basicPatientData = {
          user_id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          age: null,
          gender: null,
          blood_group: null,
          phone_number: null,
          address: null,
          medical_history: null,
          current_medications: null,
          allergies: null,
          emergency_contact: null
        };
        
        const newPatientProfile = await patientModel.createPatient(basicPatientData, newUser.id);
        
        return res.status(201).json({
          message: 'Registration successful! A basic medical profile has been created for you.',
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
          tokens: {
            accessToken,
            refreshToken
          },
          hasExistingProfile: false,
          patientProfile: {
            id: newPatientProfile.id,
            name: newPatientProfile.name,
            createdByStaff: false
          }
        });
      }
    } else if (role === 'admin') {
      // Admin registration (if needed) - immediate approval
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Store hashed refresh token in DB
      await userModel.updateRefreshToken(newUser.id, hashToken(refreshToken));

      // Set cookies (fallback for browsers that support them)
      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

      return res.status(201).json({
        message: 'Admin registration successful!',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });

    } else {
      // Staff registration (doctor, nurse, receptionist, pharmacist) - requires approval
      return res.status(201).json({
        message: 'Registration submitted! Your account is pending admin approval.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: 'pending'
        },
        requiresApproval: true
      });
    }
  } catch (err) {
    console.error('SignUp error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== Login =====
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await userModel.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if staff member is approved (patients and admins are auto-approved)
    if (['doctor', 'nurse', 'receptionist', 'pharmacist'].includes(user.role)) {
      if (user.status === 'pending') {
        return res.status(403).json({ 
          message: 'Your account is pending admin approval. Please wait for approval.',
          status: 'pending'
        });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ 
          message: 'Your account has been rejected. Contact administrator for more information.',
          status: 'rejected',
          reason: user.rejection_reason
        });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ 
          message: 'Your account has been suspended. Contact administrator for more information.',
          status: 'suspended',
          reason: user.rejection_reason
        });
      }
      if (!user.is_approved || user.status !== 'approved') {
        return res.status(403).json({ 
          message: 'Your account is not approved for login.',
          status: user.status
        });
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Hash and store refresh token
    await userModel.updateRefreshToken(user.id, hashToken(refreshToken));

    // Set cookies (fallback for browsers that support them)
    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        status: user.status || 'approved'
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== Logout =====
const logout = async (req, res) => {
  try {
    // Try to get refresh token from cookie first, then from request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      await userModel.clearRefreshTokenByHashed(hashToken(refreshToken));
    }

    res.clearCookie('accessToken', clearCookieOptions);
    res.clearCookie('refreshToken', clearCookieOptions);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== Refresh Token =====
const refresh = async (req, res) => {
  // Try to get refresh token from cookie first, then from request body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const hashedToken = hashToken(refreshToken);
    const user = await userModel.findByRefreshToken(hashedToken);
    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token in DB
    await userModel.updateRefreshToken(user.id, hashToken(newRefreshToken));

    // Update cookies (fallback for browsers that support them)
    res.cookie('accessToken', newAccessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions);

    res.status(200).json({ 
      message: 'Token refreshed',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        status: user.status || 'approved'
      },
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (err) {
    console.error('Refresh error:', err.message);
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

// ===== Get Current User =====
const getCurrentUser = async (req, res) => {
  try {
    // User info is already attached by auth middleware
    const user = req.user;
    
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        status: user.status || 'approved'
      }
    });
  } catch (err) {
    console.error('Get current user error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signUp,
  login,
  logout,
  refresh,
  getCurrentUser,
};
