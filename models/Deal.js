const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  value: {
    type: Number,
    required: true
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  expectedClosingDate: {
    type: Date,
    required: true
  },
  stage: {
    type: String,
    enum: ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'Qualification'
  },
  lostReason: {
    type: String
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Virtual for Expected Revenue
dealSchema.virtual('expectedRevenue').get(function() {
  return (this.value * this.probability) / 100;
});

// Ensure virtuals are included in JSON and Object outputs
dealSchema.set('toJSON', { virtuals: true });
dealSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Deal', dealSchema);
