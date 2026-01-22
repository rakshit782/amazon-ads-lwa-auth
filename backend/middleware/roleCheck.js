const User = require('../models/User');
const { ROLES } = require('../models/User');

// Check if user has required role
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
      }

      // Check role hierarchy
      if (!User.hasPermission(user.role, requiredRole)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredRole,
          current: user.role
        });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

// Check if user owns resource or is MASTER
const requireOwnership = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // MASTER can access everything
    if (user.role === ROLES.MASTER) {
      req.userRole = user.role;
      req.isMaster = true;
      return next();
    }

    // For ADMIN and USER, check ownership
    const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
    
    if (resourceUserId && parseInt(resourceUserId) !== user.id) {
      return res.status(403).json({ 
        error: 'You can only access your own resources' 
      });
    }

    req.userRole = user.role;
    req.isMaster = false;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Read-only check (allows all authenticated users to view)
const allowRead = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    req.userRole = user.role;
    req.isMaster = user.role === ROLES.MASTER;
    next();
  } catch (error) {
    console.error('Read permission error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Write permission check (ADMIN and MASTER only)
const requireWrite = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // USER role cannot write
    if (user.role === ROLES.USER) {
      return res.status(403).json({ 
        error: 'Read-only access. Contact administrator for write permissions.' 
      });
    }

    req.userRole = user.role;
    req.isMaster = user.role === ROLES.MASTER;
    next();
  } catch (error) {
    console.error('Write permission error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

module.exports = {
  requireRole,
  requireOwnership,
  allowRead,
  requireWrite,
  ROLES
};