const cron = require('node-cron');
const reportsService = require('./reports.service');
const logger = require('../config/logger');
const { NocsBalanceSummary, sequelize } = require('../models');

/**
 * NOCS Balance Summary Scheduler Service
 * Refreshes NOCS balance data every hour and stores in PostgreSQL
 *
 * Why we need this:
 * - 3 lakh+ customers means query takes 10-20 minutes
 * - Cannot write to Oracle database (read-only access)
 * - Solution: Run query hourly in background, cache results in PostgreSQL
 * - Users get instant response from PostgreSQL cache (<0.1 seconds)
 *
 * Fixes applied:
 * - Switched from setInterval to node-cron (fires at clock time, survives PM2 restarts)
 * - Oracle query runs OUTSIDE PostgreSQL transaction (transaction held open for milliseconds, not 20 min)
 * - callTimeout set to 30 minutes (query can take 10-20 min on loaded Oracle)
 */

// Oracle query timeout: 30 minutes (query takes 10-20 min on heavy load)
const ORACLE_CALL_TIMEOUT = 30 * 60 * 1000; // 1,800,000 ms

let cronJob = null;
let isRefreshing = false;
let lastRefreshTime = null;
let lastRefreshDuration = null;
let lastRefreshError = null;

/**
 * Refresh NOCS balance summary data
 * Runs the complex Oracle query and stores results in PostgreSQL
 */
