const cron = require('node-cron');
const billStopBatchJob = require('./billStopBatchJob');
const logger = require('../config/logger');

/**
 * Schedule daily batch jobs
 */
function initializeScheduler() {
  logger.info('[Scheduler] Initializing batch job scheduler...');

  // Run Bill Stop batch job daily at 2:00 AM
  const billStopSchedule = process.env.BILL_STOP_BATCH_SCHEDULE || '0 2 * * *';

  cron.schedule(billStopSchedule, async () => {
    logger.info('[Scheduler] Starting scheduled Bill Stop batch job...');

    try {
      const isRunning = await billStopBatchJob.isBatchRunning();

      if (isRunning) {
        logger.warn('[Scheduler] Bill Stop batch job is already running. Skipping this run.');
        return;
      }

      const result = await billStopBatchJob.runBillStopBatch();
      logger.info('[Scheduler] Bill Stop batch job completed successfully:', result);

    } catch (error) {
      logger.error('[Scheduler] Bill Stop batch job failed:', error);
    }
  }, {
    timezone: process.env.TZ || 'Asia/Dhaka'
  });

  logger.info(`[Scheduler] Bill Stop batch job scheduled: ${billStopSchedule} (${process.env.TZ || 'Asia/Dhaka'})`);
  logger.info('[Scheduler] Scheduler initialized successfully');

  // Run immediately on startup if no data exists for today (catch up missed 2 AM runs)
  // Uses Asia/Dhaka timezone to match batchDate in billStopBatchJob
  // Delayed 10s to avoid race condition with other startup tasks (NOCS scheduler, etc.)
  const pgPool = require('../config/postgresDB');
  setTimeout(async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // YYYY-MM-DD in Dhaka timezone

      // Check if batch is already running (prevents duplicate runs in PM2 cluster mode)
      const isRunning = await billStopBatchJob.isBatchRunning();
      if (isRunning) {
        logger.info('[Scheduler] Bill stop batch already running (another PM2 instance?). Skipping startup run.');
        return;
      }

      const result = await pgPool.query(
        'SELECT COUNT(*) AS count FROM bill_stop_summary WHERE batch_date = $1', [today]
      );
      const count = parseInt(result.rows[0].count);
      if (count === 0) {
        logger.info(`[Scheduler] No bill stop data for today (${today}). Running catch-up batch now...`);
        billStopBatchJob.runBillStopBatch().catch(err => {
          logger.error('[Scheduler] Catch-up bill stop batch failed:', err);
        });
      } else {
        logger.info(`[Scheduler] Bill stop data already exists for today (${today}, ${count} rows). Skipping startup run.`);
      }
    } catch (err) {
      logger.warn('[Scheduler] Could not check bill stop data for today, skipping startup run:', err.message);
    }
  }, 10000); // Wait 10 seconds after server start
}

module.exports = {
  initializeScheduler
};
