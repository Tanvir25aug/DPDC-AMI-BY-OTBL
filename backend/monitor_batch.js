#!/usr/bin/env node

/**
 * Monitor Bill Stop Batch Job
 * Shows real-time status and updates every 10 seconds
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

async function checkStatus() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        batch_date,
        start_time,
        end_time,
        status,
        summary_count,
        details_count,
        duration_seconds
      FROM bill_stop_batch_log
      ORDER BY id DESC
      LIMIT 1
    `);

    console.clear();
    console.log('='.repeat(60));
    console.log('BILL STOP BATCH JOB - REAL-TIME MONITOR');
    console.log('='.repeat(60));
    console.log('');

    if (result.rows.length === 0) {
      console.log('❌ No batch jobs found');
      console.log('');
      console.log('Run: node RUN_BILL_STOP_BATCH.js');
      return;
    }

    const job = result.rows[0];
    const now = new Date();
    const started = new Date(job.start_time);
    const runningMinutes = Math.floor((now - started) / 1000 / 60);
    const runningSeconds = Math.floor((now - started) / 1000);

    console.log(`Job ID: #${job.id}`);
    console.log(`Started: ${started.toLocaleTimeString()}`);
    console.log(`Status: ${job.status.toUpperCase()}`);
    console.log('');

    if (job.status === 'running') {
      console.log('⏳ RUNNING...');
      console.log(`   Duration: ${runningMinutes} min ${runningSeconds % 60} sec`);
      console.log('');
      console.log('Current Task: Fetching data from Oracle');
      console.log('Expected Time: 20-40 minutes total');
      console.log('');

      const progress = Math.min((runningMinutes / 30) * 100, 99);
      const barLength = 40;
      const filledLength = Math.floor(barLength * progress / 100);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

      console.log(`Progress: [${bar}] ${progress.toFixed(0)}%`);
      console.log('');
      console.log('💡 This is normal! Oracle query is processing large dataset.');
      console.log('   Be patient and wait for completion...');

    } else if (job.status === 'completed') {
      const ended = new Date(job.end_time);
      const duration = Math.floor(job.duration_seconds / 60);

      console.log('✅ COMPLETED SUCCESSFULLY!');
      console.log(`   Ended: ${ended.toLocaleTimeString()}`);
      console.log(`   Duration: ${duration} minutes`);
      console.log('');
      console.log(`📊 Results:`);
      console.log(`   Summary Records: ${job.summary_count.toLocaleString()}`);
      console.log(`   Detail Records: ${job.details_count.toLocaleString()}`);
      console.log('');
      console.log('✅ Next Steps:');
      console.log('   1. Restart backend: npm run dev');
      console.log('   2. Test UI: Click "Bill Stop Analysis"');
      console.log('   3. Data should load instantly!');

    } else if (job.status === 'failed') {
      console.log('❌ FAILED!');
      console.log(`   Ended: ${new Date(job.end_time).toLocaleTimeString()}`);
      console.log('');
      console.log('Check error in batch log:');
      console.log('   cat batch_run.log | tail -50');

    }

    console.log('');
    console.log('='.repeat(60));
    console.log('Press Ctrl+C to stop monitoring');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error checking status:', error.message);
  }
}

// Run every 10 seconds
console.log('Starting monitor... Press Ctrl+C to stop\n');
checkStatus();
const interval = setInterval(checkStatus, 10000);

// Cleanup on exit
process.on('SIGINT', async () => {
  clearInterval(interval);
  await pool.end();
  console.log('\n\nMonitoring stopped.');
  process.exit(0);
});
