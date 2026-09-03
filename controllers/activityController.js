const Activity = require('../models/Activity');
const { getAccessibleUserIds, checkRecordAccess } = require('../utils/rbac');

// @desc    Get all activities for a specific entity or user
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const { relatedTo, status } = req.query;
    
    let query = {};
    if (relatedTo) query.relatedTo = relatedTo;
    if (status) query.status = status;
    
    const allowedIds = await getAccessibleUserIds(req.user, 'Activities', 'View');
    if (allowedIds !== null) {
      if (!relatedTo) {
        query.createdBy = { $in: allowedIds };
      }
    }

    const activities = await Activity.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an activity manually
// @route   POST /api/activities
// @access  Private
const createActivity = async (req, res) => {
  try {
    const { relatedTo, onModel, type, description, status, dueDate } = req.body;

    const activity = await Activity.create({
      relatedTo,
      onModel,
      type,
      description,
      status: status || 'Pending',
      dueDate,
      createdBy: req.user._id
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update activity (e.g., mark completed)
// @route   PUT /api/activities/:id
// @access  Private
const updateActivity = async (req, res) => {
  try {
    let activity = await Activity.findById(req.params.id);

    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const hasAccess = await checkRecordAccess(activity.createdBy, req.user, 'Activities', 'Edit');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActivities, createActivity, updateActivity };
