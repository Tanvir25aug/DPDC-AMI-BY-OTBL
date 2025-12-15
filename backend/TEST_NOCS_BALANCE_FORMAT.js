/**
 * Test NOCS Balance Report Format
 * Tests the new NOCS Balance format with Credit/Due breakdown
 */

require('dotenv').config();
const { NocsBalanceSummary } = require('./src/models');
const teamsService = require('./src/services/teams.service');
const teamsWebhooks = require('./src/config/teams-webhooks');

async function testNocsBalanceFormat() {
  try {
    console.log('========================================');
    console.log('Testing NOCS Balance Report Format');
    console.log('========================================');

    // Initialize Teams service
    teamsService.initialize(teamsWebhooks.DEFAULT);

    // Get all NOCS balances from cache
    const balances = await NocsBalanceSummary.findAll({
      order: [['nocs_name', 'ASC']]
    });

    if (!balances || balances.length === 0) {
      console.log('❌ No NOCS balance data found in PostgreSQL cache');
      console.log('Please ensure the NOCS Balance Scheduler has run at least once');
      process.exit(1);
    }

    console.log(`✅ Found ${balances.length} NOCS areas in cache`);
    console.log('');

    // Calculate totals
    let totalCustomers = 0;
    let totalCreditQty = 0;
    let totalCreditBalance = 0;
    let totalDueQty = 0;
    let totalDueBalance = 0;
    let totalNetBalance = 0;

    const nocsData = balances.map(nocs => {
      const customers = parseInt(nocs.total_customers) || 0;
      const creditQty = parseInt(nocs.credit_qty) || 0;
      const creditBalance = parseFloat(nocs.credit_balance_amt) || 0;
      const dueQty = parseInt(nocs.due_qty) || 0;
      const dueBalance = parseFloat(nocs.due_balance_amt) || 0;
      const netBalance = parseFloat(nocs.net_balance) || 0;

      totalCustomers += customers;
      totalCreditQty += creditQty;
      totalCreditBalance += creditBalance;
      totalDueQty += dueQty;
      totalDueBalance += dueBalance;
      totalNetBalance += netBalance;

      return {
        name: nocs.nocs_name,
        code: nocs.nocs_code,
        customers: customers,
        creditQty: creditQty,
        creditBalance: creditBalance,
        dueQty: dueQty,
        dueBalance: dueBalance,
        netBalance: netBalance
      };
    });

    const reportData = {
      nocs: nocsData,
      summary: {
        totalNocs: balances.length,
        totalCustomers: totalCustomers,
        totalCreditQty: totalCreditQty,
        totalCreditBalance: totalCreditBalance,
        totalDueQty: totalDueQty,
        totalDueBalance: totalDueBalance,
        totalNetBalance: totalNetBalance
      },
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };

    console.log('Summary:');
    console.log('  Total NOCS Areas:', reportData.summary.totalNocs);
    console.log('  Total Customers:', reportData.summary.totalCustomers.toLocaleString('en-IN'));
    console.log('  Credit Balance:', `৳${Math.abs(reportData.summary.totalCreditBalance).toLocaleString('en-IN')} (${reportData.summary.totalCreditQty.toLocaleString('en-IN')} customers)`);
    console.log('  Due Balance:', `৳${reportData.summary.totalDueBalance.toLocaleString('en-IN')} (${reportData.summary.totalDueQty.toLocaleString('en-IN')} customers)`);
    console.log('  Net Balance:', `৳${reportData.summary.totalNetBalance.toLocaleString('en-IN')}`);
    console.log('');

    console.log('Sending to Teams...');
    await teamsService.sendNOCSBalance(reportData);

    console.log('✅ NOCS Balance Dashboard sent successfully to Teams!');
    console.log('');
    console.log('========================================');
    console.log('Check your Teams channel for the report');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNocsBalanceFormat();
