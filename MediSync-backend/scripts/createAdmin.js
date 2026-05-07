const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const userModel = new User();
  
  try {
    // Check if admin already exists
    const existingAdmin = await userModel.findByEmail('admin@medisync.com');
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Status:', existingAdmin.status);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminData = {
      name: 'System Administrator',
      email: 'admin@medisync.com',
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      department_id: null // Admin doesn't belong to any specific department
    };
    
    const admin = await userModel.create(adminData);
    console.log('Admin user created successfully:');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role:', admin.role);
    
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createAdmin().then(() => {
    console.log('Admin creation script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = createAdmin;
