const reportsService = require('./reports.service');
const logger = require('../config/logger');
const { NocsBalanceSummary, sequelize } = require('../models');

/**
 * NOCS Balance Summary Scheduler Service
 * Refreshes NOCS balance data every hour and stores in PostgreSQL
 *
 * Why we need this:
 * - 3 lakh+ customers means query takes 5-10 minutes
 * - Cannot write to Oracle database (read-only access)
 * - Solution: Run query hourly in background, cache results in PostgreSQL
 * - Users get instant response from PostgreSQL cache (<0.1 seconds)
 *
 * Why PostgreSQL instead of memory:
 * - ✅ Data survives server restarts
 * - ✅ Multiple backend servers can share cache
 * - ✅ Easy to monitor and debug
 * - ✅ Can query data directly with SQL
 * - ✅ Transaction safety
 */

const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

let refreshTimer = null;
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
  const transaction = await sequelize.transaction();

  try {
    logger.info('========================================');
    logger.info('[NOCS Balance Scheduler] Starting NOCS balance refresh...');
    logger.info(`[NOCS Balance Scheduler] Start time: ${new Date().toISOString()}`);
    logger.info('========================================');

    // Step 1: Execute Oracle query (may take 5-10 minutes for 3 lakh customers)
    logger.info('[NOCS Balance Scheduler] Executing Oracle query...');
    const oracleData = await reportsService.executeReport('nocs_balance_summary');
    logger.info(`[NOCS Balance Scheduler] Oracle query completed. Retrieved ${oracleData.length} NOCS areas`);

    // Step 2: Delete old data from PostgreSQL
    logger.info('[NOCS Balance Scheduler] Clearing old PostgreSQL data...');
    await NocsBalanceSummary.destroy({
      where: {},
      truncate: true,
      transaction
    });
    logger.info('[NOCS Balance Scheduler] Old data cleared');

    // Step 3: Transform and prepare data for PostgreSQL
    const duration = Date.now() - startTime;
    const preparedData = oracleData.map(row => ({
      nocs_name: row.NOCS_NAME,
      nocs_code: row.NOCS_CODE,
      total_customers: parseInt(row.TOTAL_CUSTOMERS) || 0,
      credit_qty: parseInt(row.CREDIT_QTY) || 0,
      credit_balance_amt: parseFloat(row.CREDIT_BALANCE_AMT) || 0,
      due_qty: parseInt(row.DUE_QTY) || 0,
      due_balance_amt: parseFloat(row.DUE_BALANCE_AMT) || 0,
      net_balance: parseFloat(row.NET_BALANCE) || 0,
      refresh_duration: duration,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Step 4: Insert new data into PostgreSQL
    logger.info('[NOCS Balance Scheduler] Inserting fresh data into PostgreSQL...');
    await NocsBalanceSummary.bulkCreate(preparedData, { transaction });
    logger.info(`[NOCS Balance Scheduler] Inserted ${preparedData.length} records`);

    // Step 5: Commit transaction
    await transaction.commit();
    logger.info('[NOCS Balance Scheduler] Transaction committed successfully');

    lastRefreshTime = new Date();
    lastRefreshDuration = duration;
    lastRefreshError = null;

    logger.info('========================================');
    logger.info('[NOCS Balance Scheduler] NOCS balance refresh completed successfully');
    logger.info(`[NOCS Balance Scheduler] End time: ${new Date().toISOString()}`);
    logger.info(`[NOCS Balance Scheduler] Duration: ${(duration / 1000).toFixed(2)} seconds`);
    logger.info(`[NOCS Balance Scheduler] NOCS areas processed: ${preparedData.length}`);
    logger.info(`[NOCS Balance Scheduler] Data saved to PostgreSQL table: nocs_balance_summary`);
    logger.info(`[NOCS Balance Scheduler] Next refresh: ${new Date(Date.now() + REFRESH_INTERVAL).toISOString()}`);
    logger.info('========================================');

  } catch (error) {
    const duration = Date.now() - startTime;
    lastRefreshError = error.message;

    // Rollback transaction on error
    await transaction.rollback();
    logger.error('[NOCS Balance Scheduler] Transaction rolled back due to error');

    logger.error('========================================');
    logger.error('[NOCS Balance Scheduler] ERROR during NOCS balance refresh');
    logger.error(`[NOCS Balance Scheduler] Duration: ${(duration / 1000).toFixed(2)} seconds`);
    logger.error(`[NOCS Balance Scheduler] Error: ${error.message}`);
    logger.error(`[NOCS Balance Scheduler] Stack: ${error.stack}`);
    logger.error('========================================');

    // Don't throw - let scheduler continue
  } finally {
    isRefreshing = false;
  }
}

/**
 * Start the scheduler
 * Runs immediately on startup, then every hour
 */
function startScheduler() {
  if (refreshTimer) {
    logger.warn('[NOCS Balance Scheduler] Scheduler already running');
    return;
  }

  logger.info('========================================');
  logger.info('[NOCS Balance Scheduler] Starting NOCS Balance Scheduler');
  logger.info(`[NOCS Balance Scheduler] Refresh interval: Every ${REFRESH_INTERVAL / 60000} minutes`);
  logger.info('========================================');

  // Run immediately on startup
  refreshNocsBalanceData().catch(err => {
    logger.error('[NOCS Balance Scheduler] Initial refresh failed:', err);
  });

  // Schedule hourly refresh
  refreshTimer = setInterval(() => {
    refreshNocsBalanceData().catch(err => {
      logger.error('[NOCS Balance Scheduler] Scheduled refresh failed:', err);
    });
  }, REFRESH_INTERVAL);

  logger.info('[NOCS Balance Scheduler] Scheduler started successfully');
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    logger.info('[NOCS Balance Scheduler] Scheduler stopped');
  }
}

/**
 * Get cached NOCS balance data from PostgreSQL
 * Returns data or triggers refresh if not available
 */
async function getCachedData() {
  try {
    // Query PostgreSQL for cached data
    const data = await NocsBalanceSummary.findAll({
      order: [['nocs_name', 'ASC']],
      raw: true
    });

    if (data && data.length > 0) {
      logger.info(`[NOCS Balance Scheduler] Returning ${data.length} records from PostgreSQL cache`);

      // Get last update time
      const lastUpdated = data[0].updated_at;
      const ageMinutes = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000);

      return {
        data,
        count: data.length,
        lastUpdated,
        ageMinutes,
        source: 'postgresql_cache'
      };
    }

    logger.warn('[NOCS Balance Scheduler] No data in PostgreSQL cache');

    // If no data and not currently refreshing, trigger a refresh
    if (!isRefreshing) {
      logger.info('[NOCS Balance Scheduler] Triggering immediate refresh...');
      await refreshNocsBalanceData();

      // Try to get data again after refresh
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

    // If refresh is in progress, return null (controller will handle)
    return null;

  } catch (error) {
    logger.error('[NOCS Balance Scheduler] Error getting cached data:', error);
    return null;
  }
}

/**
 * Force immediate refresh (for manual refresh button)
 */
async function forceRefresh() {
  logger.info('[NOCS Balance Scheduler] Manual refresh triggered');
  await refreshNocsBalanceData();

  // Return fresh data from PostgreSQL
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
  // Check if data exists in PostgreSQL
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
    running: refreshTimer !== null,
    isRefreshing,
    lastRefreshTime,
    lastRefreshDuration,
    lastRefreshError,
    nextRefreshTime: refreshTimer ? new Date(Date.now() + REFRESH_INTERVAL) : null,
    refreshInterval: REFRESH_INTERVAL,
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
