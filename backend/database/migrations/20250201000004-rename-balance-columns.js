/**
 * Migration: Rename Balance Columns (Fix Terminology)
 *
 * Purpose:
 * - Rename positive_* to credit_* (correct terminology)
 * - Rename negative_* to due_* (correct terminology)
 *
 * Oracle CC&B Logic:
 * - Positive TOT_AMT = Customer owes money (DUE)
 * - Negative TOT_AMT = Customer has advance (CREDIT)
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename positive_qty to credit_qty
    await queryInterface.renameColumn('nocs_balance_summary', 'positive_qty', 'credit_qty');

    // Rename positive_balance_amt to credit_balance_amt
    await queryInterface.renameColumn('nocs_balance_summary', 'positive_balance_amt', 'credit_balance_amt');

    // Rename negative_qty to due_qty
    await queryInterface.renameColumn('nocs_balance_summary', 'negative_qty', 'due_qty');

    // Rename negative_balance_amt to due_balance_amt
    await queryInterface.renameColumn('nocs_balance_summary', 'negative_balance_amt', 'due_balance_amt');

    console.log('✅ Balance columns renamed successfully (positive→credit, negative→due)');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: Rename back to original names
    await queryInterface.renameColumn('nocs_balance_summary', 'credit_qty', 'positive_qty');
    await queryInterface.renameColumn('nocs_balance_summary', 'credit_balance_amt', 'positive_balance_amt');
    await queryInterface.renameColumn('nocs_balance_summary', 'due_qty', 'negative_qty');
    await queryInterface.renameColumn('nocs_balance_summary', 'due_balance_amt', 'negative_balance_amt');

    console.log('✅ Balance columns reverted to original names');
  }
};
