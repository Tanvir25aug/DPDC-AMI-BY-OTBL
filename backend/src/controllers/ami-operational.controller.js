/**
 * AMI Operational Controller
 * Handles AMI operational metrics and batch monitoring
 */

const { executeQuery } = require('../config/oracle');

/**
 * Get Pending IMD Count
 */
const getPendingIMDCount = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT COUNT(*) as count FROM d1_imd_ctrl WHERE bo_status_cd = 'PENDING'`
    );

    res.json({
      success: true,
      data: {
        count: result.rows[0]?.COUNT || 0
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting pending IMD count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending IMD count',
      error: error.message
    });
  }
};

/**
 * Get Bill Count for a specific date
 */
const getBillCount = async (req, res) => {
  try {
    const { date } = req.query;

    // If no date provided, use today
    let query;
    let binds = {};

    if (date) {
      query = `SELECT COUNT(*) as count FROM ci_bseg WHERE end_dt = TO_DATE(:billDate, 'YYYY-MM-DD') AND bseg_stat_flg = '50'`;
      binds = { billDate: date };
    } else {
      query = `SELECT COUNT(*) as count FROM ci_bseg WHERE end_dt = TRUNC(SYSDATE) AND bseg_stat_flg = '50'`;
    }

    const result = await executeQuery(query, binds);

    res.json({
      success: true,
      data: {
        count: result.rows[0]?.COUNT || 0,
        date: date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting bill count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bill count',
      error: error.message
    });
  }
};

/**
 * Get Currently Running Batches (Status = 'ST')
 */
const getRunningBatches = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT
        run.BATCH_CD,
        job.BATCH_JOB_STAT_FLG,
        run.START_DTTM,
        batch_bus_dt,
        SUM(rec_proc_cnt) as TOTAL_RECORDS
      FROM CI_BATCH_job job
      JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd
      JOIN CI_BATCH_INST inst ON run.batch_nbr = inst.batch_nbr AND job.batch_nbr = inst.batch_nbr
      WHERE job.BATCH_JOB_STAT_FLG = 'ST'
        AND run.BATCH_CD = inst.BATCH_CD
        AND run.batch_cd NOT IN ('F1-FLUSH', 'C1-WFSUB', 'BILLRESTSMS', 'C1-PPBTR')
      GROUP BY run.BATCH_CD, job.BATCH_JOB_STAT_FLG, run.START_DTTM, batch_bus_dt
      ORDER BY run.START_DTTM DESC`
    );

    // Format the data
    const batches = result.rows.map(row => ({
      batchCode: row.BATCH_CD,
      status: 'Running',
      startTime: row.START_DTTM,
      businessDate: row.BATCH_BUS_DT,
      totalRecords: row.TOTAL_RECORDS || 0
    }));

    res.json({
      success: true,
      data: {
        count: batches.length,
        batches: batches
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting running batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get running batches',
      error: error.message
    });
  }
};

/**
 * Get Batch Job Performance with date range filter
 */
const getBatchPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 7 days if no dates provided
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await executeQuery(
      `SELECT
        run.BATCH_CD,
        job.BATCH_JOB_STAT_FLG,
        run.START_DTTM,
        run.END_DTTM,
        (END_DTTM - START_DTTM) * 24 * 60 * 60 as TOTAL_DURATION,
        SUM(rec_proc_cnt) as TOTAL_RECORDS,
        DECODE((END_DTTM - START_DTTM) * 24 * 60 * 60, 0, 0,
          (SUM(rec_proc_cnt) / ((END_DTTM - START_DTTM) * 24 * 60 * 60))) as RPS,
        batch_bus_dt
      FROM CI_BATCH_job job
      JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd
      JOIN CI_BATCH_INST inst ON run.batch_nbr = inst.batch_nbr AND job.batch_nbr = inst.batch_nbr
      WHERE batch_bus_dt BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
        AND run.BATCH_CD = inst.BATCH_CD
        AND run.batch_cd NOT IN ('F1-FLUSH', 'C1-WFSUB', 'BILLRESTSMS', 'C1-PPBTR')
      GROUP BY run.BATCH_CD, job.BATCH_JOB_STAT_FLG, run.START_DTTM, run.END_DTTM, batch_bus_dt
      ORDER BY batch_bus_dt DESC, run.START_DTTM DESC`,
      {
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate
      },
      { maxRows: 5000 }
    );

    // Format the data
    const performance = result.rows.map(row => {
      // Treat null or empty status code as 'ER' (Error)
      const statusCode = row.BATCH_JOB_STAT_FLG || 'ER';

      return {
        batchCode: row.BATCH_CD,
        status: getStatusLabel(statusCode),
        statusCode: statusCode,
        startTime: row.START_DTTM,
        endTime: row.END_DTTM,
        totalDuration: Math.round(row.TOTAL_DURATION || 0),
        totalRecords: row.TOTAL_RECORDS || 0,
        rps: Math.round((row.RPS || 0) * 100) / 100,
        businessDate: row.BATCH_BUS_DT
      };
    });

    res.json({
      success: true,
      data: {
        performance: performance,
        dateRange: {
          startDate: startDate || defaultStartDate,
          endDate: endDate || defaultEndDate
        }
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting batch performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch performance',
      error: error.message
    });
  }
};

