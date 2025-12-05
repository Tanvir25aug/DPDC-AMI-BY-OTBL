/**
 * Microsoft Teams Reports Scheduler
 *
 * Sends NOCS Balance Summary to Teams every 1 hour after PostgreSQL cache update
 *
 * Interval: 60 minutes (1 hour)
 */

const teamsService = require('../services/teams.service');
const { NocsBalanceSummary } = require('../models');
const logger = require('../config/logger');

class TeamsReportsScheduler {
  constructor() {
    this.intervalMinutes = 60; // 1 hour
    this.intervalMs = this.intervalMinutes * 60 * 1000;
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  async startScheduler() {
    try {
      logger.info('========================================');
      logger.info('[Teams Reports] Starting Teams Reports Scheduler');
      logger.info(`[Teams Reports] Interval: Every ${this.intervalMinutes} minutes`);
      logger.info('========================================');

      // Run immediately on start
      await this.runReportCycle();

      // Then run on interval
      this.intervalId = setInterval(async () => {
        try {
          await this.runReportCycle();
        } catch (error) {
          logger.error('[Teams Reports] Error in interval callback:', error);
        }
      }, this.intervalMs);

      this.isRunning = true;
      logger.info('[Teams Reports] Scheduler started successfully');
    } catch (error) {
      logger.error('[Teams Reports] Failed to start scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.info('[Teams Reports] Scheduler stopped');
    }
  }

  /**
   * Run a complete report cycle
   */
  async runReportCycle() {
    if (this.isRunning && this.intervalId) {
      logger.info('========================================');
      logger.info('[Teams Reports] Report cycle already running, skipping...');
      return;
    }

    try {
      logger.info('========================================');
      logger.info('[Teams Reports] Starting NOCS Balance Summary report');
      logger.info(`[Teams Reports] Time: ${new Date().toISOString()}`);
      logger.info('========================================');

      const startTime = Date.now();

      // Send only NOCS Balance Summary
      await this.sendNOCSBalanceSummary();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`[Teams Reports] Report completed in ${duration}s`);
      logger.info('========================================');

    } catch (error) {
      logger.error('[Teams Reports] Error in report cycle:', error);
    }
  }

  /**
   * Send NOCS Balance Summary ONLY (from PostgreSQL cache)
   */
  async sendNOCSBalanceSummary() {
    try {
      logger.info('[Teams Reports] Fetching NOCS balance summary from PostgreSQL cache...');

      // Get all NOCS balances from cache
      const balances = await NocsBalanceSummary.findAll({
        order: [['nocs_name', 'ASC']]
      });

      if (!balances || balances.length === 0) {
        logger.warn('[Teams Reports] No NOCS balance data found in cache');
        return;
      }

      // Calculate totals only (no individual NOCS data)
      let totalCustomers = 0;
      let totalCreditQty = 0;
      let totalCreditBalance = 0;
      let totalDueQty = 0;
      let totalDueBalance = 0;
      let totalNetBalance = 0;

      balances.forEach(nocs => {
        totalCustomers += parseInt(nocs.total_customers) || 0;
        totalCreditQty += parseInt(nocs.credit_qty) || 0;
        totalCreditBalance += parseFloat(nocs.credit_balance_amt) || 0;
        totalDueQty += parseInt(nocs.due_qty) || 0;
        totalDueBalance += parseFloat(nocs.due_balance_amt) || 0;
        totalNetBalance += parseFloat(nocs.net_balance) || 0;
      });

      const summaryData = {
        totalNocs: balances.length,
        totalCustomers: totalCustomers,
        totalCreditQty: totalCreditQty,
        totalCreditBalance: totalCreditBalance,
        totalDueQty: totalDueQty,
        totalDueBalance: totalDueBalance,
        totalNetBalance: totalNetBalance,
        timestamp: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      };

      logger.info(`[Teams Reports] NOCS Balance Summary: ${balances.length} NOCS, ${totalCustomers.toLocaleString('en-IN')} customers, Net Balance: ৳${totalNetBalance.toFixed(2)}`);

      await teamsService.sendNOCSBalanceSummaryOnly(summaryData);
      logger.info('[Teams Reports] ✅ NOCS Balance Summary sent to Teams');

    } catch (error) {
      logger.error('[Teams Reports] Failed to send NOCS Balance Summary:', error.message);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      nextRunIn: this.intervalId ? 'Running' : 'Stopped'
    };
  }
}

// Export singleton instance
module.exports = new TeamsReportsScheduler();
