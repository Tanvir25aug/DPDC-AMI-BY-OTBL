#!/usr/bin/env node

/**
 * Check Billing Status Breakdown
 * Verifies we have both "Bill Stop Issue" and "Active Billing" customers
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'dpdc_ami_dev',
  user: process.env.PG_USER || 'dev_user',
  password: process.env.PG_PASSWORD || 'admin',
});

async function checkBillingStatus() {
  try {
    console.log('='.repeat(60));
    console.log('BILLING STATUS BREAKDOWN');
    console.log('='.repeat(60));
    console.log('');

    // Get billing status counts
    const statusResult = await pool.query(`
      SELECT
        billing_status,
        COUNT(*) as count
      FROM bill_stop_details
      WHERE batch_date = CURRENT_DATE
      GROUP BY billing_status
      ORDER BY billing_status
    `);

    console.log('📊 Customer Breakdown by Billing Status:');
    console.log('');

    let totalCount = 0;
    let billStopCount = 0;
    let activeBillingCount = 0;

    statusResult.rows.forEach(row => {
      totalCount += parseInt(row.count);

      if (row.billing_status === 'Bill Stop Issue') {
        billStopCount = parseInt(row.count);
        console.log(`  ❌ Bill Stop Issue: ${row.count.toLocaleString()}`);
      } else if (row.billing_status === 'Active Billing') {
        activeBillingCount = parseInt(row.count);
        console.log(`  ✅ Active Billing: ${row.count.toLocaleString()}`);
      } else {
        console.log(`  ❓ ${row.billing_status}: ${row.count.toLocaleString()}`);
      }
    });

    console.log('');
    console.log(`  📊 Total Customers: ${totalCount.toLocaleString()}`);
    console.log('');

    // Get summary statistics
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) as total_crps,
        SUM(total_cpc_count) as total_cpcs,
        SUM(bill_stop_count) as total_bill_stop,
        SUM(active_billing_count) as total_active_billing
      FROM bill_stop_summary
      WHERE batch_date = CURRENT_DATE
    `);

    if (summaryResult.rows.length > 0) {
      const summary = summaryResult.rows[0];
      console.log('📊 Summary Statistics:');
      console.log('');
      console.log(`  Total CRPs: ${summary.total_crps}`);
      console.log(`  Total CPCs: ${summary.total_cpcs}`);
      console.log(`  Bill Stop Issues: ${summary.total_bill_stop}`);
      console.log(`  Active Billing: ${summary.total_active_billing}`);
      console.log('');
    }

    // Sample data
    console.log('='.repeat(60));
    console.log('SAMPLE DATA (First 10 customers):');
    console.log('='.repeat(60));
    console.log('');

    const sampleResult = await pool.query(`
      SELECT
        crp_account_no,
        cpc_customer_no,
        customer_name,
        billing_status,
        last_bill_date
      FROM bill_stop_details
      WHERE batch_date = CURRENT_DATE
      ORDER BY billing_status, crp_account_no
      LIMIT 10
    `);

    sampleResult.rows.forEach((row, index) => {
      const status = row.billing_status === 'Active Billing' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${row.billing_status}`);
      console.log(`   CRP: ${row.crp_account_no}`);
      console.log(`   CPC: ${row.cpc_customer_no}`);
      console.log(`   Name: ${row.customer_name}`);
      console.log(`   Last Bill: ${row.last_bill_date || 'Never Billed'}`);
      console.log('');
    });

    console.log('='.repeat(60));

    if (activeBillingCount > 0) {
      console.log('✅ SUCCESS! Both billing statuses are present!');
      console.log('');
      console.log('   ✅ Bill Stop Issues: ' + billStopCount);
      console.log('   ✅ Active Billing: ' + activeBillingCount);
    } else {
      console.log('⚠️  WARNING: No "Active Billing" customers found!');
      console.log('');
      console.log('   This means all customers have bill stop issues.');
      console.log('   This could be correct if ALL customers stopped billing,');
      console.log('   or the query might still need adjustment.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBillingStatus();
