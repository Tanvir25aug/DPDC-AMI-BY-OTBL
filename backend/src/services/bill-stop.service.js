const oracledb = require('oracledb');
const { getOracleConnection } = require('../config/oracle');
const { BillStopAnalysis } = require('../models');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run Bill Stop Analysis
 * Analyzes customer billing status (active vs stopped) and stores in PostgreSQL
 */
const runBillStopAnalysis = async (username = 'system') => {
  const startTime = Date.now();
  let connection;
  let queryDuration = 0;

  try {
    logger.info('[Bill Stop Service] Starting bill stop analysis');

    // Get current month start date
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const analysisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    logger.info(`[Bill Stop Service] Analysis month: ${analysisMonth}, Current month start: ${currentMonthStart.toISOString()}`);

    // Read SQL query from file
    const sqlFilePath = path.join(__dirname, '../../reports/customer_last_bill_dates.sql');
    let sqlQuery = await fs.readFile(sqlFilePath, 'utf8');

    // Clean SQL: remove comments and extra whitespace
    sqlQuery = sqlQuery
      .split('\n')
      .filter(line => !line.trim().startsWith('--')) // Remove comment lines
      .join('\n')
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .replace(/;$/, ''); // Remove trailing semicolon (Oracle execute() doesn't want it)

    logger.info(`[Bill Stop Service] SQL query: ${sqlQuery.substring(0, 200)}...`);

    // Connect to Oracle and execute query
    logger.info('[Bill Stop Service] Connecting to Oracle database');
    connection = await getOracleConnection();

    const queryStartTime = Date.now();
    const result = await connection.execute(sqlQuery, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchArraySize: 10000 // Optimize for large result sets
    });
    queryDuration = Date.now() - queryStartTime;

    logger.info(`[Bill Stop Service] Oracle query completed in ${queryDuration}ms, retrieved ${result.rows.length} customers`);

    // Analyze billing status
    const processingStartTime = Date.now();
    let activeBillingCount = 0;
    let stoppedBillingCount = 0;

    for (const row of result.rows) {
      const lastBillDate = row.LAST_BILL_DATE;

      if (!lastBillDate) {
        // No billing data - consider as stopped
        stoppedBillingCount++;
        continue;
      }

      // Compare last bill date with current month start
      const lastBillDateObj = new Date(lastBillDate);

      if (lastBillDateObj >= currentMonthStart) {
        // Customer was billed in current month - active
        activeBillingCount++;
      } else {
        // Customer was NOT billed in current month - stopped
        stoppedBillingCount++;
      }
    }

    const processingDuration = Date.now() - processingStartTime;

    logger.info(`[Bill Stop Service] Analysis complete - Active: ${activeBillingCount}, Stopped: ${stoppedBillingCount}`);

    // Store results in PostgreSQL
    const analysisRecord = await BillStopAnalysis.create({
      total_customers: result.rows.length,
      active_billing_count: activeBillingCount,
      stopped_billing_count: stoppedBillingCount,
      analysis_month: analysisMonth,
      current_month_start: currentMonthStart,
      query_duration: queryDuration,
      processing_duration: processingDuration,
      performed_by: username
    });

    const totalDuration = Date.now() - startTime;

    logger.info(`[Bill Stop Service] Analysis saved to database (ID: ${analysisRecord.id}) - Total duration: ${totalDuration}ms`);

    return {
      success: true,
      data: {
        id: analysisRecord.id,
        total_customers: analysisRecord.total_customers,
        active_billing_count: analysisRecord.active_billing_count,
        stopped_billing_count: analysisRecord.stopped_billing_count,
        analysis_month: analysisRecord.analysis_month,
        current_month_start: analysisRecord.current_month_start,
        query_duration: analysisRecord.query_duration,
        processing_duration: analysisRecord.processing_duration,
        total_duration: totalDuration,
        performed_by: analysisRecord.performed_by,
        created_at: analysisRecord.created_at,
        updated_at: analysisRecord.updated_at
      }
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error running analysis:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
        logger.info('[Bill Stop Service] Oracle connection closed');
      } catch (err) {
        logger.error('[Bill Stop Service] Error closing Oracle connection:', err);
      }
    }
  }
};

/**
 * Get latest bill stop analysis
 */
const getLatestAnalysis = async () => {
  try {
    const latest = await BillStopAnalysis.getLatest();

    if (!latest) {
      return {
        success: false,
        message: 'No analysis data available. Please run analysis first.',
        data: null
      };
    }

    const dataAge = await BillStopAnalysis.getDataAge();

    return {
      success: true,
      data: latest,
      age: dataAge
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting latest analysis:', error);
    throw error;
  }
};

/**
 * Get analysis history
 */
const getAnalysisHistory = async (limit = 10) => {
  try {
    const history = await BillStopAnalysis.getHistory(limit);

    return {
      success: true,
      data: history,
      count: history.length
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting analysis history:', error);
    throw error;
  }
};

module.exports = {
  runBillStopAnalysis,
  getLatestAnalysis,
  getAnalysisHistory
};
