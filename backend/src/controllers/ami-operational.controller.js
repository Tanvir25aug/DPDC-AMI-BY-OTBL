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
        BATCH_THREAD_CNT,
        batch_bus_dt,
        SUM(rec_proc_cnt) as TOTAL_RECORDS
      FROM CI_BATCH_job job
      JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd
      JOIN CI_BATCH_INST inst ON run.batch_nbr = inst.batch_nbr AND job.batch_nbr = inst.batch_nbr
      WHERE job.BATCH_JOB_STAT_FLG = 'ST'
        AND run.BATCH_CD = inst.BATCH_CD
        AND run.batch_cd NOT IN ('F1-FLUSH', 'C1-WFSUB')
      GROUP BY run.BATCH_CD, job.BATCH_JOB_STAT_FLG, run.START_DTTM, BATCH_THREAD_CNT, batch_bus_dt
      ORDER BY run.START_DTTM DESC`
    );

    // Format the data
    const batches = result.rows.map(row => ({
      batchCode: row.BATCH_CD,
      status: 'Running',
      startTime: row.START_DTTM,
      threadCount: row.BATCH_THREAD_CNT,
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
        BATCH_THREAD_CNT,
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
        AND run.batch_cd NOT IN ('F1-FLUSH', 'C1-WFSUB')
      GROUP BY run.BATCH_CD, job.BATCH_JOB_STAT_FLG, run.START_DTTM, run.END_DTTM, BATCH_THREAD_CNT, batch_bus_dt
      ORDER BY batch_bus_dt DESC, run.START_DTTM DESC`,
      {
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate
      },
      { maxRows: 5000 }
    );

    // Format the data
    const performance = result.rows.map(row => ({
      batchCode: row.BATCH_CD,
      status: getStatusLabel(row.BATCH_JOB_STAT_FLG),
      statusCode: row.BATCH_JOB_STAT_FLG,
      startTime: row.START_DTTM,
      endTime: row.END_DTTM,
      threadCount: row.BATCH_THREAD_CNT,
      totalDuration: Math.round(row.TOTAL_DURATION || 0),
      totalRecords: row.TOTAL_RECORDS || 0,
      rps: Math.round((row.RPS || 0) * 100) / 100,
      businessDate: row.BATCH_BUS_DT
    }));

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
 */
const getStatusLabel = (statusCode) => {
  const statusMap = {
    'ST': 'Running',
    'PD': 'Pending',
    'ED': 'Ended',
    'ER': 'Error',
    'CM': 'Complete'
  };
  return statusMap[statusCode] || statusCode;
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
 */
const getBatchTimeline = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const today = new Date().toISOString().split('T')[0];

    // Get workflow configuration
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
      ORDER BY sequence_order`
    );

    // Get today's batch execution status
    const [todayStatus] = await sequelize.query(
      `SELECT
        batch_code,
        status,
        start_time,
        end_time,
        duration_seconds,
        records_processed,
        rps
      FROM batch_execution_logs
      WHERE business_date = :today
        AND id IN (
          SELECT MAX(id)
          FROM batch_execution_logs
          WHERE business_date = :today
          GROUP BY batch_code
        )`,
      { replacements: { today } }
    );

    // Merge workflow with today's status
    const timeline = workflow.map(batch => {
      const todayBatch = todayStatus.find(t => t.batch_code === batch.batch_code);
      return {
        ...batch,
        todayStatus: todayBatch ? {
          status: todayBatch.status,
          start_time: todayBatch.start_time,
          end_time: todayBatch.end_time,
          duration_seconds: todayBatch.duration_seconds,
          records_processed: todayBatch.records_processed,
          rps: todayBatch.rps
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        timeline: timeline,
        businessDate: today
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

module.exports = {
  getPendingIMDCount,
  getBillCount,
  getRunningBatches,
  getBatchPerformance,
  getActiveAlerts,
  getBatchLogs,
  getBatchTimeline,
  getBatchHealth,
  acknowledgeAlert
};
