const { getOracleConnection, executeQuery } = require('../config/oracle');
const { sequelize } = require('../models');

/**
 * Batch Monitoring Service
 * Handles batch performance monitoring, stuck detection, and statistics tracking
 */

/**
 * Get currently running batches with detailed information
 */
async function getRunningBatchesDetails() {
  try {
    // Use the same query as the frontend to get real records count and RPS
    const result = await executeQuery(
      `SELECT
        run.BATCH_CD as "batchCode",
        job.BATCH_JOB_STAT_FLG as "statusFlag",
        run.START_DTTM as "startTime",
        run.BATCH_BUS_DT as "businessDate",
        SUM(inst.REC_PROC_CNT) as "totalRecords"
      FROM CISADM.CI_BATCH_JOB job
      JOIN CISADM.CI_BATCH_RUN run ON job.BATCH_CD = run.BATCH_CD
      JOIN CISADM.CI_BATCH_INST inst ON run.BATCH_NBR = inst.BATCH_NBR AND job.BATCH_NBR = inst.BATCH_NBR
      WHERE job.BATCH_JOB_STAT_FLG = 'ST'
        AND run.BATCH_CD = inst.BATCH_CD
        AND run.BATCH_CD NOT IN ('F1-FLUSH', 'C1-WFSUB', 'BILLRESTSMS', 'C1-PPBTR')
      GROUP BY run.BATCH_CD, job.BATCH_JOB_STAT_FLG, run.START_DTTM, run.BATCH_BUS_DT
      ORDER BY run.START_DTTM DESC`
    );

    const batches = result.rows || [];

    // Calculate RPS and duration for each batch
    const batchesWithStats = batches.map(batch => {
      const startTime = new Date(batch.startTime);
      const now = new Date();
      const durationSeconds = Math.floor((now - startTime) / 1000);
      const records = Number(batch.totalRecords) || 0;
      const rps = durationSeconds > 0 ? (records / durationSeconds) : 0;

      return {
        batchCode: batch.batchCode?.trim() || 'Unknown',
        startTime: batch.startTime,
        businessDate: batch.businessDate,
        statusFlag: batch.statusFlag?.trim(),
        totalRecords: records,
        durationSeconds,
        rps: parseFloat(rps.toFixed(2)),
        status: 'Running',
        checkTime: now
      };
    });

    return batchesWithStats;
  } catch (error) {
    console.error('[Batch Monitoring] Error getting running batches:', error);
    return [];
  }
}

/**
 * Get pending IMD count
 */
async function getPendingIMDCount() {
  try {
    const result = await executeQuery(
      `SELECT COUNT(*) as "count"
      FROM CISADM.D1_IMD_CTRL
      WHERE BO_STATUS_CD = 'PENDING'`
    );

    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('[Batch Monitoring] Error getting pending IMD count:', error);
    return 0;
  }
}

/**
 * Save batch monitoring history to PostgreSQL
 */
async function saveBatchHistory(batchData) {
  try {
    const query = `
      INSERT INTO batch_monitoring_history
      (batch_code, check_time, records_processed, rps, duration_seconds, status, is_stuck, alert_sent, notes)
      VALUES (:batchCode, :checkTime, :totalRecords, :rps, :durationSeconds, :status, :isStuck, :alertSent, :notes)
      RETURNING id
    `;

    const replacements = {
      batchCode: batchData.batchCode,
      checkTime: batchData.checkTime,
      totalRecords: batchData.totalRecords,
      rps: batchData.rps,
      durationSeconds: batchData.durationSeconds,
      status: batchData.status,
      isStuck: batchData.isStuck || false,
      alertSent: batchData.alertSent || false,
      notes: batchData.notes || null
    };

    const [result] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.INSERT
    });

    return result;
  } catch (error) {
    console.error('[Batch Monitoring] Error saving batch history:', error);
    throw error;
  }
}

/**
 * Get previous batch history for stuck detection
 */
