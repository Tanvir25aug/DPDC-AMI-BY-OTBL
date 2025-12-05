const cron = require('node-cron');
const batchMonitoringService = require('../services/batch-monitoring.service');
const teamsService = require('../services/teams.service');
const teamsWebhooks = require('../config/teams-webhooks');
const logger = require('../config/logger');

/**
 * Batch Monitoring Scheduler
 * Runs every 30 minutes to:
 * 1. Monitor running batches
 * 2. Track RPS and Records statistics
 * 3. Detect stuck batches
 * 4. Send reports to MS Teams
 */

let isRunning = false;

/**
 * Main batch monitoring job
 */
async function runBatchMonitoringJob() {
  if (isRunning) {
    logger.info('[Batch Monitoring Scheduler] Previous job still running, skipping...');
    return;
  }

  isRunning = true;
  logger.info('[Batch Monitoring Scheduler] Starting batch monitoring job...');

  try {
    // Step 1: Get Pending IMD count
    const pendingIMD = await batchMonitoringService.getPendingIMDCount();
    logger.info(`[Batch Monitoring Scheduler] Pending IMD: ${pendingIMD}`);

    // Step 2: Monitor and save batch status with stuck detection
    const monitoringResults = await batchMonitoringService.monitorAndSaveBatchStatus();
    logger.info(`[Batch Monitoring Scheduler] Monitored ${monitoringResults.length} batches`);

    // Step 3: Get batch statistics (last 24 hours)
    const batchStatistics = await batchMonitoringService.getAllBatchStatistics(24);
    logger.info(`[Batch Monitoring Scheduler] Retrieved statistics for ${batchStatistics.length} batches`);

    // Step 4: Check for stuck batches and send alerts
    const stuckBatches = monitoringResults.filter(result => result.stuckDetection.isStuck);
    if (stuckBatches.length > 0) {
      logger.warn(`[Batch Monitoring Scheduler] Found ${stuckBatches.length} stuck batches!`);

      // Send stuck alerts to Teams
      for (const stuckBatch of stuckBatches) {
        try {
          await sendStuckAlert(stuckBatch.batch, stuckBatch.stuckDetection);

          // Mark alert as sent
          await batchMonitoringService.markAlertAsSent(
            stuckBatch.batch.batchCode,
            stuckBatch.batch.checkTime
          );
        } catch (error) {
          logger.error(`[Batch Monitoring Scheduler] Failed to send stuck alert for ${stuckBatch.batch.batchCode}:`, error);
        }
      }
    }

    // Step 5: Send regular monitoring report to Teams
    await sendMonitoringReport(pendingIMD, monitoringResults, batchStatistics);

    logger.info('[Batch Monitoring Scheduler] Batch monitoring job completed successfully');
  } catch (error) {
    logger.error('[Batch Monitoring Scheduler] Error in batch monitoring job:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Send monitoring report to MS Teams
 */
async function sendMonitoringReport(pendingIMD, monitoringResults, batchStatistics) {
  try {
    // Initialize Teams service with webhook URL
    const webhookUrl = teamsWebhooks.BATCH_MONITORING || teamsWebhooks.DEFAULT;
    if (!webhookUrl) {
      logger.warn('[Batch Monitoring Scheduler] No Teams webhook configured for batch monitoring');
      return;
    }

    teamsService.initialize(webhookUrl);

    // Prepare data for Teams card
    const reportData = {
      pendingIMD: pendingIMD,
      lastUpdate: new Date().toLocaleString('en-US'),
      runningBatches: monitoringResults.map(result => result.batch),
      batchStatistics: batchStatistics,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };

    // Send report
    await teamsService.sendBatchMonitoringReport(reportData);
    logger.info('[Batch Monitoring Scheduler] Monitoring report sent to Teams successfully');
  } catch (error) {
    logger.error('[Batch Monitoring Scheduler] Failed to send monitoring report to Teams:', error);
  }
}

/**
 * Send stuck batch alert to MS Teams
 */
async function sendStuckAlert(batchData, stuckDetection) {
  try {
    // Initialize Teams service with webhook URL
    const webhookUrl = teamsWebhooks.ALERTS || teamsWebhooks.DEFAULT;
    if (!webhookUrl) {
      logger.warn('[Batch Monitoring Scheduler] No Teams webhook configured for alerts');
      return;
    }

    teamsService.initialize(webhookUrl);

    // Send alert
    await teamsService.sendBatchStuckAlert(batchData, stuckDetection);
    logger.info(`[Batch Monitoring Scheduler] Stuck alert sent for batch ${batchData.batchCode}`);
  } catch (error) {
    logger.error(`[Batch Monitoring Scheduler] Failed to send stuck alert for ${batchData.batchCode}:`, error);
  }
}

/**
 * Start the scheduler
 */
function startScheduler() {
  // Run every 30 minutes: 0,30 * * * *
  const cronExpression = '*/30 * * * *';

  logger.info(`[Batch Monitoring Scheduler] Starting scheduler with cron: ${cronExpression}`);

  const job = cron.schedule(cronExpression, async () => {
    try {
      await runBatchMonitoringJob();
    } catch (error) {
      logger.error('[Batch Monitoring Scheduler] Error in scheduled job:', error);
    }
  }, {
    timezone: 'Asia/Dhaka'
  });

  // Run immediately on startup
  logger.info('[Batch Monitoring Scheduler] Running initial batch monitoring job...');
  setTimeout(async () => {
    try {
      await runBatchMonitoringJob();
    } catch (error) {
      logger.error('[Batch Monitoring Scheduler] Error in initial job:', error);
    }
  }, 5000); // Wait 5 seconds after server start

  logger.info('[Batch Monitoring Scheduler] Scheduler started successfully');

  return job;
}

/**
 * Stop the scheduler
 */
function stopScheduler(job) {
  if (job) {
    job.stop();
    logger.info('[Batch Monitoring Scheduler] Scheduler stopped');
  }
}

/**
 * Run job manually (for testing)
 */
async function runManually() {
  logger.info('[Batch Monitoring Scheduler] Running job manually...');
  await runBatchMonitoringJob();
}

module.exports = {
  startScheduler,
  stopScheduler,
  runManually
};
