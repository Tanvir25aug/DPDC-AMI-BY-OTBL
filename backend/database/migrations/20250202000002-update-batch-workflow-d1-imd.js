'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update MD-MONITOR to D1-IMD
    await queryInterface.sequelize.query(`
      UPDATE batch_workflow_config
      SET
        batch_code = 'D1-IMD',
        batch_name = 'D1-IMD Process',
        description = 'D1-IMD batch - Run multiple times until IMD count is 0',
        updated_at = CURRENT_TIMESTAMP
      WHERE batch_code = 'MD-MONITOR'
    `);

    console.log('✅ Updated batch code from MD-MONITOR to D1-IMD');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert D1-IMD back to MD-MONITOR
    await queryInterface.sequelize.query(`
      UPDATE batch_workflow_config
      SET
        batch_code = 'MD-MONITOR',
        batch_name = 'MD Monitor - Physical Device',
        description = 'Run multiple times until IMD count is 0',
        updated_at = CURRENT_TIMESTAMP
      WHERE batch_code = 'D1-IMD'
    `);

    console.log('✅ Reverted batch code from D1-IMD to MD-MONITOR');
  }
};
