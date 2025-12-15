/**
 * Migration: Create Bill Stop Analysis Table
 *
 * Purpose:
 * - Store bill stop analysis results from Oracle queries
 * - Track customers with active billing vs stopped billing
 * - Updated on-demand by clicking "Refresh Analysis" button
 *
 * Run this migration:
 *   npx sequelize-cli db:migrate
 *
 * Rollback if needed:
 *   npx sequelize-cli db:migrate:undo
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bill_stop_analysis', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      total_customers: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of customers analyzed'
      },
      active_billing_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of customers billed in current month (active)'
      },
      stopped_billing_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of customers NOT billed in current month (stopped)'
      },
      analysis_month: {
        type: Sequelize.STRING(7),
        allowNull: false,
        comment: 'Month of analysis (YYYY-MM format, e.g., 2024-12)'
      },
      current_month_start: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'First day of current month used for comparison'
      },
      query_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'How long the Oracle query took (milliseconds)'
      },
      processing_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'How long the data processing took (milliseconds)'
      },
      performed_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Username who triggered the analysis'
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
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('bill_stop_analysis', ['analysis_month'], {
      name: 'idx_analysis_month'
    });

    await queryInterface.addIndex('bill_stop_analysis', ['created_at'], {
      name: 'idx_created_at'
    });

    console.log('✅ Bill Stop Analysis table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bill_stop_analysis');
    console.log('✅ Bill Stop Analysis table dropped');
  }
};
