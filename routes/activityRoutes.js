const express = require('express');
const router = express.Router();
const { getActivities, createActivity, updateActivity } = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Activities', 'View'), getActivities)
  .post(protect, authorize('Activities', 'Create'), createActivity);

router.route('/:id')
  .put(protect, authorize('Activities', 'Edit'), updateActivity);

module.exports = router;
