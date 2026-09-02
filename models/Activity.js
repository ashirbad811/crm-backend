const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Lead', 'Customer', 'Deal']
  },
  type: {
    type: String,
    enum: ['Call', 'Email', 'Meeting', 'Demo', 'Reminder', 'Status Change', 'Creation', 'Assignment'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Overdue'],
    default: 'Pending'
  },
  dueDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
