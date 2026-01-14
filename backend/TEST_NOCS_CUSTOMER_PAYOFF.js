/**
 * Test script for NOCS Customer Payoff query
 * Tests the optimized query to fetch all customers for a NOCS
 */

require('dotenv').config();
const { initializeOraclePool, executeQuery, closeOraclePool } = require('./src/config/oracle');
const fs = require('fs').promises;
const path = require('path');

async function testNocsCustomerPayoff() {
  try {
    console.log('🔄 Initializing Oracle connection pool...');
    await initializeOraclePool();

    // Read the SQL query
    const sqlPath = path.join(__dirname, 'reports', 'nocs_customer_payoff.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    const cleanQuery = sql.trim().replace(/;+$/, '');

    // Test with a sample NOCS code (change this to a real NOCS code)
    const testNocsCode = '0101'; // Change this to test with different NOCS

    console.log(`\n📊 Testing NOCS Customer Payoff query for NOCS: ${testNocsCode}`);
    console.log('⏱️  Starting query execution...\n');

    const startTime = Date.now();

    // Execute query with maxRows: 0 to fetch ALL rows
    const result = await executeQuery(
      cleanQuery,
      { nocs_code: testNocsCode },
      { maxRows: 0 } // Fetch all customers
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Query completed successfully!`);
    console.log(`⏱️  Execution time: ${duration} seconds`);
    console.log(`📈 Total customers retrieved: ${result.rows.length}`);

    if (result.rows.length > 0) {
      console.log(`\n📋 Sample data (first 5 customers):`);
      console.log('─'.repeat(100));

      result.rows.slice(0, 5).forEach((row, index) => {
        console.log(`${index + 1}. Customer ID: ${row.CUSTOMER_ID}`);
        console.log(`   Customer Name: ${row.CUSTOMER_NAME}`);
        console.log(`   Customer Type: ${row.CUSTOMER_TYPE}`);
        console.log(`   Payoff Balance: ৳${row.PAYOFF_BALANCE}`);
        console.log(`   Address: ${row.ADDRESS?.substring(0, 50)}...`);
        console.log('─'.repeat(100));
      });

      // Calculate some statistics
      const totalBalance = result.rows.reduce((sum, row) => sum + (parseFloat(row.PAYOFF_BALANCE) || 0), 0);
      const avgBalance = totalBalance / result.rows.length;

      console.log(`\n📊 Statistics:`);
      console.log(`   Total Customers: ${result.rows.length}`);
      console.log(`   Total Balance: ৳${totalBalance.toFixed(2)}`);
      console.log(`   Average Balance: ৳${avgBalance.toFixed(2)}`);

      // Check for customers with names
      const withNames = result.rows.filter(r => r.CUSTOMER_NAME && r.CUSTOMER_NAME !== r.CUSTOMER_ID).length;
      console.log(`   Customers with names: ${withNames} (${((withNames / result.rows.length) * 100).toFixed(1)}%)`);
    } else {
      console.log(`\n⚠️  No customers found for NOCS: ${testNocsCode}`);
      console.log('   This could mean:');
      console.log('   1. The NOCS code doesn\'t exist');
      console.log('   2. The NOCS has no active prepaid customers');
      console.log('   3. The NOCS code format is incorrect');
    }

  } catch (error) {
    console.error('\n❌ Error testing NOCS Customer Payoff query:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    console.log('\n🔄 Closing Oracle connection pool...');
    await closeOraclePool();
    console.log('✅ Test completed\n');
  }
}

// Run the test
testNocsCustomerPayoff();
