'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash password
    const passwordHash = await bcrypt.hash('Admin@123', 10);

    // Get admin role id
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'admin';`
    );

    if (roles.length === 0) {
      throw new Error('Admin role not found. Please run migrations first.');
    }

    // Check if admin user already exists
    const [existingUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'admin';`
    );

    if (existingUsers.length > 0) {
      console.log('Admin user already exists. Skipping...');
      return;
    }

    // Insert admin user
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@dpdc-ami.local',
        password_hash: passwordHash,
        role_id: roles[0].id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('   ⚠️  Please change this password after first login!');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  }
};