async function getPreviousBatchHistory(batchCode, minutesAgo = 30) {
  try {
    // Note: minutesAgo is safe to interpolate (it's a number parameter, not user input)
    const query = `
      SELECT
        batch_code,
        check_time,
        records_processed,
        rps,
        duration_seconds,
        status,
        is_stuck
      FROM batch_monitoring_history
      WHERE batch_code = :batchCode
        AND check_time >= NOW() - INTERVAL '${parseInt(minutesAgo)} minutes'
      ORDER BY check_time DESC
      LIMIT 5
    `;

    const result = await sequelize.query(query, {
      replacements: { batchCode },
      type: sequelize.QueryTypes.SELECT
    });

    return result;
  } catch (error) {
    console.error('[Batch Monitoring] Error getting previous batch history:', error);
    return [];
  }
}

/**
 * Detect if a batch is stuck
 * A batch is considered stuck if:
 * 1. Records haven't increased in the last check
 * 2. RPS is below 1
 * 3. Batch has been running for more than 10 minutes
 */
async function detectStuckBatch(currentBatch) {
  const previousHistory = await getPreviousBatchHistory(currentBatch.batchCode, 60);

  // Need at least one previous record to compare
  if (previousHistory.length === 0) {
    return {
      isStuck: false,
      reason: null,
      statistics: null
    };
  }

  const previousCheck = previousHistory[0];
  const recordsIncreased = currentBatch.totalRecords > previousCheck.records_processed;
  const lowRps = currentBatch.rps < 1;
  const runningTooLong = currentBatch.durationSeconds > 600; // 10 minutes

  // Calculate statistics
  const recordsDiff = currentBatch.totalRecords - previousCheck.records_processed;
  const rpsTrend = calculateRpsTrend(previousHistory, currentBatch);

  const statistics = {
    previousRecords: previousCheck.records_processed,
    currentRecords: currentBatch.totalRecords,
    recordsDiff: recordsDiff,
    previousRps: previousCheck.rps,
    currentRps: currentBatch.rps,
    rpsTrend: rpsTrend,
    checksAnalyzed: previousHistory.length
  };

  // Determine if stuck
  let isStuck = false;
  let reason = null;

  if (!recordsIncreased && runningTooLong) {
    isStuck = true;
    reason = `Records not increasing (stuck at ${currentBatch.totalRecords.toLocaleString()} records)`;
  } else if (lowRps && runningTooLong) {
    isStuck = true;
    reason = `Very low RPS (${currentBatch.rps} RPS) - potential performance issue`;
  }

  return {
    isStuck,
    reason,
    statistics
  };
}

/**
 * Calculate RPS trend from historical data
 */
function calculateRpsTrend(history, currentBatch) {
  if (history.length === 0) return 'stable';

  const allRps = [...history.map(h => h.rps), currentBatch.rps];
  const avgRps = allRps.reduce((sum, rps) => sum + rps, 0) / allRps.length;
  const currentRps = currentBatch.rps;

  if (currentRps > avgRps * 1.2) return 'improving';
  if (currentRps < avgRps * 0.8) return 'degrading';
  return 'stable';
}

/**
 * Get batch statistics for a specific batch
 */
async function getBatchStatistics(batchCode, hoursAgo = 24) {
  try {
    // Note: hoursAgo is safe to interpolate (it's a number parameter, not user input)
    const query = `
      SELECT
        COUNT(*) as total_checks,
        AVG(rps) as avg_rps,
        MAX(rps) as max_rps,
        MIN(rps) as min_rps,
        AVG(records_processed) as avg_records,
        MAX(records_processed) as max_records,
        COUNT(CASE WHEN is_stuck = true THEN 1 END) as stuck_count,
        MAX(check_time) as last_check
      FROM batch_monitoring_history
      WHERE batch_code = :batchCode
        AND check_time >= NOW() - INTERVAL '${parseInt(hoursAgo)} hours'
    `;

    const result = await sequelize.query(query, {
      replacements: { batchCode },
      type: sequelize.QueryTypes.SELECT
    });

    return result[0] || null;
  } catch (error) {
    console.error('[Batch Monitoring] Error getting batch statistics:', error);
    return null;
  }
}

