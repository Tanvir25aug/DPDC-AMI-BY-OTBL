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
}

module.exports = {
  initializeScheduler
};
