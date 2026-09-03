const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('role');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (moduleName, action) => {
  return (req, res, next) => {
    const role = req.user.role;
    if (!role || !role.permissions) {
      return res.status(403).json({ message: 'No role assigned or invalid role' });
    }

    const perm = role.permissions.find(p => p.module === moduleName);
    
    // Check if permission exists and action is included
    if (!perm || !perm.actions.includes(action)) {
      return res.status(403).json({
        message: `User is not authorized to ${action} in ${moduleName}`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
