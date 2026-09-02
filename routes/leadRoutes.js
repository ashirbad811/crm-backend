const express = require('express');
const router = express.Router();
const { getLeads, getLeadById, createLead, updateLead, convertLead } = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Leads', 'View'), getLeads)
  .post(protect, authorize('Leads', 'Create'), createLead);

router.route('/:id')
  .get(protect, authorize('Leads', 'View'), getLeadById)
  .put(protect, authorize('Leads', 'Edit'), updateLead);

router.post('/:id/convert', protect, authorize('Leads', 'Convert'), convertLead);

module.exports = router;
