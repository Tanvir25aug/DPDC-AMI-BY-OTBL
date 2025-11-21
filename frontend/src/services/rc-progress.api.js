/**
 * RC In Progress API Service
 * Handles all API calls for Remote Connect commands monitoring
 */

import api from './api';

/**
 * Get detailed list of RC commands in progress
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Records per page (default: 100)
 * @param {object} filters - Optional filters { nocs, durationStatus, minMinutes }
 * @returns {Promise} Paginated response with RC In Progress data
 */
export const getRCInProgressDetailed = (page = 1, limit = 100, filters = {}) => {
  const params = {
    page,
    limit,
    ...filters
  };

  return api.get('/rc-progress/detailed', { params });
};

/**
 * Get summary statistics for RC In Progress
 * @returns {Promise} Summary with total, duration breakdown, and metrics
 */
export const getRCInProgressSummary = () => {
  return api.get('/rc-progress/summary');
};

/**
 * Get NOCS breakdown for RC In Progress
 * @returns {Promise} Array of NOCS with counts and analytics
 */
export const getRCInProgressByNOCS = () => {
  return api.get('/rc-progress/by-nocs');
};

/**
 * Export RC In Progress data with customer details
 * @param {string} format - 'excel' or 'csv' (default: 'excel')
 * @returns {Promise} Blob response for download
 */
export const exportRCInProgress = (format = 'excel') => {
  return api.get('/rc-progress/export', {
    params: { format },
    responseType: 'blob' // Important for file download
  });
};

/**
 * Export RC In Progress by NOCS (separate tabs for each NOCS)
 * @returns {Promise} Blob response for download
 */
export const exportRCInProgressByNOCS = () => {
  return api.get('/rc-progress/export-by-nocs', {
    responseType: 'blob'
  });
};

/**
 * Export filtered RC In Progress data with customer details
 * @param {Array} meterNumbers - Array of meter numbers to export
 * @returns {Promise} Blob response for download
 */
export const exportFilteredRCInProgress = (meterNumbers) => {
  return api.post('/rc-progress/export-filtered',
    { meterNumbers },
    { responseType: 'blob' }
  );
};

export default {
  getRCInProgressDetailed,
  getRCInProgressSummary,
  getRCInProgressByNOCS,
  exportRCInProgress,
  exportRCInProgressByNOCS,
  exportFilteredRCInProgress
};