/**
 * Get all batch statistics for reporting
 */
async function getAllBatchStatistics(hoursAgo = 24) {
  try {
    const query = `
      SELECT
        batch_code,
        COUNT(*) as total_checks,
        AVG(rps) as avg_rps,
        MAX(rps) as max_rps,
        MIN(rps) as min_rps,
        MAX(records_processed) as max_records,
        COUNT(CASE WHEN is_stuck = true THEN 1 END) as stuck_count,
        MAX(check_time) as last_check
      FROM batch_monitoring_history
      WHERE check_time >= NOW() - INTERVAL '${hoursAgo} hours'
      GROUP BY batch_code
      ORDER BY last_check DESC
    `;

    const result = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    return result;
  } catch (error) {
    console.error('[Batch Monitoring] Error getting all batch statistics:', error);
    return [];
  }
}

/**
 * Monitor and save current batch status with stuck detection
 */
async function monitorAndSaveBatchStatus() {
  console.log('[Batch Monitoring] Starting batch status check...');

  try {
    // Get running batches
    const runningBatches = await getRunningBatchesDetails();
    console.log(`[Batch Monitoring] Found ${runningBatches.length} running batches`);

    const results = [];

    for (const batch of runningBatches) {
      // Detect if stuck
      const stuckDetection = await detectStuckBatch(batch);

      // Save to history
      const historyData = {
        ...batch,
        isStuck: stuckDetection.isStuck,
        alertSent: false, // Will be updated by Teams service
        notes: stuckDetection.reason
      };

      await saveBatchHistory(historyData);

      results.push({
        batch,
        stuckDetection
      });

      console.log(`[Batch Monitoring] ${batch.batchCode}: Records=${batch.totalRecords}, RPS=${batch.rps}, Stuck=${stuckDetection.isStuck}`);
    }

    return results;
  } catch (error) {
    console.error('[Batch Monitoring] Error monitoring batches:', error);
    throw error;
  }
}

/**
 * Get recent batch monitoring history for display
 */
async function getRecentMonitoringHistory(batchCode = null, limit = 50) {
  try {
    let query = `
      SELECT
        batch_code,
        check_time,
        records_processed,
        rps,
        duration_seconds,
        status,
        is_stuck,
        alert_sent,
        notes
      FROM batch_monitoring_history
      WHERE 1=1
    `;

    const replacements = {};
    if (batchCode) {
      replacements.batchCode = batchCode;
      query += ` AND batch_code = :batchCode`;
    }

    // Note: limit is safe to interpolate (it's a number parameter, not user input)
    query += ` ORDER BY check_time DESC LIMIT ${parseInt(limit)}`;

    const result = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return result;
  } catch (error) {
    console.error('[Batch Monitoring] Error getting monitoring history:', error);
    return [];
  }
}

/**
 * Mark alert as sent
 */
async function markAlertAsSent(batchCode, checkTime) {
  try {
    const query = `
      UPDATE batch_monitoring_history
      SET alert_sent = true
      WHERE batch_code = :batchCode AND check_time = :checkTime
    `;

    await sequelize.query(query, {
      replacements: { batchCode, checkTime },
      type: sequelize.QueryTypes.UPDATE
    });
  } catch (error) {
    console.error('[Batch Monitoring] Error marking alert as sent:', error);
  }
}

module.exports = {
  getRunningBatchesDetails,
  getPendingIMDCount,
  saveBatchHistory,
  getPreviousBatchHistory,
  detectStuckBatch,
  getBatchStatistics,
  getAllBatchStatistics,
  monitorAndSaveBatchStatus,
  getRecentMonitoringHistory,
  markAlertAsSent
};
