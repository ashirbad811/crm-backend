const Customer = require('../models/Customer');
const { applyRBACFilter, checkRecordAccess } = require('../utils/rbac');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, assignedTo } = req.query;

    let query = {};
    query = await applyRBACFilter(query, req.user, 'Customers', 'View', assignedTo);

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .populate('assignedTo', 'name email')
      .populate('leadId', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCustomers: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('leadId');

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const hasAccess = await checkRecordAccess(customer.assignedTo._id, req.user, 'Customers', 'View');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    let customer = await Customer.findById(req.params.id);

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const hasAccess = await checkRecordAccess(customer.assignedTo, req.user, 'Customers', 'Edit');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCustomers, getCustomerById, updateCustomer };
