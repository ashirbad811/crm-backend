const Activity = require('../models/Activity');

const logActivity = async (relatedTo, onModel, type, description, createdBy, status = 'Completed', dueDate = null) => {
  try {
    const activity = await Activity.create({
      relatedTo,
      onModel,
      type,
      description,
      status,
      dueDate,
      createdBy
    });
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = logActivity;
