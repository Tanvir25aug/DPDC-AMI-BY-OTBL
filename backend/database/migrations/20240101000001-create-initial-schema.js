'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create roles table
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create query_logs table
    await queryInterface.createTable('query_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      query_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      execution_time: {
        type: Sequelize.INTEGER
      },
      rows_returned: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'success'
      },
      error_message: {
        type: Sequelize.TEXT
      },
      executed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role_id']);
    await queryInterface.addIndex('query_logs', ['user_id']);
    await queryInterface.addIndex('query_logs', ['executed_at']);

    // Insert default roles
    await queryInterface.bulkInsert('roles', [
      {
        name: 'admin',
        description: 'Full system access including user management',
        permissions: JSON.stringify({
          can_manage_users: true,
          can_execute_any_query: true,
          can_export_reports: true,
          can_view_audit_logs: true,
          can_manage_roles: true
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'power_user',
        description: 'Can execute custom queries and export reports',
        permissions: JSON.stringify({
          can_manage_users: false,
          can_execute_custom_query: true,
          can_execute_predefined_query: true,
          can_export_reports: true,
          can_view_audit_logs: false
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'user',
        description: 'Can execute predefined queries and export reports',
        permissions: JSON.stringify({
          can_manage_users: false,
          can_execute_predefined_query: true,
          can_export_reports: true,
          can_view_audit_logs: false
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'viewer',
        description: 'Read-only access to view reports',
        permissions: JSON.stringify({
          can_manage_users: false,
          can_view_reports: true,
          can_export_reports: false,
          can_view_audit_logs: false
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('query_logs');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('roles');
  }
};
