const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const logActivity = require('../utils/activityLogger');
const logNotification = require('../utils/notificationLogger');
const mongoose = require('mongoose');
const { applyRBACFilter, checkRecordAccess } = require('../utils/rbac');
const logTimeline = require('../utils/timelineLogger');

// @desc    Get all leads with pagination, search, filter
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, priority, source, assignedTo } = req.query;

    let query = {};
    
    // Apply RBAC team-based filtering
    query = await applyRBACFilter(query, req.user, 'Leads', 'View', assignedTo);

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Lead.countDocuments(query);

    res.json({
      leads,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalLeads: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.createdBy', 'name');

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Check permissions
    const hasAccess = await checkRecordAccess(lead.assignedTo._id, req.user, 'Leads', 'View');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this lead' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  try {
    const { title, firstName, lastName, email, phone, company, source, priority } = req.body;
    const assignedTo = req.body.assignedTo || req.user._id;

    const lead = await Lead.create({
      title, firstName, lastName, email, phone, company, source, priority, assignedTo
    });

    await logTimeline(lead._id, 'Lead', 'Creation', 'Lead created', req.user._id);

    // Notify assigned user if someone else created it
    if (assignedTo.toString() !== req.user._id.toString()) {
      await logNotification(assignedTo, 'Lead Assignment', `You have been assigned a new lead: ${firstName} ${lastName}`, lead._id);
    }

    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    
    const hasAccess = await checkRecordAccess(lead.assignedTo, req.user, 'Leads', 'Edit');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    const { status, note } = req.body;
    let oldStatus = lead.status;

    // Check if updating assignedTo (Manager/Admin only)
    if (req.body.assignedTo && req.body.assignedTo !== lead.assignedTo.toString()) {
      const canAssign = await checkRecordAccess(lead.assignedTo, req.user, 'Leads', 'Assign');
      if (!canAssign) {
        return res.status(403).json({ message: 'Not authorized to reassign leads' });
      }
      
      await logTimeline(lead._id, 'Lead', 'Assignment', `Lead reassigned`, req.user._id);
      await logNotification(req.body.assignedTo, 'Lead Assignment', `You have been reassigned a lead: ${lead.firstName} ${lead.lastName}`, lead._id);
    }

    // Add Note if present
    if (note) {
       req.body.notes = lead.notes;
       req.body.notes.push({ text: note, createdBy: req.user._id });
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (status && oldStatus !== status) {
       await logTimeline(lead._id, 'Lead', 'Status Change', `Status changed to ${status}`, req.user._id);
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Convert lead to customer & deal
// @route   POST /api/leads/:id/convert
// @access  Private
const convertLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) throw new Error('Lead not found');
    if (lead.isConverted) throw new Error('Lead is already converted');
    if (lead.status !== 'Qualified') throw new Error('Only a Qualified lead can be converted');

    const hasAccess = await checkRecordAccess(lead.assignedTo, req.user, 'Leads', 'Convert');
    if (!hasAccess) {
      throw new Error('Not authorized to convert this lead');
    }

    // Create Customer
    const customer = new Customer({
      leadId: lead._id,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      assignedTo: lead.assignedTo
    });
    await customer.save();

    const { dealValue, dealProbability, expectedClosingDate } = req.body;

    // Create Deal
    const deal = new Deal({
      customerId: customer._id,
      title: `${lead.company || lead.firstName} - New Deal`,
      value: dealValue || 0,
      probability: dealProbability || 50,
      expectedClosingDate: expectedClosingDate || new Date(Date.now() + 30*24*60*60*1000), // 30 days default
      stage: 'Qualification',
      assignedTo: lead.assignedTo
    });
    await deal.save();

    lead.isConverted = true;
    lead.status = 'Converted';
    lead.customerId = customer._id;
    lead.dealId = deal._id;
    await lead.save();

    await logTimeline(lead._id, 'Lead', 'Conversion', 'Lead converted to Customer and Deal', req.user._id);
    await logTimeline(customer._id, 'Customer', 'Creation', 'Customer created from Lead conversion', req.user._id);
    await logTimeline(deal._id, 'Deal', 'Creation', 'Deal created from Lead conversion', req.user._id);

    await logNotification(lead.assignedTo, 'Lead Conversion', `Lead ${lead.firstName} ${lead.lastName} has been successfully converted to a customer.`, lead._id);
    await logNotification(lead.assignedTo, 'Deal Assignment', `A new deal was created from lead conversion.`, deal._id);

    res.status(201).json({ customer, deal, lead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLeads, getLeadById, createLead, updateLead, convertLead };
