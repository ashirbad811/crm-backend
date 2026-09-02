const Deal = require('../models/Deal');
const { applyRBACFilter, checkRecordAccess } = require('../utils/rbac');
const logTimeline = require('../utils/timelineLogger');
const logNotification = require('../utils/notificationLogger');

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
const getDeals = async (req, res) => {
  try {
    const { page = 1, limit = 50, stage, assignedTo } = req.query;

    let query = {};
    query = await applyRBACFilter(query, req.user, 'Deals', 'View', assignedTo);

    if (stage) query.stage = stage;

    const deals = await Deal.find(query)
      .populate('assignedTo', 'name email')
      .populate('customerId', 'name company email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Deal.countDocuments(query);

    res.json({
      deals,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalDeals: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get deal by ID
// @route   GET /api/deals/:id
// @access  Private
const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('customerId', 'name company email');

    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    const hasAccess = await checkRecordAccess(deal.assignedTo._id, req.user, 'Deals', 'View');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update deal
// @route   PUT /api/deals/:id
// @access  Private
const updateDeal = async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);

    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    const hasAccess = await checkRecordAccess(deal.assignedTo, req.user, 'Deals', 'Edit');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const oldStage = deal.stage;
    const { stage, lostReason } = req.body;

    // Stage validation rules
    if (stage && stage !== oldStage) {
      const validTransitions = {
        'Qualification': ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
        'Discovery': ['Proposal', 'Negotiation', 'Won', 'Lost'],
        'Proposal': ['Negotiation', 'Won', 'Lost'],
        'Negotiation': ['Won', 'Lost'],
        'Won': [],
        'Lost': []
      };

      if (!validTransitions[oldStage].includes(stage)) {
        return res.status(400).json({ message: `Invalid stage transition from ${oldStage} to ${stage}` });
      }

      if (stage === 'Lost' && !lostReason) {
        return res.status(400).json({ message: 'Lost reason is required when deal is lost' });
      }

      if (stage === 'Won') {
        req.body.probability = 100;
      }
    }

    Object.assign(deal, req.body);
    await deal.save(); // use .save to ensure virtuals / middleware run

    if (stage && oldStage !== stage) {
      await logTimeline(deal._id, 'Deal', 'Status Change', `Deal moved from ${oldStage} to ${stage}`, req.user._id);
      
      if (stage === 'Won' || stage === 'Lost') {
        await logNotification(deal.assignedTo, 'Deal Closure', `Deal "${deal.title}" was marked as ${stage}.`, deal._id);
      }
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDeals, getDealById, updateDeal };
