const express = require('express');
const router = express.Router();
const { getRoles, getRoleById, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Roles', 'View'), getRoles)
  .post(protect, authorize('Roles', 'Create'), createRole);

router.route('/:id')
  .get(protect, authorize('Roles', 'View'), getRoleById)
  .put(protect, authorize('Roles', 'Edit'), updateRole)
  .delete(protect, authorize('Roles', 'Delete'), deleteRole);

module.exports = router;