async function refreshNocsBalanceData() {
  if (isRefreshing) {
    logger.warn('[NOCS Balance Scheduler] Refresh already in progress, skipping...');
    return;
  }

  isRefreshing = true;
  const startTime = Date.now();

  try {
    logger.info('========================================');
    logger.info('[NOCS Balance Scheduler] Starting NOCS balance refresh...');
    logger.info(`[NOCS Balance Scheduler] Start time: ${new Date().toISOString()}`);
    logger.info(`[NOCS Balance Scheduler] Oracle timeout: ${ORACLE_CALL_TIMEOUT / 60000} minutes`);
    logger.info('========================================');

    // Step 1: Execute Oracle query OUTSIDE any PostgreSQL transaction
    // This avoids holding a PG transaction open for 10-20 minutes
    logger.info('[NOCS Balance Scheduler] Executing Oracle query (may take 10-20 minutes)...');
    const oracleData = await reportsService.executeReport(
      'nocs_balance_summary',
      {},
      { maxRows: 0, callTimeout: ORACLE_CALL_TIMEOUT }
    );
    logger.info(`[NOCS Balance Scheduler] Oracle query completed. Retrieved ${oracleData.length} NOCS areas`);

    if (!oracleData.length) {
      logger.warn('[NOCS Balance Scheduler] Oracle returned 0 rows — skipping PostgreSQL update to preserve existing cache');
      return;
    }

    // Step 2: Transform data (outside transaction — pure JS, instant)
    const queryDuration = Date.now() - startTime;
    const preparedData = oracleData.map(row => ({
      nocs_name: row.NOCS_NAME,
      nocs_code: row.NOCS_CODE,
      total_customers: parseInt(row.TOTAL_CUSTOMERS) || 0,
      credit_qty: parseInt(row.CREDIT_QTY) || 0,
      credit_balance_amt: parseFloat(row.CREDIT_BALANCE_AMT) || 0,
      due_qty: parseInt(row.DUE_QTY) || 0,
      due_balance_amt: parseFloat(row.DUE_BALANCE_AMT) || 0,
      net_balance: parseFloat(row.NET_BALANCE) || 0,
      refresh_duration: queryDuration,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Step 3: Open PostgreSQL transaction ONLY for the fast DB operations (milliseconds)
    logger.info('[NOCS Balance Scheduler] Writing fresh data to PostgreSQL...');
    const transaction = await sequelize.transaction();
    try {
      await NocsBalanceSummary.destroy({ where: {}, truncate: true, transaction });
      await NocsBalanceSummary.bulkCreate(preparedData, { transaction });
      await transaction.commit();
      logger.info(`[NOCS Balance Scheduler] Inserted ${preparedData.length} records — transaction committed`);
    } catch (pgError) {
      await transaction.rollback();
      logger.error('[NOCS Balance Scheduler] PostgreSQL transaction rolled back:', pgError.message);
      throw pgError;
    }

    const totalDuration = Date.now() - startTime;
    lastRefreshTime = new Date();
    lastRefreshDuration = totalDuration;
    lastRefreshError = null;

    logger.info('========================================');
    logger.info('[NOCS Balance Scheduler] NOCS balance refresh completed successfully');
    logger.info(`[NOCS Balance Scheduler] End time: ${new Date().toISOString()}`);
    logger.info(`[NOCS Balance Scheduler] Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    logger.info(`[NOCS Balance Scheduler] NOCS areas cached: ${preparedData.length}`);
    logger.info('========================================');

  } catch (error) {
    const duration = Date.now() - startTime;
    lastRefreshError = error.message;

    logger.error('========================================');
    logger.error('[NOCS Balance Scheduler] ERROR during NOCS balance refresh');
    logger.error(`[NOCS Balance Scheduler] Duration: ${(duration / 1000).toFixed(2)} seconds`);
    logger.error(`[NOCS Balance Scheduler] Error: ${error.message}`);
    logger.error(`[NOCS Balance Scheduler] Stack: ${error.stack}`);
    logger.error('========================================');

    // Don't throw — let scheduler continue next hour
  } finally {
    isRefreshing = false;
  }
}

/**
 * Start the scheduler
 * Uses node-cron so it fires at the top of every hour (clock time)
 * regardless of when the process started or was restarted by PM2
 */
function startScheduler() {
  if (cronJob) {
    logger.warn('[NOCS Balance Scheduler] Scheduler already running');
    return;
  }

  logger.info('========================================');
  logger.info('[NOCS Balance Scheduler] Starting NOCS Balance Scheduler');
  logger.info('[NOCS Balance Scheduler] Schedule: top of every hour (0 * * * *)');
  logger.info('[NOCS Balance Scheduler] Timezone: Asia/Dhaka');
  logger.info('========================================');

  // Schedule: minute 0 of every hour — fires at 01:00, 02:00, 03:00 ... 23:00 (Asia/Dhaka)
  cronJob = cron.schedule('0 * * * *', () => {
    refreshNocsBalanceData().catch(err => {
      logger.error('[NOCS Balance Scheduler] Scheduled refresh failed:', err);
    });
  }, {
    timezone: 'Asia/Dhaka'
  });

  logger.info('[NOCS Balance Scheduler] Cron job registered — next run at top of next hour');

  // Also run immediately on startup to populate cache
  logger.info('[NOCS Balance Scheduler] Running initial refresh now...');
  refreshNocsBalanceData().catch(err => {
    logger.error('[NOCS Balance Scheduler] Initial refresh failed:', err);
  });
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info('[NOCS Balance Scheduler] Scheduler stopped');
  }
}

/**
 * Get cached NOCS balance data from PostgreSQL
 */
async function getCachedData() {
  try {
    const data = await NocsBalanceSummary.findAll({
      order: [['nocs_name', 'ASC']],
      raw: true
    });

    if (data && data.length > 0) {
      logger.info(`[NOCS Balance Scheduler] Returning ${data.length} records from PostgreSQL cache`);

      const lastUpdated = data[0].updated_at;
      const ageMinutes = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000);

      return { data, count: data.length, lastUpdated, ageMinutes, source: 'postgresql_cache' };
    }

    logger.warn('[NOCS Balance Scheduler] No data in PostgreSQL cache');

    if (!isRefreshing) {
      logger.info('[NOCS Balance Scheduler] Triggering immediate refresh...');
      await refreshNocsBalanceData();

      const newData = await NocsBalanceSummary.findAll({
        order: [['nocs_name', 'ASC']],
        raw: true
      });

      if (newData && newData.length > 0) {
        return {
          data: newData,
          count: newData.length,
          lastUpdated: newData[0].updated_at,
          source: 'postgresql_cache'
        };
      }
    }

    return null;

  } catch (error) {
    logger.error('[NOCS Balance Scheduler] Error getting cached data:', error);
    return null;
  }
}

/**
 * Force immediate refresh (manual refresh button)
 */
async function forceRefresh() {
  logger.info('[NOCS Balance Scheduler] Manual refresh triggered');
  await refreshNocsBalanceData();

  try {
    const data = await NocsBalanceSummary.findAll({
      order: [['nocs_name', 'ASC']],
      raw: true
    });

    if (data && data.length > 0) {
      return {
        data,
        count: data.length,
        lastUpdated: data[0].updated_at,
        source: 'postgresql_cache',
        manualRefresh: true
      };
    }

    return null;
  } catch (error) {
    logger.error('[NOCS Balance Scheduler] Error after force refresh:', error);
    return null;
  }
}

/**
 * Get scheduler status
 */
async function getStatus() {
  let cacheAvailable = false;
  let recordCount = 0;
  let lastUpdated = null;

  try {
    const count = await NocsBalanceSummary.count();
    const latest = await NocsBalanceSummary.findOne({
      attributes: ['updated_at'],
      order: [['updated_at', 'DESC']],
      raw: true
    });

    cacheAvailable = count > 0;
    recordCount = count;
    lastUpdated = latest ? latest.updated_at : null;
  } catch (error) {
    logger.error('[NOCS Balance Scheduler] Error checking status:', error);
  }

  return {
    running: cronJob !== null,
    isRefreshing,
    lastRefreshTime,
    lastRefreshDuration,
    lastRefreshError,
    schedule: '0 * * * * (top of every hour, Asia/Dhaka)',
    cacheType: 'postgresql',
    cacheAvailable,
    recordCount,
    lastUpdated
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  getCachedData,
  forceRefresh,
  getStatus,
  refreshNocsBalanceData
};
