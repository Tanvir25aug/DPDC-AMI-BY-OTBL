const logger = require('../config/logger');
const reportsService = require('./reports.service');

class RealtimeService {
  constructor() {
    this.isPolling = false;
    this.pollingInterval = null;
    this.updateInterval = 300000; // 5 minutes default
    this.lastDataHash = null;
  }

  /**
   * Start polling for data changes and broadcast to clients
   */
  startPolling(intervalMs = 300000) { // Default 5 minutes (300000ms)
    if (this.isPolling) {
      logger.warn('[Realtime] Polling already active');
      return;
    }

    this.updateInterval = intervalMs;
    this.isPolling = true;

    logger.info(`[Realtime] Starting data polling every ${intervalMs}ms (${intervalMs / 1000}s)`);

    // Fetch immediately
    this.fetchAndBroadcast();

    // Then set interval
    this.pollingInterval = setInterval(() => {
      this.fetchAndBroadcast();
    }, this.updateInterval);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (!this.isPolling) {
      return;
    }

    logger.info('[Realtime] Stopping data polling');
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
    this.isPolling = false;
  }

  /**
   * Fetch data and broadcast if changed
   */
  async fetchAndBroadcast() {
    try {
      // Check if Socket.IO is available
      if (!global.io) {
        logger.warn('[Realtime] Socket.IO not initialized');
        return;
      }

      // Fetch latest data
      const [countData, nocsData] = await Promise.all([
        reportsService.executeReport('daily_connect_disconnect_count'),
        reportsService.executeReport('rc_dc_nocs_aggregated')
      ]);

      // Create data hash to detect changes
      const dataHash = JSON.stringify({ countData, nocsData });

      // Only broadcast if data changed
      if (this.lastDataHash !== dataHash) {
        logger.info('[Realtime] Data changed, broadcasting to clients...');

        global.io.emit('dashboard:update', {
          countData,
          nocsData,
          timestamp: new Date().toISOString()
        });

        this.lastDataHash = dataHash;
        logger.info(`[Realtime] Broadcast complete to ${global.io.engine.clientsCount} clients`);
      } else {
        logger.debug('[Realtime] No data changes detected');
      }
    } catch (error) {
      logger.error('[Realtime] Error fetching and broadcasting data:', error);
    }
  }

  /**
   * Manual trigger to broadcast data
   */
  async broadcastNow() {
    try {
      if (!global.io) {
        throw new Error('Socket.IO not initialized');
      }

      const [countData, nocsData] = await Promise.all([
        reportsService.executeReport('daily_connect_disconnect_count'),
        reportsService.executeReport('rc_dc_nocs_aggregated')
      ]);

      global.io.emit('dashboard:update', {
        countData,
        nocsData,
        timestamp: new Date().toISOString()
      });

      logger.info(`[Realtime] Manual broadcast sent to ${global.io.engine.clientsCount} clients`);
      return { success: true, message: 'Data broadcast sent' };
    } catch (error) {
      logger.error('[Realtime] Error in manual broadcast:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      updateInterval: this.updateInterval,
      connectedClients: global.io ? global.io.engine.clientsCount : 0
    };
  }
}

module.exports = new RealtimeService();
