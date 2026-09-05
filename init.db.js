const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./config/db');

dotenv.config();

const initDB = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data (optional, but good for fresh start)
    // await User.deleteMany();
    // await Role.deleteMany();

    console.log('Setting up roles...');
    
    // Create or find Roles
    const roles = [
      { name: 'Admin', permissions: [{ module: 'Dashboard', actions: ['View'], scope: 'ALL' }] }, // Simplified permissions
      { name: 'Sales Manager', permissions: [{ module: 'Dashboard', actions: ['View'], scope: 'TEAM' }] },
      { name: 'Sales Executive', permissions: [{ module: 'Dashboard', actions: ['View'], scope: 'OWN' }] }
    ];

    const roleMap = {};
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
      }
      roleMap[role.name] = role._id;
    }

    console.log('Roles setup completed.');

    const usersData = [
      {
        name: 'System Admin',
        email: 'admin@crm.com',
        password: 'password123',
        roleName: 'Admin'
      },
      {
        name: 'Rohan (Manager)',
        email: 'rohan@crm.com',
        password: 'password123',
        roleName: 'Sales Manager'
      },
      {
        name: 'Abhijit',
        email: 'abhijit@crm.com',
        password: 'password123',
        roleName: 'Sales Executive'
      },
      {
        name: 'Soniya',
        email: 'soniya@crm.com',
        password: 'password123',
        roleName: 'Sales Executive'
      }
    ];

    console.log('Creating users...');

    for (const userData of usersData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: roleMap[userData.roleName],
          isActive: true
        });
        console.log(`User created: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    console.log('Database initialization successful!');
    process.exit();
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
};

initDB();
