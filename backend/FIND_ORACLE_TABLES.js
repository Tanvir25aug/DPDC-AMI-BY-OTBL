/**
 * Find Oracle Tables
 * Check what tables exist in the Oracle database
 */

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const { initializeOraclePool, executeQuery, closeOraclePool } = require('./src/config/oracle');

async function findTables() {
  console.log('🔍 Searching for batch-related tables in Oracle...\n');

  try {
    // Initialize Oracle
    await initializeOraclePool();
    console.log('✅ Oracle connected\n');

    // Search for batch-related tables
    console.log('📊 Looking for BATCH tables:');
    const batchTables = await executeQuery(`
      SELECT table_name, owner
      FROM all_tables
      WHERE UPPER(table_name) LIKE '%BATCH%'
      ORDER BY table_name
    `);

    if (batchTables.rows && batchTables.rows.length > 0) {
      console.log(`Found ${batchTables.rows.length} BATCH tables:\n`);
      batchTables.rows.forEach(table => {
        console.log(`  - ${table.OWNER}.${table.TABLE_NAME}`);
      });
    } else {
      console.log('  No BATCH tables found');
    }

    console.log('\n📊 Looking for IMD/PROC tables:');
    const imdTables = await executeQuery(`
      SELECT table_name, owner
      FROM all_tables
      WHERE UPPER(table_name) LIKE '%IMD%'
         OR UPPER(table_name) LIKE '%PROC%'
         OR UPPER(table_name) LIKE '%BUSI%'
      ORDER BY table_name
    `);

    if (imdTables.rows && imdTables.rows.length > 0) {
      console.log(`Found ${imdTables.rows.length} IMD/PROC tables:\n`);
      imdTables.rows.forEach(table => {
        console.log(`  - ${table.OWNER}.${table.TABLE_NAME}`);
      });
    } else {
      console.log('  No IMD/PROC tables found');
    }

    console.log('\n📊 Looking for JOB/EXECUTION tables:');
    const jobTables = await executeQuery(`
      SELECT table_name, owner
      FROM all_tables
      WHERE UPPER(table_name) LIKE '%JOB%'
         OR UPPER(table_name) LIKE '%EXEC%'
      ORDER BY table_name
    `);

    if (jobTables.rows && jobTables.rows.length > 0) {
      console.log(`Found ${jobTables.rows.length} JOB/EXECUTION tables:\n`);
      jobTables.rows.forEach(table => {
        console.log(`  - ${table.OWNER}.${table.TABLE_NAME}`);
      });
    } else {
      console.log('  No JOB/EXECUTION tables found');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closeOraclePool();
    process.exit(0);
  }
}

findTables();
