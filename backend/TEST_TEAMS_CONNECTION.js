/**
 * Test Microsoft Teams Integration
 *
 * This script tests:
 * 1. Connection to Teams webhook
 * 2. RC/DC Dashboard Report
 * 3. NOCS-wise Breakdown Report
 * 4. NOCS Balance Dashboard
 */

const teamsService = require('./src/services/teams.service');
const teamsWebhooks = require('./src/config/teams-webhooks');

async function testTeamsIntegration() {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   MICROSOFT TEAMS INTEGRATION TEST        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Initialize Teams service
    teamsService.initialize(teamsWebhooks.DEFAULT);
    console.log('✅ Teams service initialized\n');

    // Test 1: Simple connection test
    console.log('📤 Test 1: Sending connection test message...');
    await teamsService.testConnection();
    console.log('✅ Connection test message sent!\n');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: RC/DC Dashboard Report
    console.log('📤 Test 2: Sending RC/DC Dashboard Report...');
    const rcDcData = {
      rc: {
        total: 222,
        normal: 180,
        warning: 25,
        alert: 12,
        stuck: 5
      },
      dc: {
        total: 89,
        normal: 70,
        warning: 12,
        alert: 5,
        stuck: 2
      },
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };
    await teamsService.sendRCDCDashboard(rcDcData);
    console.log('✅ RC/DC Dashboard sent!\n');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: NOCS-wise Breakdown
    console.log('📤 Test 3: Sending NOCS-wise Breakdown...');
    const nocsData = {
      nocs: [
        {
          name: 'Dhanmondi NOCS',
          rc: { total: 45, stuck: 3, alert: 7 },
          dc: { total: 12, stuck: 1, alert: 2 }
        },
        {
          name: 'Mirpur NOCS',
          rc: { total: 38, stuck: 1, alert: 4 },
          dc: { total: 15, stuck: 0, alert: 1 }
        },
        {
          name: 'Gulshan NOCS',
          rc: { total: 52, stuck: 1, alert: 1 },
          dc: { total: 20, stuck: 0, alert: 0 }
        }
      ],
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };
    await teamsService.sendNOCSBreakdown(nocsData);
    console.log('✅ NOCS Breakdown sent!\n');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: NOCS Balance Dashboard
    console.log('📤 Test 4: Sending NOCS Balance Dashboard...');
    const balanceData = {
      nocs: [
        {
          name: 'Dhanmondi NOCS',
          balance: 45234.50,
          customers: 1245,
          avgBalance: 36.30
        },
        {
          name: 'Mirpur NOCS',
          balance: 38901.25,
          customers: 1089,
          avgBalance: 35.72
        },
        {
          name: 'Gulshan NOCS',
          balance: 52678.90,
          customers: 1432,
          avgBalance: 36.79
        }
      ],
      summary: {
        totalBalance: 136814.65,
        totalCustomers: 3766
      },
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };
    await teamsService.sendNOCSBalance(balanceData);
    console.log('✅ NOCS Balance Dashboard sent!\n');

    console.log('╔════════════════════════════════════════════╗');
    console.log('║              TEST COMPLETE                 ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n✅ All 4 messages sent to Teams successfully!');
    console.log('📱 Check your Teams channel to see the messages.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testTeamsIntegration();