/**
 * Helper function to get status label
 * Treats null or empty status as 'Error'
 */
const getStatusLabel = (statusCode) => {
  // Handle null or empty status as Error
  if (!statusCode || statusCode === null || statusCode === '') {
    return 'Error';
  }

  const statusMap = {
    'ST': 'Running',
    'PD': 'Pending',
    'ED': 'Ended',
    'ER': 'Error',
    'CM': 'Complete'
  };
  return statusMap[statusCode] || 'Error'; // Default to Error for unknown codes
};

/**
 * Get Active Alerts (unacknowledged)
 */
const getActiveAlerts = async (req, res) => {
  try {
    const sequelize = require('../config/database');

    const [alerts] = await sequelize.query(
      `SELECT
        id,
        batch_code,
        alert_type,
        alert_severity,
        alert_message,
        business_date,
        created_at,
        email_sent
      FROM batch_monitoring_alerts
      WHERE acknowledged = false
      ORDER BY
        CASE alert_severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'WARNING' THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT 50`
    );

    // Count by severity
    const [counts] = await sequelize.query(
      `SELECT
        alert_severity,
        COUNT(*) as count
      FROM batch_monitoring_alerts
      WHERE acknowledged = false
      GROUP BY alert_severity`
    );

    const severityCounts = {
      CRITICAL: 0,
      WARNING: 0,
      INFO: 0
    };

    counts.forEach(row => {
      severityCounts[row.alert_severity] = parseInt(row.count);
    });

    res.json({
      success: true,
      data: {
        alerts: alerts,
        total: alerts.length,
        counts: severityCounts
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting active alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active alerts',
      error: error.message
    });
  }
};

/**
 * Get Batch Execution Logs
 */
const getBatchLogs = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const { batchCode, status, startDate, endDate, limit = 100 } = req.query;

    let whereClause = [];
    let replacements = {};

    if (batchCode) {
      whereClause.push('batch_code = :batchCode');
      replacements.batchCode = batchCode;
    }

    if (status) {
      whereClause.push('status = :status');
      replacements.status = status;
    }

    if (startDate) {
      whereClause.push('business_date >= :startDate');
      replacements.startDate = startDate;
    }

    if (endDate) {
      whereClause.push('business_date <= :endDate');
      replacements.endDate = endDate;
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    const [logs] = await sequelize.query(
      `SELECT
        id,
        batch_code,
        batch_nbr,
        status,
        start_time,
        end_time,
        duration_seconds,
        thread_count,
        records_processed,
        rps,
        business_date,
        error_message,
        created_at
      FROM batch_execution_logs
      ${whereSQL}
      ORDER BY start_time DESC
      LIMIT :limit`,
      {
        replacements: { ...replacements, limit: parseInt(limit) }
      }
    );

    res.json({
      success: true,
      data: {
        logs: logs,
        total: logs.length
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting batch logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch logs',
      error: error.message
    });
  }
};

/**
 * Get Batch Workflow Timeline
 * Fetches real-time batch status from Oracle CC&B
 * Shows workflows for:
 *   1. Today's business date (always shown)
 *   2. Yesterday's business date (always shown)
 *   3. Business dates with active/running batches
 * Running batches are shown under TODAY regardless of their business_date
 * Uses Dhaka, Bangladesh timezone (UTC+6)
 */
const getBatchTimeline = async (req, res) => {
  try {
    const sequelize = require('../config/database');

    // Use Dhaka timezone (UTC+6)
    const dhakaOffset = 6 * 60; // +6 hours in minutes
    const now = new Date();
    const dhakaTime = new Date(now.getTime() + (dhakaOffset * 60 * 1000));
    const today = dhakaTime.toISOString().split('T')[0];

    // Get workflow configuration (excluding specific batch codes)
    const [workflow] = await sequelize.query(
      `SELECT
        batch_code,
        batch_name,
        sequence_order,
        expected_start_time,
        expected_duration_minutes,
        max_duration_minutes,
        is_critical,
        depends_on_batch,
        can_run_multiple
      FROM batch_workflow_config
      WHERE enabled = true
        AND batch_code NOT IN ('F1-FLUSH', 'C1-WFSUB', 'BILLRESTSMS', 'C1-PPBTR')
      ORDER BY sequence_order`
    );

    // Determine which business dates to show
    // Only show today's timeline
    const businessDatesToShow = new Set();

    // Always include today
    businessDatesToShow.add(today);

    // Convert to sorted array (most recent first)
    const businessDates = Array.from(businessDatesToShow).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    // Get real-time batch status from Oracle for relevant business dates
    // Fetch data from last 2 days to cover running batches that started yesterday
    const batchStatusResult = await executeQuery(
      `SELECT
        TRIM(run.BATCH_CD) as BATCH_CD,
        job.BATCH_JOB_STAT_FLG,
        run.START_DTTM,
        run.END_DTTM,
        run.batch_bus_dt,
        SUM(inst.rec_proc_cnt) as TOTAL_RECORDS,
        (run.END_DTTM - run.START_DTTM) * 24 * 60 * 60 as DURATION_SECONDS,
        DECODE((run.END_DTTM - run.START_DTTM) * 24 * 60 * 60, 0, 0,
          (SUM(inst.rec_proc_cnt) / ((run.END_DTTM - run.START_DTTM) * 24 * 60 * 60))) as RPS,
        run.batch_nbr,
        ROW_NUMBER() OVER (PARTITION BY TRIM(run.BATCH_CD), run.batch_bus_dt ORDER BY run.START_DTTM DESC) as rn
      FROM CI_BATCH_JOB job
      JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd AND job.batch_nbr = run.batch_nbr
      LEFT JOIN CI_BATCH_INST inst ON run.batch_nbr = inst.batch_nbr AND run.BATCH_CD = inst.BATCH_CD
      WHERE run.batch_bus_dt >= TRUNC(SYSDATE) - 2
        AND run.BATCH_CD NOT IN ('F1-FLUSH', 'C1-WFSUB', 'BILLRESTSMS', 'C1-PPBTR')
      GROUP BY run.BATCH_CD, job.BATCH_JOB_STAT_FLG, run.START_DTTM, run.END_DTTM,
               run.batch_bus_dt, run.batch_nbr
      ORDER BY run.batch_bus_dt DESC, run.BATCH_CD, run.START_DTTM DESC`
    );

    // Get pending IMD count (for last 2 days)
    const imdCountResult = await executeQuery(
      `SELECT
        COUNT(*) as count,
        TRUNC(cre_dttm) as business_date
       FROM d1_imd_ctrl
       WHERE bo_status_cd = 'PENDING'
         AND TRUNC(cre_dttm) >= TRUNC(SYSDATE) - 2
       GROUP BY TRUNC(cre_dttm)
       ORDER BY TRUNC(cre_dttm) DESC`
    );

    // Map pending IMD count by business date
    const pendingIMDByDate = {};
    let totalPendingIMD = 0;

    imdCountResult.rows.forEach(row => {
      const businessDate = new Date(row.BUSINESS_DATE).toISOString().split('T')[0];
      const count = row.COUNT || 0;
      pendingIMDByDate[businessDate] = count;
      totalPendingIMD += count;
    });

    // Final business dates (no need to re-sort, already sorted)
    const finalBusinessDates = businessDates;

    // Process batch status data - GROUP BY BUSINESS DATE
    const batchDataByDate = {};

    // Debug: Log all fetched batches
    console.log('[getBatchTimeline] Fetched', batchStatusResult.rows.length, 'batch rows from Oracle');

    batchStatusResult.rows.forEach(row => {
      const batchCode = row.BATCH_CD.trim();
      // Treat null or empty status code as 'ER' (Error)
      const statusCode = row.BATCH_JOB_STAT_FLG || 'ER';
      const originalBusinessDate = new Date(row.BATCH_BUS_DT).toISOString().split('T')[0];

      // Debug: Log batch data
      console.log('[getBatchTimeline] Batch:', batchCode, 'Status:', statusCode, 'BusDate:', originalBusinessDate);

      // For RUNNING batches, show them under TODAY instead of their original business_date
      // For other statuses, keep original business_date
      const businessDate = (statusCode === 'ST') ? today : originalBusinessDate;

      // Map status codes
      const statusMap = {
        'ST': 'Running',
        'ED': 'Ended',
        'CM': 'Complete',
        'ER': 'Error',
        'PD': 'Pending'
      };

      const batchInfo = {
        batch_code: batchCode,
        status: statusMap[statusCode] || 'Error',
        statusCode: statusCode,
        start_time: row.START_DTTM,
        end_time: row.END_DTTM,
        duration_seconds: Math.round(row.DURATION_SECONDS || 0),
        records_processed: row.TOTAL_RECORDS || 0,
        rps: Math.round((row.RPS || 0) * 100) / 100,
        business_date: row.BATCH_BUS_DT,
        batch_nbr: row.BATCH_NBR
      };

      // Initialize date if not exists
      if (!batchDataByDate[businessDate]) {
        batchDataByDate[businessDate] = {
          batchStatusMap: {},
          batchAllRuns: {}
        };
      }

      const dateData = batchDataByDate[businessDate];

      // Store latest run per batch per date (rn = 1)
      if (!dateData.batchStatusMap[batchCode]) {
        dateData.batchStatusMap[batchCode] = batchInfo;
      }

      // Store all runs for this batch on this date
      if (!dateData.batchAllRuns[batchCode]) {
        dateData.batchAllRuns[batchCode] = [];
      }
      dateData.batchAllRuns[batchCode].push(batchInfo);
    });

    // Create timelines for each relevant business date
    const timelines = [];

    finalBusinessDates.forEach(businessDate => {
      const dateData = batchDataByDate[businessDate] || { batchStatusMap: {}, batchAllRuns: {} };
      const pendingIMDForThisDate = pendingIMDByDate[businessDate] || 0;

      const timeline = workflow.map(batch => {
        const batchCode = batch.batch_code.trim();
        const latestRun = dateData.batchStatusMap[batchCode];
        const allRuns = dateData.batchAllRuns[batchCode] || [];

        // Special logic for D1-IMD - check if it needs to run for THIS business date
        let needsToRun = false;
        if (batchCode === 'D1-IMD' && pendingIMDForThisDate > 0) {
          const isRunning = latestRun && latestRun.statusCode === 'ST';
          needsToRun = !isRunning; // Needs to run if there are pending IMDs and it's not currently running
        }

        return {
          ...batch,
          todayStatus: latestRun ? {
            status: latestRun.status,
            statusCode: latestRun.statusCode,
            start_time: latestRun.start_time,
            end_time: latestRun.end_time,
            duration_seconds: latestRun.duration_seconds,
            records_processed: latestRun.records_processed,
            rps: latestRun.rps,
            business_date: latestRun.business_date,
            batch_nbr: latestRun.batch_nbr
          } : null,
          allRuns: allRuns,
          totalRuns: allRuns.length,
          pendingIMDCount: (batchCode === 'D1-IMD') ? pendingIMDForThisDate : undefined,
          needsToRun: (batchCode === 'D1-IMD') ? needsToRun : undefined
        };
      });

      timelines.push({
        businessDate: businessDate,
        timeline: timeline
      });
    });

    res.json({
      success: true,
      data: {
        timelines: timelines,
        totalPendingIMD: totalPendingIMD,
        pendingIMDByDate: pendingIMDByDate,
        currentTime: dhakaTime.toISOString(),
        lastUpdated: dhakaTime.toISOString()
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting batch timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch timeline',
      error: error.message
    });
  }
};

/**
 * Get Batch Health Summary
 */
const getBatchHealth = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const { days = 7 } = req.query;

    // Get performance summary for last N days
    const [summary] = await sequelize.query(
      `SELECT
        batch_code,
        SUM(total_runs) as total_runs,
        SUM(successful_runs) as successful_runs,
        SUM(failed_runs) as failed_runs,
        CASE
          WHEN SUM(total_runs) > 0 THEN (SUM(successful_runs)::decimal / SUM(total_runs) * 100)
          ELSE 0
        END as success_rate,
        AVG(avg_duration_seconds) as avg_duration,
        AVG(avg_rps) as avg_rps
      FROM batch_performance_summary
      WHERE business_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY batch_code
      ORDER BY batch_code`
    );

    // Get failed batches in last 24 hours
    const [recentFailures] = await sequelize.query(
      `SELECT
        batch_code,
        start_time,
        end_time,
        error_message,
        business_date
      FROM batch_execution_logs
      WHERE status = 'Error'
        AND start_time >= NOW() - INTERVAL '24 hours'
      ORDER BY start_time DESC
      LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        summary: summary,
        recentFailures: recentFailures,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting batch health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch health',
      error: error.message
    });
  }
};

/**
 * Acknowledge Alert
 */
const acknowledgeAlert = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const { id } = req.params;
    const { username } = req.user || { username: 'system' };

    await sequelize.query(
      `UPDATE batch_monitoring_alerts
       SET
         acknowledged = true,
         acknowledged_by = :username,
         acknowledged_at = NOW(),
         updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: { id, username }
      }
    );

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('[AMI Operational] Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message
    });
  }
};

