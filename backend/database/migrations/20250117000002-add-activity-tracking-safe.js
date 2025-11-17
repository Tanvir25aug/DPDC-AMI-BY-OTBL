'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Helper function to safely add index
      const safeAddIndex = async (tableName, columns, options = {}) => {
        try {
          await queryInterface.addIndex(tableName, columns, { ...options, transaction });
        } catch (error) {
          if (!error.message.includes('already exists')) {
            throw error;
          }
          console.log(`Index on ${tableName}(${columns.join(',')}) already exists, skipping...`);
        }
      };

      // Create login_history table if it doesn't exist
      const tables = await queryInterface.showAllTables();

      if (!tables.includes('login_history')) {
        await queryInterface.createTable('login_history', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
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
          ip_address: {
            type: Sequelize.STRING(45),
            allowNull: true
          },
          user_agent: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          login_method: {
            type: Sequelize.ENUM('password', 'token', 'refresh'),
            defaultValue: 'password',
            allowNull: false
          },
          status: {
            type: Sequelize.ENUM('success', 'failed', 'blocked'),
            defaultValue: 'success',
            allowNull: false
          },
          failure_reason: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          device_type: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          browser: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          os: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          location: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }, { transaction });
        console.log('✓ Created login_history table');
      }

      // Add indexes for login_history
      await safeAddIndex('login_history', ['user_id']);
      await safeAddIndex('login_history', ['status']);
      await safeAddIndex('login_history', ['created_at']);

      // Create user_sessions table if it doesn't exist
      if (!tables.includes('user_sessions')) {
        await queryInterface.createTable('user_sessions', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
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
          session_token: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true
          },
          ip_address: {
            type: Sequelize.STRING(45),
            allowNull: true
          },
          user_agent: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          device_type: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          browser: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          os: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          location: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false
          },
          last_activity: {
            type: Sequelize.DATE,
            allowNull: true
          },
          expires_at: {
            type: Sequelize.DATE,
            allowNull: false
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }, { transaction });
        console.log('✓ Created user_sessions table');
      }

      // Add indexes for user_sessions
      await safeAddIndex('user_sessions', ['user_id']);
      await safeAddIndex('user_sessions', ['session_token']);
      await safeAddIndex('user_sessions', ['is_active']);
      await safeAddIndex('user_sessions', ['expires_at']);

      // Create user_activities table if it doesn't exist
      if (!tables.includes('user_activities')) {
        await queryInterface.createTable('user_activities', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
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
          activity_type: {
            type: Sequelize.ENUM(
              'login',
              'logout',
              'query_executed',
              'report_generated',
              'data_exported',
              'profile_updated',
              'password_changed',
              'user_created',
              'user_updated',
              'user_deleted',
              'settings_changed',
              'permission_changed'
            ),
            allowNull: false
          },
          activity_description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true
          },
          ip_address: {
            type: Sequelize.STRING(45),
            allowNull: true
          },
          user_agent: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          resource_type: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          resource_id: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          status: {
            type: Sequelize.ENUM('success', 'failed', 'warning'),
            defaultValue: 'success',
            allowNull: false
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }, { transaction });
        console.log('✓ Created user_activities table');
      }

      // Add indexes for user_activities
      await safeAddIndex('user_activities', ['user_id']);
      await safeAddIndex('user_activities', ['activity_type']);
      await safeAddIndex('user_activities', ['created_at']);
      await safeAddIndex('user_activities', ['status']);

      await transaction.commit();
      console.log('✓ Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('user_activities');
    await queryInterface.dropTable('user_sessions');
    await queryInterface.dropTable('login_history');
  }
};
