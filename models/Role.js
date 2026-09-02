const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: { 
    type: String, 
    required: true,
    enum: ['Dashboard', 'Leads', 'Customers', 'Deals', 'Activities', 'Users', 'Roles']
  },
  actions: [{ 
    type: String, 
    enum: ['View', 'Create', 'Edit', 'Delete', 'Assign', 'Convert'] 
  }],
  scope: { 
    type: String, 
    enum: ['OWN', 'TEAM', 'ALL'], 
    default: 'OWN' 
  }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: [permissionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
