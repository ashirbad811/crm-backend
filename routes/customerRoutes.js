const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById, updateCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Customers', 'View'), getCustomers);

router.route('/:id')
  .get(protect, authorize('Customers', 'View'), getCustomerById)
  .put(protect, authorize('Customers', 'Edit'), updateCustomer);

module.exports = router;
