const billStopBatchJob = require('../jobs/billStopBatchJob');
const logger = require('../config/logger');

/**
 * Get Bill Stop Analysis from PostgreSQL (Pre-calculated batch data)
 * Much faster than querying Oracle directly
 */
const getBillStopAnalysis = async (req, res) => {
  try {
    logger.info('[Bill Stop Batch Controller] Fetching bill stop data from PostgreSQL...');

    const batchDate = req.query.batchDate || new Date().toISOString().split('T')[0];

    // Get summary data
    const summaryResult = await billStopBatchJob.pgPool.query(
      `SELECT * FROM bill_stop_summary
       WHERE batch_date = $1
       ORDER BY bill_stop_count DESC`,
      [batchDate]
    );

    // Get details data
    const detailsResult = await billStopBatchJob.pgPool.query(
      `SELECT * FROM bill_stop_details
       WHERE batch_date = $1
       ORDER BY crp_account_no, last_bill_date NULLS FIRST`,
      [batchDate]
    );

    // Get latest batch info
    const batchInfo = await billStopBatchJob.getLatestBatchInfo();

    // Calculate statistics
    const summary = summaryResult.rows.map(row => ({
      CRP_ACCOUNT_NO: row.crp_account_no,
      CRP_ID: row.crp_account_no,
      TOTAL_CPC_COUNT: row.total_cpc_count,
      BILL_STOP_COUNT: row.bill_stop_count,
      ACTIVE_BILLING_COUNT: row.active_billing_count,
      BILL_STOP_PERCENTAGE: parseFloat(row.bill_stop_percentage)
    }));

    const details = detailsResult.rows.map(row => ({
      CRP_ACCOUNT_NO: row.crp_account_no,
      CPC_CUSTOMER_NO: row.cpc_customer_no,
      METER_NO: row.meter_no,
      CUSTOMER_NAME: row.customer_name,
      ADDRESS: row.address,
      NOCS_NAME: row.nocs_name,
      PHONE_NO: row.phone_no,
      SA_STATUS_DESC: row.sa_status_desc,
      LAST_BILL_DATE: row.last_bill_date
        ? new Date(row.last_bill_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).toUpperCase()
        : 'Never Billed',
      BILLING_STATUS: row.billing_status,
      CURRENT_BALANCE: parseFloat(row.current_balance)
    }));

    const totalCRPs = summary.length;
    const totalCPCs = summary.reduce((sum, row) => sum + row.TOTAL_CPC_COUNT, 0);
    const totalBillStopIssues = summary.reduce((sum, row) => sum + row.BILL_STOP_COUNT, 0);
    const totalActiveBilling = summary.reduce((sum, row) => sum + row.ACTIVE_BILLING_COUNT, 0);

    res.json({
      success: true,
      summary,
      details,
      statistics: {
        totalCRPs,
        totalCPCs,
        totalBillStopIssues,
        totalActiveBilling,
        billStopPercentage: totalCPCs > 0 ? ((totalBillStopIssues / totalCPCs) * 100).toFixed(2) : 0
      },
      detailsAvailable: true,
      truncated: false,
      batchInfo: batchInfo ? {
        batchDate: batchInfo.batch_date,
        lastUpdate: batchInfo.end_time || batchInfo.start_time,
        status: batchInfo.status,
        durationSeconds: batchInfo.duration_seconds,
        summaryCount: batchInfo.summary_count,
        detailsCount: batchInfo.details_count
      } : null,
      timestamp: new Date().toISOString()
    });

    logger.info(`[Bill Stop Batch Controller] Returned ${summary.length} CRPs and ${details.length} details`);

  } catch (error) {
    logger.error('[Bill Stop Batch Controller] Error fetching bill stop data:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill stop data from database',
      error: error.message
    });
  }
};

/**
 * Trigger batch job manually
 */
const triggerBatchJob = async (req, res) => {
  try {
    logger.info('[Bill Stop Batch Controller] Manual batch job triggered');

    // Check if batch is already running
    const isRunning = await billStopBatchJob.isBatchRunning();
    if (isRunning) {
      return res.status(409).json({
        success: false,
        message: 'Batch job is already running. Please wait for it to complete.'
      });
    }

    // Start batch job in background
    billStopBatchJob.runBillStopBatch()
      .then(result => {
        logger.info('[Bill Stop Batch Controller] Batch job completed:', result);
      })
      .catch(error => {
        logger.error('[Bill Stop Batch Controller] Batch job failed:', error);
      });

    res.json({
      success: true,
      message: 'Batch job started. This may take 10-30 minutes. Check status for progress.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[Bill Stop Batch Controller] Error triggering batch job:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to trigger batch job',
      error: error.message
    });
  }
};

/**
 * Get batch job status
 */
const getBatchStatus = async (req, res) => {
  try {
    const batchInfo = await billStopBatchJob.getLatestBatchInfo();
    const isRunning = await billStopBatchJob.isBatchRunning();

    res.json({
      success: true,
      isRunning,
      latestBatch: batchInfo ? {
        batchDate: batchInfo.batch_date,
        startTime: batchInfo.start_time,
        endTime: batchInfo.end_time,
        status: batchInfo.status,
        summaryCount: batchInfo.summary_count,
        detailsCount: batchInfo.details_count,
        durationSeconds: batchInfo.duration_seconds,
        errorMessage: batchInfo.error_message
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[Bill Stop Batch Controller] Error getting batch status:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get batch status',
      error: error.message
    });
  }
};

/**
 * Get batch history
 */
const getBatchHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    const result = await billStopBatchJob.pgPool.query(
      `SELECT * FROM bill_stop_batch_log
       ORDER BY batch_date DESC, start_time DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      history: result.rows.map(row => ({
        id: row.id,
        batchDate: row.batch_date,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        summaryCount: row.summary_count,
        detailsCount: row.details_count,
        durationSeconds: row.duration_seconds,
        errorMessage: row.error_message
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[Bill Stop Batch Controller] Error getting batch history:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get batch history',
      error: error.message
    });
  }
};

module.exports = {
  getBillStopAnalysis,
  triggerBatchJob,
  getBatchStatus,
  getBatchHistory
};
