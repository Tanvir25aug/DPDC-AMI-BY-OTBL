import api from './api';

/**
 * Reports API Service
 * Handles all report-related API calls
 */
export const reportsAPI = {
  /**
   * Get Daily RC/DC Command Count
   * Returns aggregated counts of commands by type and status
   * More efficient for dashboard stats - returns pre-aggregated data
   */
  getDailyConnectDisconnectCount() {
    return api.get('/reports/daily_connect_disconnect_count');
  },

  /**
   * Get RC/DC NOCS Aggregated Summary
   * Returns pre-aggregated counts grouped by NOCS, command type, and status
   * Shows complete data for all NOCS locations without row limits
   */
  getRCDCNocsAggregated() {
    return api.get('/reports/rc_dc_nocs_aggregated');
  },

  /**
   * Get RC/DC Analytics Summary
   * Returns detailed dashboard statistics for remote connect/disconnect commands
   * Returns individual transaction rows with NOCS information
   */
  getRCDCAnalyticsSummary() {
    return api.get('/reports/rc_dc_analytics_summary');
  },

  /**
   * Get Meter-wise Commands (DEPRECATED - Use paginated version)
   * Returns detailed list of meter commands
   */
  getMeterWiseCommands() {
    return api.get('/reports/meter_wise_commands');
  },

  /**
   * Get Meter-wise Commands PAGINATED (OPTIMIZED for 30k+ records)
   * Returns paginated list of meter commands with caching
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page (default: 100, max: 1000)
   */
  getMeterWiseCommandsPaginated(page = 1, limit = 100) {
    return api.get('/reports/meter_wise_commands_paginated', {
      params: { page, limit }
    });
  },

  /**
   * Get Meter-wise Commands by NOCS
   * Returns detailed list of meter commands for a specific NOCS location
   * @param {string} nocsName - Name of the NOCS location
   */
  getMeterWiseCommandsByNocs(nocsName) {
    return api.get('/reports/meter_wise_commands_by_nocs', {
      params: { nocsName }
    });
  },

  /**
   * Start real-time updates
   * Enables automatic data broadcasting via WebSocket
   */
  startRealtime(interval = 300000) { // Default 5 minutes (300000ms)
    return api.post('/reports/realtime/start', { interval });
  },

  /**
   * Stop real-time updates
   * Disables automatic data broadcasting
   */
  stopRealtime() {
    return api.post('/reports/realtime/stop');
  },

  /**
   * Get real-time status
   * Returns current polling status and connected clients
   */
  getRealtimeStatus() {
    return api.get('/reports/realtime/status');
  },

  /**
   * Download NOCS Report as PDF
   * Downloads a PDF report for a specific NOCS
   * @param {string} nocsName - Name of the NOCS location
   * @returns {Promise<Blob>} PDF blob
   */
  downloadNocsReportPDF(nocsName) {
    return api.get('/reports/download_nocs_report_pdf', {
      params: { nocsName },
      responseType: 'blob'
    });
  }
};
