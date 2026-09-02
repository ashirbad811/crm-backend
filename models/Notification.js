const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Lead Assignment', 'Deal Assignment', 'Upcoming Follow-up', 'Overdue Follow-up', 'Lead Conversion', 'Deal Closure'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedEntity: {
    type: mongoose.Schema.Types.ObjectId
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
