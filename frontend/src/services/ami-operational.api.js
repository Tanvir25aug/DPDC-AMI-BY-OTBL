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

export default {
  getPendingIMDCount,
  getBillCount,
  getRunningBatches,
  getBatchPerformance
};