/**
 * Diagnostic: Get Raw Batch Data from Oracle
 * Helps debug what data is actually in Oracle
 */
const getDiagnosticBatchData = async (req, res) => {
  try {
    // Check running batches
    const runningResult = await executeQuery(
      `SELECT
        TRIM(run.BATCH_CD) as BATCH_CD,
        job.BATCH_JOB_STAT_FLG,
        run.START_DTTM,
        run.batch_bus_dt,
        run.batch_nbr
      FROM CI_BATCH_JOB job
      JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd AND job.batch_nbr = run.batch_nbr
      WHERE job.BATCH_JOB_STAT_FLG = 'ST'
        AND run.BATCH_CD NOT IN ('F1-FLUSH', 'C1-WFSUB', 'BILLRESTSMS', 'C1-PPBTR')
      ORDER BY run.START_DTTM DESC`
    );

    // Check recent batches (last 3 days)
    const recentResult = await executeQuery(
      `SELECT
        TRIM(run.BATCH_CD) as BATCH_CD,
        job.BATCH_JOB_STAT_FLG,
        run.START_DTTM,
        run.END_DTTM,
        run.batch_bus_dt,
        run.batch_nbr
      FROM CI_BATCH_JOB job
      JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd AND job.batch_nbr = run.batch_nbr
      WHERE run.batch_bus_dt >= TRUNC(SYSDATE) - 3
        AND run.BATCH_CD NOT IN ('F1-FLUSH', 'C1-WFSUB', 'BILLRESTSMS', 'C1-PPBTR')
      ORDER BY run.batch_bus_dt DESC, run.START_DTTM DESC
      FETCH FIRST 50 ROWS ONLY`
    );

    // Get current Oracle time
    const oracleTimeResult = await executeQuery(
      `SELECT SYSDATE as CURRENT_TIME, TRUNC(SYSDATE) as CURRENT_DATE FROM DUAL`
    );

    res.json({
      success: true,
      data: {
        runningBatches: runningResult.rows,
        runningCount: runningResult.rows.length,
        recentBatches: recentResult.rows,
        recentCount: recentResult.rows.length,
        oracleTime: oracleTimeResult.rows[0]
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Diagnostic error:', error);
    res.status(500).json({
      success: false,
      message: 'Diagnostic query failed',
      error: error.message
    });
  }
};

/**
 * Get Batch Statistics (from PostgreSQL monitoring history)
 */
const getBatchStatistics = async (req, res) => {
  try {
    const { batchCode, hours = 24 } = req.query;
    const batchMonitoringService = require('../services/batch-monitoring.service');

    let statistics;
    if (batchCode) {
      statistics = await batchMonitoringService.getBatchStatistics(batchCode, hours);
    } else {
      statistics = await batchMonitoringService.getAllBatchStatistics(hours);
    }

    res.json({
      success: true,
      data: {
        statistics
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting batch statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch statistics',
      error: error.message
    });
  }
};

/**
 * Get Recent Batch Monitoring History
 */
const getBatchMonitoringHistory = async (req, res) => {
  try {
    const { batchCode, limit = 50 } = req.query;
    const batchMonitoringService = require('../services/batch-monitoring.service');

    const history = await batchMonitoringService.getRecentMonitoringHistory(batchCode, limit);

    res.json({
      success: true,
      data: {
        history
      }
    });
  } catch (error) {
    console.error('[AMI Operational] Error getting batch monitoring history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch monitoring history',
      error: error.message
    });
  }
};

module.exports = {
  getPendingIMDCount,
  getBillCount,
  getRunningBatches,
  getBatchPerformance,
  getActiveAlerts,
  getBatchLogs,
  getBatchTimeline,
  getBatchHealth,
  acknowledgeAlert,
  getDiagnosticBatchData,
  getBatchStatistics,
  getBatchMonitoringHistory
};

