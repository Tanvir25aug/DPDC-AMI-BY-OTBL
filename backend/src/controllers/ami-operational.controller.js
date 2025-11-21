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

module.exports = {
  getPendingIMDCount,
  getBillCount,
  getRunningBatches,
  getBatchPerformance
};
