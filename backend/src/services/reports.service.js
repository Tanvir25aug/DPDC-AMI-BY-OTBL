const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('../config/oracle');

const reportsDir = path.join(__dirname, '../../reports');

/**
 * Execute a report by name
 * @param {string} reportName - Name of the SQL report file (without .sql extension)
 * @param {object} bindParams - Optional bind parameters for the SQL query
 * @param {object} options - Optional execution options (e.g., { maxRows: 0 } for no limit)
 * @returns {Promise<Array>} - Query results
 */
const executeReport = async (reportName, bindParams = {}, options = {}) => {
  try {
    // Read SQL file
    const reportPath = path.join(reportsDir, `${reportName}.sql`);
    const sql = await fs.readFile(reportPath, 'utf8');

    console.log(`[Reports Service] Executing report: ${reportName}`);

    // Remove trailing semicolon (Oracle doesn't like it)
    const cleanQuery = sql.trim().replace(/;+$/, '');

    // Execute query with options
    const result = await executeQuery(cleanQuery, bindParams, options);

    console.log(`[Reports Service] Report ${reportName} completed: ${result.rows.length} rows`);

    return result.rows;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Report "${reportName}" not found`);
    }

    console.error(`[Reports Service] Error executing report "${reportName}":`, error);
    throw error;
  }
};

/**
 * Execute a paginated report
 * @param {string} reportName - Name of the SQL report file (without .sql extension)
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {object} bindParams - Optional bind parameters
 * @returns {Promise<Object>} - Query results with pagination info
 */
const executeReportPaginated = async (reportName, page = 1, limit = 100, bindParams = {}) => {
  try {
    const offset = (page - 1) * limit;

    // Read SQL file for paginated query
    const reportPath = path.join(reportsDir, `${reportName}.sql`);
    const sql = await fs.readFile(reportPath, 'utf8');

    console.log(`[Reports Service] Executing paginated report: ${reportName} (page ${page}, limit ${limit})`);

    // Remove trailing semicolon
    const cleanQuery = sql.trim().replace(/;+$/, '');

    // Add pagination parameters
    const params = { ...bindParams, offset, limit };

    // Execute query
    const result = await executeQuery(cleanQuery, params);

    console.log(`[Reports Service] Report ${reportName} page ${page} completed: ${result.rows.length} rows`);

    return {
      data: result.rows,
      page,
      limit,
      count: result.rows.length
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Report "${reportName}" not found`);
    }

    console.error(`[Reports Service] Error executing paginated report "${reportName}":`, error);
    throw error;
  }
};

/**
 * Get total count for a report (for pagination)
 * @param {string} countReportName - Name of the count SQL report
 * @param {object} bindParams - Optional bind parameters
 * @returns {Promise<number>} - Total count
 */
const getReportCount = async (countReportName, bindParams = {}) => {
  try {
    const reportPath = path.join(reportsDir, `${countReportName}.sql`);
    const sql = await fs.readFile(reportPath, 'utf8');

    const cleanQuery = sql.trim().replace(/;+$/, '');
    const result = await executeQuery(cleanQuery, bindParams);

    const totalCount = result.rows[0]?.TOTAL_COUNT || 0;
    console.log(`[Reports Service] Count for ${countReportName}: ${totalCount}`);

    return totalCount;
  } catch (error) {
    console.error(`[Reports Service] Error getting count for "${countReportName}":`, error);
    throw error;
  }
};

module.exports = {
  executeReport,
  executeReportPaginated,
  getReportCount
};
