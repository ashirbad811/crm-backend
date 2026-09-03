const Timeline = require('../models/Timeline');
const { checkRecordAccess, getAccessibleUserIds } = require('../utils/rbac');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Customer = require('../models/Customer');

// @desc    Get timeline events for a specific entity
// @route   GET /api/timeline/:onModel/:id
// @access  Private
const getTimeline = async (req, res) => {
  try {
    const { onModel, id } = req.params;

    if (!['Lead', 'Deal', 'Customer'].includes(onModel)) {
      return res.status(400).json({ message: 'Invalid model' });
    }

    // Determine which model to check access against
    let record;
    if (onModel === 'Lead') record = await Lead.findById(id);
    else if (onModel === 'Deal') record = await Deal.findById(id);
    else if (onModel === 'Customer') record = await Customer.findById(id);

    if (!record) {
      return res.status(404).json({ message: `${onModel} not found` });
    }

    // Check if user has View access to the module
    // Customers module might map to Customers, etc.
    let moduleName = onModel === 'Lead' ? 'Leads' : onModel === 'Deal' ? 'Deals' : 'Customers';
    const hasAccess = await checkRecordAccess(record.assignedTo, req.user, moduleName, 'View');
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this timeline' });
    }

    const events = await Timeline.find({ relatedTo: id, onModel })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get global timeline events for dashboard logs
// @route   GET /api/timeline/logs
// @access  Private
const getGlobalLogs = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};

    // Get all user IDs this user is allowed to monitor based on Dashboard View permission
    const allowedIds = await getAccessibleUserIds(req.user, 'Dashboard', 'View');
    
    if (allowedIds !== null) {
      if (userId) {
        // If a specific user filter is requested, ensure they have access to it
        const isAllowed = allowedIds.some(id => id.toString() === userId.toString());
        if (!isAllowed) {
          return res.status(403).json({ message: 'Not authorized to view logs for this user' });
        }
        query.createdBy = userId;
      } else {
        // If no filter, show logs for all allowed users
        query.createdBy = { $in: allowedIds };
      }
    } else {
      // ALL access (Admin)
      if (userId) {
        query.createdBy = userId;
      }
    }

    const logs = await Timeline.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 logs for performance

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTimeline, getGlobalLogs };
