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
  const pgPool = require('../config/postgresDB');
  const today = new Date().toISOString().split('T')[0];
  pgPool.query('SELECT COUNT(*) AS count FROM bill_stop_summary WHERE batch_date = $1', [today])
    .then(result => {
      const count = parseInt(result.rows[0].count);
      if (count === 0) {
        logger.info(`[Scheduler] No bill stop data for today (${today}). Running catch-up batch now...`);
        billStopBatchJob.runBillStopBatch().catch(err => {
          logger.error('[Scheduler] Catch-up bill stop batch failed:', err);
        });
      } else {
        logger.info(`[Scheduler] Bill stop data already exists for today (${today}). Skipping startup run.`);
      }
    })
    .catch(err => {
      logger.warn('[Scheduler] Could not check bill stop data for today, skipping startup run:', err.message);
    });
}

module.exports = {
  initializeScheduler
};
