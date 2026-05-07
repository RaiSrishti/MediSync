const jwt = require('jsonwebtoken');
const User = require('../models/User');
const userModel = new User();

const authMiddleware = async (req, res, next) => {
  try {
    // Get access token from Authorization header first, then from cookie
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access token missing' });
    }

    // Verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      try {
        // Fetch full user data from database
        const user = await userModel.findById(decoded._id);
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        // Base user data
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department_id: user.department_id,
          status: user.status
        };

        // For patients, also get their patient profile ID
        if (user.role === 'patient') {
          const Patient = require('../models/Patient');
          const patientModel = new Patient();
          const patientProfile = await patientModel.findByUserId(user.id);
          
          if (patientProfile) {
            req.user.patient_id = patientProfile.id;
          }
        }

        next();
      } catch (dbError) {
        console.error('Database error in auth middleware:', dbError.message);
        return res.status(500).json({ message: 'Database error' });
      }
    });
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = authMiddleware;
