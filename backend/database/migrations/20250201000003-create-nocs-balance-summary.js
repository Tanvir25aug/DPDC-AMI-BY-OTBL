/**
 * Migration: Create NOCS Balance Summary Table
 *
 * Purpose:
 * - Cache Oracle query results in PostgreSQL for instant user access
 * - Store balance summary for all NOCS areas
 * - Updated hourly by background scheduler
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
    await queryInterface.createTable('nocs_balance_summary', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nocs_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'NOCS area name (e.g., Adabor, Banasree)'
      },
      nocs_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique NOCS code'
      },
      total_customers: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of customers in this NOCS area'
      },
      positive_qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of customers with CREDIT (advance payment)'
      },
      positive_balance_amt: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total CREDIT amount (customers who paid extra)'
      },
      negative_qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of customers with DUE (unpaid bills)'
      },
      negative_balance_amt: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total DUE amount (money owed by customers)'
      },
      net_balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Net balance = CREDIT - DUE'
      },
      refresh_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Calculation time in milliseconds'
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
    await queryInterface.addIndex('nocs_balance_summary', ['nocs_code'], {
      name: 'idx_nocs_code',
      unique: true
    });

    await queryInterface.addIndex('nocs_balance_summary', ['updated_at'], {
      name: 'idx_updated_at'
    });

    await queryInterface.addIndex('nocs_balance_summary', ['nocs_name'], {
      name: 'idx_nocs_name'
    });

    console.log('✅ NOCS Balance Summary table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('nocs_balance_summary');
    console.log('✅ NOCS Balance Summary table dropped');
  }
};
