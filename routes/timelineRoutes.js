const express = require('express');
const router = express.Router();
const { getTimeline, getGlobalLogs } = require('../controllers/timelineController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/logs')
  .get(protect, authorize('Dashboard', 'View'), getGlobalLogs);

router.route('/:onModel/:id')
  .get(protect, getTimeline);

module.exports = router;
