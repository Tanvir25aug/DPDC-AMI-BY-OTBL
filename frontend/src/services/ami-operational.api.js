/**
 * AMI Operational API Service
 * Handles all API calls for AMI operational metrics and batch monitoring
 */

import api from './api';

/**
 * Get Pending IMD count
 * @returns {Promise} Response with pending IMD count
 */
export const getPendingIMDCount = () => {
  return api.get('/ami-operational/pending-imd');
};

/**
 * Get Bill count for a specific date
 * @param {string} date - Date in YYYY-MM-DD format (optional)
 * @returns {Promise} Response with bill count
 */
export const getBillCount = (date = null) => {
  const params = date ? { date } : {};
  return api.get('/ami-operational/bill-count', { params });
};

/**
 * Get Currently running batches
 * @returns {Promise} Response with running batches
 */
export const getRunningBatches = () => {
  return api.get('/ami-operational/running-batches');
};

/**
 * Get Batch job performance with date range filter
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise} Response with batch performance data
 */
export const getBatchPerformance = (startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get('/ami-operational/batch-performance', { params });
};

/**
 * Get Active Alerts (unacknowledged)
 * @returns {Promise} Response with active alerts and counts by severity
 */
export const getActiveAlerts = () => {
  return api.get('/ami-operational/active-alerts');
};

/**
 * Get Batch Execution Logs with filters
 * @param {object} filters - Filter options (batchCode, status, startDate, endDate, limit)
 * @returns {Promise} Response with batch logs
 */
export const getBatchLogs = (filters = {}) => {
  return api.get('/ami-operational/batch-logs', { params: filters });
};

/**
 * Get Batch Workflow Timeline with today's execution status
 * @returns {Promise} Response with 6-step workflow timeline
 */
export const getBatchTimeline = () => {
  return api.get('/ami-operational/batch-timeline');
};

/**
 * Get Batch Health Summary (success rates and recent failures)
 * @param {number} days - Number of days to look back (default 7)
 * @returns {Promise} Response with batch health data
 */
export const getBatchHealth = (days = 7) => {
  return api.get('/ami-operational/batch-health', { params: { days } });
};

/**
 * Acknowledge an alert by ID
 * @param {number} alertId - Alert ID to acknowledge
 * @returns {Promise} Response
 */
export const acknowledgeAlert = (alertId) => {
  return api.post(`/ami-operational/acknowledge-alert/${alertId}`);
};

export default {
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
