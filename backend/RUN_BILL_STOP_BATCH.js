#!/usr/bin/env node

/**
 * Manual Bill Stop Batch Job Runner
 * Run this script to manually execute the bill stop batch job
 *
 * Usage:
 *   node RUN_BILL_STOP_BATCH.js
 */

require('dotenv').config();
const billStopBatchJob = require('./src/jobs/billStopBatchJob');
const { initializeOraclePool, closeOraclePool } = require('./src/config/oracle');

console.log('='.repeat(60));
console.log('MANUAL BILL STOP BATCH JOB');
console.log('='.repeat(60));
console.log('');
console.log('This will:');
console.log('1. Fetch ALL bill stop data from Oracle (may take 10-30 min)');
console.log('2. Save data to PostgreSQL');
console.log('3. Make data available for fast reporting');
console.log('');
console.log('='.repeat(60));
console.log('');

(async () => {
  try {
    // Initialize Oracle connection pool
    console.log('Initializing Oracle connection pool...');
    await initializeOraclePool();
    console.log('✅ Oracle connection pool initialized\n');

    // Check if batch is already running
    const isRunning = await billStopBatchJob.isBatchRunning();

    if (isRunning) {
      console.error('❌ ERROR: Batch job is already running!');
      console.error('Please wait for the current job to complete.');
      await closeOraclePool();
      process.exit(1);
    }

    // Run the batch job
    const result = await billStopBatchJob.runBillStopBatch();

    console.log('\n✅ SUCCESS!');
    console.log('Batch job completed successfully.');
    console.log(`Summary records: ${result.summary_count}`);
    console.log(`Detail records: ${result.details_count}`);
    console.log(`Duration: ${result.duration_seconds} seconds`);

    // Close Oracle connection pool
    await closeOraclePool();
    console.log('\n✅ Oracle connection pool closed');

    // Close PostgreSQL pool
    await billStopBatchJob.pgPool.end();
    console.log('✅ PostgreSQL connection pool closed');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ FAILED!');
    console.error('Batch job failed with error:');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);

    // Cleanup
    try {
      await closeOraclePool();
      await billStopBatchJob.pgPool.end();
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    process.exit(1);
  }
})();
