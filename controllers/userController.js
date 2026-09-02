const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate('manager', 'name email')
      .populate('role', 'name')
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new user by Admin
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { name, email, password, role, manager } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roleDoc = await Role.findById(role);
    const isExecutive = roleDoc && roleDoc.name === 'Sales Executive';

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role,
      manager: isExecutive ? manager : undefined
    });

    if (user) {
      const populatedUser = await User.findById(user._id).populate('role', 'name');
      res.status(201).json(populatedUser);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role', 'name');

    if (user) {
      if (user.role && user.role.name === 'Admin') {
        return res.status(400).json({ message: 'Cannot delete admin user' });
      }
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.role) {
        user.role = req.body.role;
      }
      
      if (req.body.isActive !== undefined) {
        user.isActive = req.body.isActive;
      }
      
      const roleDoc = await Role.findById(user.role);
      const isExecutive = roleDoc && roleDoc.name === 'Sales Executive';

      // Only set manager if it's a Sales Executive
      if (isExecutive) {
        user.manager = req.body.manager || user.manager;
      } else {
        user.manager = undefined; // Managers/Admins don't have managers in this setup
      }

      // Admin updating someone's password
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        manager: updatedUser.manager
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, deleteUser, updateUser };
