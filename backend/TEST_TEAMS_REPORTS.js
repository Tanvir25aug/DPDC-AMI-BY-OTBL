/**
 * Test MS Teams Reports
 * Manually trigger both schedulers to test Teams integration
 */

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const teamsService = require('./src/services/teams.service');
const teamsWebhooks = require('./src/config/teams-webhooks');
const batchMonitoringScheduler = require('./src/schedulers/batch-monitoring.scheduler');
const teamsReportsScheduler = require('./src/schedulers/teams-reports.scheduler');
const { initializeOraclePool, closeOraclePool } = require('./src/config/oracle');
const { sequelize } = require('./src/models');

async function testTeamsReports() {
  console.log('========================================');
  console.log('🧪 Testing MS Teams Reports');
  console.log('========================================\n');

  try {
    // Initialize databases
    console.log('🔌 Connecting to databases...');

    // Test PostgreSQL connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    // Initialize Oracle connection pool
    await initializeOraclePool();
    console.log('✅ Oracle connected\n');

    // Initialize Teams service
    teamsService.initialize(teamsWebhooks.DEFAULT);
    console.log('✅ Teams service initialized\n');

    // Test 1: Send Batch Monitoring Report (30-min report)
    console.log('📊 Test 1: Sending Batch Monitoring Report...');
    console.log('   (Pending IMD + Running Batches + Statistics)');
    await batchMonitoringScheduler.runManually();
    console.log('✅ Batch Monitoring Report sent!\n');

    // Wait 2 seconds between reports
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Send NOCS Balance Summary (1-hour report)
    console.log('💰 Test 2: Sending NOCS Balance Summary...');
    console.log('   (Overall Summary Only)');
    await teamsReportsScheduler.runReportCycle();
    console.log('✅ NOCS Balance Summary sent!\n');

    console.log('========================================');
    console.log('🎉 All test reports sent successfully!');
    console.log('========================================');
    console.log('\n📱 Check your MS Teams channel for 2 messages:');
    console.log('   1. 🔄 Batch Monitoring Report');
    console.log('   2. 💰 NOCS Balance - Overall Summary');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error sending test reports:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    await closeOraclePool();
    await sequelize.close();
    process.exit(0);
  }
}

// Run the tests
testTeamsReports();
