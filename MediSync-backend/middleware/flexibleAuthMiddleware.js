const jwt = require('jsonwebtoken');

const flexibleAuthMiddleware = (req, res, next) => {
  try {
    // Try HTTP-only cookie first (normal authentication)
    let token = req.cookies.accessToken;
    let tokenType = 'normal';

    // If no cookie token, try Authorization header (for emergency access)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        tokenType = 'bearer';
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token missing' 
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          success: false,
          message: 'Invalid or expired token' 
        });
      }

      // Handle different token types
      if (decoded.type === 'emergency' || decoded.type === 'emergency_quick') {
        // Emergency token
        req.user = {
          id: 'emergency_user',
          role: 'emergency',
          access_level: decoded.access_level,
          token_type: decoded.type
        };
      } else {
        // Normal user token
        req.user = {
          id: decoded._id || decoded.id,
          role: decoded.role,
          access_level: 'full',
          token_type: 'normal'
        };
      }

      next();
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = flexibleAuthMiddleware;
