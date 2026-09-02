const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  relatedTo: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' },
  onModel: { type: String, required: true, enum: ['Lead', 'Customer', 'Deal'] },
  action: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Timeline', timelineSchema);
