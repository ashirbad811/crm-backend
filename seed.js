const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Role = require('./models/Role');
const Lead = require('./models/Lead');
const Customer = require('./models/Customer');
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');
const Timeline = require('./models/Timeline');

dotenv.config();

const MODULES = ['Dashboard', 'Leads', 'Customers', 'Deals', 'Activities', 'Users', 'Roles'];

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB, clearing old data...');

    // Clear old data
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Lead.deleteMany({}),
      Customer.deleteMany({}),
      Deal.deleteMany({}),
      Activity.deleteMany({}),
      mongoose.model('Timeline').deleteMany({})
    ]);

    console.log('Creating Roles...');
    // Create Admin Role
    const adminRole = await Role.create({
      name: 'Admin',
      permissions: MODULES.map(m => ({
        module: m,
        actions: ['View', 'Create', 'Edit', 'Delete', 'Assign', 'Convert'],
        scope: 'ALL'
      }))
    });

    // Create Manager Role
    const managerRole = await Role.create({
      name: 'Sales Manager',
      permissions: [
        { module: 'Dashboard', actions: ['View'], scope: 'TEAM' },
        { module: 'Leads', actions: ['View', 'Create', 'Edit', 'Assign', 'Convert'], scope: 'TEAM' },
        { module: 'Customers', actions: ['View', 'Create', 'Edit'], scope: 'TEAM' },
        { module: 'Deals', actions: ['View', 'Create', 'Edit'], scope: 'TEAM' },
        { module: 'Activities', actions: ['View', 'Create', 'Edit'], scope: 'TEAM' }
      ]
    });

    // Create Executive Role
    const executiveRole = await Role.create({
      name: 'Sales Executive',
      permissions: [
        { module: 'Dashboard', actions: ['View'], scope: 'OWN' },
        { module: 'Leads', actions: ['View', 'Create', 'Edit', 'Convert'], scope: 'OWN' },
        { module: 'Customers', actions: ['View', 'Create', 'Edit'], scope: 'OWN' },
        { module: 'Deals', actions: ['View', 'Create', 'Edit'], scope: 'OWN' },
        { module: 'Activities', actions: ['View', 'Create', 'Edit'], scope: 'OWN' }
      ]
    });

    console.log('Creating Users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@crm.com',
      password: hashedPassword,
      role: adminRole._id
    });

    const manager = await User.create({
      name: 'John Manager',
      email: 'manager@crm.com',
      password: hashedPassword,
      role: managerRole._id,
      manager: admin._id
    });

    const exec1 = await User.create({
      name: 'Alice Exec',
      email: 'alice@crm.com',
      password: hashedPassword,
      role: executiveRole._id,
      manager: manager._id
    });

    const exec2 = await User.create({
      name: 'Bob Exec',
      email: 'bob@crm.com',
      password: hashedPassword,
      role: executiveRole._id,
      manager: manager._id
    });

    console.log('Creating Leads...');
    const lead1 = await Lead.create({
      title: 'Software Upgrade',
      firstName: 'Tom',
      lastName: 'Smith',
      email: 'tom@example.com',
      company: 'Tech Corp',
      status: 'New',
      assignedTo: exec1._id
    });

    const lead2 = await Lead.create({
      title: 'Consulting Services',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@example.com',
      company: 'Cyberdyne',
      status: 'Qualified',
      assignedTo: exec2._id
    });

    console.log('Creating Customers and Deals...');
    const customer1 = await Customer.create({
      leadId: lead1._id,
      name: 'Wayne Enterprises',
      email: 'bruce@wayne.com',
      company: 'Wayne Enterprises',
      assignedTo: exec1._id
    });

    const deal1 = await Deal.create({
      customerId: customer1._id,
      title: 'Enterprise License',
      value: 100000,
      probability: 60,
      expectedClosingDate: new Date(Date.now() + 15*24*60*60*1000),
      stage: 'Proposal',
      assignedTo: exec1._id
    });

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedAll();
