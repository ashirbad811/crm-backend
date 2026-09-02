const Timeline = require('../models/Timeline');

const logTimeline = async (relatedTo, onModel, action, description, createdBy) => {
  try {
    const timelineEvent = await Timeline.create({
      relatedTo,
      onModel,
      action,
      description,
      createdBy
    });
    return timelineEvent;
  } catch (error) {
    console.error('Error logging timeline event:', error);
  }
};

module.exports = logTimeline;
