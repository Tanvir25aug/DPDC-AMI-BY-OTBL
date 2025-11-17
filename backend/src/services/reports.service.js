const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('../config/oracle');

const reportsDir = path.join(__dirname, '../../reports');

/**
 * Execute a report by name
 * @param {string} reportName - Name of the SQL report file (without .sql extension)
 * @param {object} bindParams - Optional bind parameters for the SQL query
 * @returns {Promise<Array>} - Query results
 */
const executeReport = async (reportName, bindParams = {}) => {
  try {
    // Read SQL file
    const reportPath = path.join(reportsDir, `${reportName}.sql`);
    const sql = await fs.readFile(reportPath, 'utf8');

    console.log(`[Reports Service] Executing report: ${reportName}`);

    // Remove trailing semicolon (Oracle doesn't like it)
    const cleanQuery = sql.trim().replace(/;+$/, '');

    // Execute query
    const result = await executeQuery(cleanQuery, bindParams);

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

module.exports = {
  executeReport
};
