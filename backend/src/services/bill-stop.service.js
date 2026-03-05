const oracledb = require('oracledb');
const { getOracleConnection } = require('../config/oracle');
const pgPool = require('../config/postgresDB');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Read summary totals from the bill_stop_summary PostgreSQL table
 * (populated nightly by the batch job - no Oracle query needed)
 */
const readSummaryFromBatch = async () => {
  // Get latest batch date
  const dateResult = await pgPool.query(
    `SELECT batch_date FROM bill_stop_summary ORDER BY batch_date DESC LIMIT 1`
  );

  if (dateResult.rows.length === 0) {
    return null;
  }

  // Format as YYYY-MM-DD string regardless of how pg returns the date type
  const rawDate = dateResult.rows[0].batch_date;
  const latestDate = rawDate instanceof Date
    ? rawDate.toISOString().split('T')[0]
    : String(rawDate).split('T')[0];

  // Aggregate totals across all CRPs for the latest batch date
  const totalsResult = await pgPool.query(
    `SELECT
       SUM(total_cpc_count)      AS total_customers,
       SUM(active_billing_count) AS active_billing_count,
       SUM(bill_stop_count)      AS stopped_billing_count
     FROM bill_stop_summary
     WHERE batch_date = $1`,
    [latestDate]
  );

  const t = totalsResult.rows[0];

  return {
    total_customers:       parseInt(t.total_customers)       || 0,
    active_billing_count:  parseInt(t.active_billing_count)  || 0,
    stopped_billing_count: parseInt(t.stopped_billing_count) || 0,
    analysis_month:        latestDate,   // clean YYYY-MM-DD string
    created_at:            latestDate,
    performed_by:          'Nightly Batch Job'
  };
};

/**
 * Run Bill Stop Analysis
 * Reads pre-computed data from the bill_stop_summary PostgreSQL table.
 * The actual Oracle query runs nightly via the batch job (billStopBatchJob.js).
 * Calling this from an HTTP request used to cause 504 timeouts because
 * the Oracle scan takes several minutes - this approach is instant.
 */
const runBillStopAnalysis = async (username = 'system') => {
  try {
    logger.info('[Bill Stop Service] Loading analysis from batch data');

    const data = await readSummaryFromBatch();

    if (!data) {
      return {
        success: false,
        message: 'No batch data available yet. The nightly batch job has not run.',
        data: null
      };
    }

    logger.info(`[Bill Stop Service] Analysis loaded - Total: ${data.total_customers}, Active: ${data.active_billing_count}, Stopped: ${data.stopped_billing_count}`);

    return { success: true, data };
  } catch (error) {
    logger.error('[Bill Stop Service] Error loading analysis:', error);
    throw error;
  }
};

/**
 * Get latest bill stop analysis (reads from batch data in PostgreSQL)
 */
const getLatestAnalysis = async () => {
  try {
    const data = await readSummaryFromBatch();

    if (!data) {
      return {
        success: false,
        message: 'No batch data available yet. The nightly batch job has not run.',
        data: null
      };
    }

    // Calculate data age
    const ageMs = Date.now() - new Date(data.analysis_month).getTime();
    const age = {
      last_updated:  data.analysis_month,
      age_hours:     Math.floor(ageMs / 3600000),
      age_days:      Math.floor(ageMs / 86400000)
    };

    return { success: true, data, age };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting latest analysis:', error);
    throw error;
  }
};

/**
 * Get analysis history (last N batch dates with aggregated totals)
 */
const getAnalysisHistory = async (limit = 10) => {
  try {
    const result = await pgPool.query(
      `SELECT
         batch_date,
         SUM(total_cpc_count)      AS total_customers,
         SUM(active_billing_count) AS active_billing_count,
         SUM(bill_stop_count)      AS stopped_billing_count
       FROM bill_stop_summary
       GROUP BY batch_date
       ORDER BY batch_date DESC
       LIMIT $1`,
      [limit]
    );

    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting analysis history:', error);
    throw error;
  }
};

/**
 * Search customer by ID or Meter Number with billing status
 */
