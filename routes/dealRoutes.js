const express = require('express');
const router = express.Router();
const { getDeals, getDealById, updateDeal } = require('../controllers/dealController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Deals', 'View'), getDeals);

router.route('/:id')
  .get(protect, authorize('Deals', 'View'), getDealById)
  .put(protect, authorize('Deals', 'Edit'), updateDeal);

module.exports = router;
