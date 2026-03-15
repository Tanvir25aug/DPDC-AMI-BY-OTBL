'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const BCRYPT_ROUNDS = 10;

    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', BCRYPT_ROUNDS);
    const powerUserPassword = await bcrypt.hash('Power@123', BCRYPT_ROUNDS);
    const userPassword = await bcrypt.hash('User@123', BCRYPT_ROUNDS);
    const viewerPassword = await bcrypt.hash('View@123', BCRYPT_ROUNDS);

    // Check if users already exist
    const existingUsers = await queryInterface.sequelize.query(
      'SELECT username FROM users WHERE username IN (:usernames)',
      {
        replacements: { usernames: ['admin', 'power_user', 'user', 'viewer'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const existingUsernames = existingUsers.map(u => u.username);

    const usersToInsert = [];

    if (!existingUsernames.includes('admin')) {
      usersToInsert.push({
        username: 'admin',
        email: 'admin@dpdc.org.bd',
        password_hash: adminPassword,
        role_id: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (!existingUsernames.includes('power_user')) {
      usersToInsert.push({
        username: 'power_user',
        email: 'poweruser@dpdc.org.bd',
        password_hash: powerUserPassword,
        role_id: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (!existingUsernames.includes('user')) {
      usersToInsert.push({
        username: 'user',
        email: 'user@dpdc.org.bd',
        password_hash: userPassword,
        role_id: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (!existingUsernames.includes('viewer')) {
      usersToInsert.push({
        username: 'viewer',
        email: 'viewer@dpdc.org.bd',
        password_hash: viewerPassword,
        role_id: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert);
      console.log(`✅ Created ${usersToInsert.length} default users`);
    } else {
      console.log('ℹ️ All default users already exist');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      username: ['admin', 'power_user', 'user', 'viewer']
    });
  }
};