const searchCustomerWithBillingStatus = async (searchValue) => {
  let connection;

  try {
    logger.info(`[Bill Stop Service] Searching for customer: ${searchValue}`);

    // Read SQL query from file
    const sqlFilePath = path.join(__dirname, '../../reports/customer_search_with_billing_status.sql');
    let sqlQuery = await fs.readFile(sqlFilePath, 'utf8');

    // Clean SQL: remove comments and extra whitespace
    sqlQuery = sqlQuery
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/;$/, '');

    // Connect to Oracle
    connection = await getOracleConnection();

    const result = await connection.execute(
      sqlQuery,
      { search_value: searchValue },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      logger.info(`[Bill Stop Service] No customer found for: ${searchValue}`);
      return {
        success: false,
        message: 'Customer not found',
        data: null
      };
    }

    const customer = result.rows[0];
    logger.info(`[Bill Stop Service] Found customer: ${customer.CUSTOMER_ID}, Billing Status: ${customer.BILLING_STATUS}`);

    return {
      success: true,
      data: {
        CUSTOMER_ID: customer.CUSTOMER_ID,
        CUSTOMER_NAME: customer.CUSTOMER_NAME,
        METER_NO: customer.METER_NO,
        NOCS_NAME: customer.NOCS_NAME,
        ADDRESS: customer.ADDRESS,
        PHONE_NO: customer.PHONE_NO,
        SA_STATUS: customer.SA_STATUS,
        LAST_BILL_DATE: customer.LAST_BILL_DATE,
        BILLING_STATUS: customer.BILLING_STATUS,
        BILLED_THIS_MONTH: customer.BILLED_THIS_MONTH,
        CURRENT_BALANCE: customer.CURRENT_BALANCE,
        CURRENT_BILLING_MONTH: customer.CURRENT_BILLING_MONTH,
        MATCH_TYPE: customer.MATCH_TYPE
      }
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error searching customer:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logger.error('[Bill Stop Service] Error closing connection:', err);
      }
    }
  }
};

/**
 * Get meter reading audit for a customer
 * Auto-detects meter type (Residential/Commercial), generates expected monthly
 * reads from install date to today, and compares against actual AMI readings.
 */
const getCustomerReadingAudit = async (searchValue) => {
  let connection;

  try {
    logger.info(`[Bill Stop Service] Reading audit for: ${searchValue}`);

    const sqlFilePath = path.join(__dirname, '../../reports/customer_reading_audit.sql');
    let sqlQuery = await fs.readFile(sqlFilePath, 'utf8');

    sqlQuery = sqlQuery
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/;$/, '');

    connection = await getOracleConnection();
    connection.callTimeout = 90000; // 90 seconds

    const result = await connection.execute(
      sqlQuery,
      { search_value: searchValue },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 0 }
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'No meter data found. Customer may not have an active AMI meter.',
        data: null
      };
    }

    const rows = result.rows;
    const first = rows[0];

    // Group rows by expected_date
    const byDate = {};
    rows.forEach(row => {
      const date = row.EXPECTED_DATE;
      if (!byDate[date]) {
        byDate[date] = {
          expected_date: date,
          date_type: row.DATE_TYPE,
          readings: []
        };
      }
      byDate[date].readings.push({
        reading_type: row.READING_TYPE,
        reading_val:  row.READING_VAL,
        last_updated: row.LAST_UPDATED,
        status:       row.STATUS
      });
    });

    const months = Object.values(byDate);
    const totalMonths   = months.length;
    const missingMonths = months.filter(m => m.readings.every(r => r.status === 'Missing')).length;
    const okMonths      = months.filter(m => m.readings.every(r => r.status === 'OK')).length;
    const partialMonths = totalMonths - missingMonths - okMonths;

    return {
      success: true,
      data: {
        customer_id:  first.CUSTOMER_ID,
        meter_no:     first.METER_NO,
        tariff_code:  first.TARIFF_CODE,
        meter_type:   first.METER_TYPE,
        install_date: first.INSTALL_DATE,
        last_bill_dt: first.LAST_BILL_DT,
        bill_status:  first.BILL_STATUS,
        summary: {
          total_months:       totalMonths,
          missing_months:     missingMonths,
          ok_months:          okMonths,
          partial_months:     partialMonths,
          missing_percentage: totalMonths > 0
            ? ((missingMonths / totalMonths) * 100).toFixed(1)
            : '0.0'
        },
        months
      }
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting reading audit:', error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) {}
    }
  }
};

module.exports = {
  runBillStopAnalysis,
  getLatestAnalysis,
  getAnalysisHistory,
  searchCustomerWithBillingStatus,
  getCustomerReadingAudit
};
