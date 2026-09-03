const express = require('express');
const router = express.Router();
const { getUsers, getAssignableUsers, createUser, deleteUser, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/assignable')
  .get(protect, getAssignableUsers);

router.route('/')
  .get(protect, authorize('Users', 'View'), getUsers)
  .post(protect, authorize('Users', 'Create'), createUser);

router.route('/:id')
  .put(protect, authorize('Users', 'Edit'), updateUser)
  .delete(protect, authorize('Users', 'Delete'), deleteUser);

module.exports = router;
