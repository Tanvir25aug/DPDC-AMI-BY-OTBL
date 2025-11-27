/**
 * Batch Monitoring Scheduler
 * Runs every 15 minutes to monitor batch execution
 * - Logs batch runs to PostgreSQL
 * - Detects failures and stuck batches
 * - Sends email alerts for critical issues
 */

const { executeQuery } = require('../config/oracle');
const { sequelize } = require('../config/database');
const BatchExecutionLog = require('../models/BatchExecutionLog');
const BatchMonitoringAlert = require('../models/BatchMonitoringAlert');
const logger = require('../utils/logger');

class BatchMonitoringScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMinutes = 15; // Run every 15 minutes
    this.lastRunTime = null;
    this.previousBatchStates = new Map(); // Track batch progress
  }

  /**
   * Start the scheduler
   */
  async startScheduler() {
    try {
      logger.info('========================================');
      logger.info('[Batch Monitoring] Starting Batch Monitoring Scheduler');
      logger.info(`[Batch Monitoring] Interval: Every ${this.intervalMinutes} minutes`);
      logger.info('========================================');

      // Run immediately on startup
      await this.monitorBatches();

      // Then run every 15 minutes
      this.intervalId = setInterval(async () => {
        await this.monitorBatches();
      }, this.intervalMinutes * 60 * 1000);

      logger.info('[Batch Monitoring] Scheduler started successfully');
      return { success: true };
    } catch (error) {
      logger.error('[Batch Monitoring] Failed to start scheduler:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[Batch Monitoring] Scheduler stopped');
    }
  }

  /**
   * Main monitoring function - runs every 15 minutes
   */
  async monitorBatches() {
    if (this.isRunning) {
      logger.warn('[Batch Monitoring] Previous run still in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('========================================');
      logger.info('[Batch Monitoring] Starting batch monitoring cycle');
      logger.info(`[Batch Monitoring] Time: ${new Date().toISOString()}`);
      logger.info('========================================');

      // 1. Monitor running batches
      await this.monitorRunningBatches();

      // 2. Monitor completed batches (last 15 minutes)
      await this.monitorCompletedBatches();

      // 3. Detect stuck batches
      await this.detectStuckBatches();

      // 4. Clean old logs (keep 60 days)
      await this.cleanOldLogs();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`[Batch Monitoring] Monitoring cycle completed in ${duration}s`);
      this.lastRunTime = new Date();

    } catch (error) {
      logger.error('[Batch Monitoring] Error in monitoring cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Monitor currently running batches
   */
  async monitorRunningBatches() {
    try {
      logger.info('[Batch Monitoring] Checking running batches...');

      const result = await executeQuery(
        `SELECT
          run.BATCH_CD,
          run.BATCH_NBR,
          job.BATCH_JOB_STAT_FLG,
          run.START_DTTM,
          BATCH_THREAD_CNT,
          batch_bus_dt,
          SUM(rec_proc_cnt) as TOTAL_RECORDS,
          (SYSDATE - run.START_DTTM) * 24 * 60 as DURATION_MINUTES
        FROM CI_BATCH_job job
        JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd
        JOIN CI_BATCH_INST inst ON run.batch_nbr = inst.batch_nbr AND job.batch_nbr = inst.batch_nbr
        WHERE job.BATCH_JOB_STAT_FLG = 'ST'
          AND run.BATCH_CD = inst.BATCH_CD
          AND run.batch_cd NOT IN ('F1-FLUSH', 'C1-WFSUB')
        GROUP BY run.BATCH_CD, run.BATCH_NBR, job.BATCH_JOB_STAT_FLG, run.START_DTTM, BATCH_THREAD_CNT, batch_bus_dt
        ORDER BY run.START_DTTM DESC`
      );

      const runningBatches = result.rows || [];
      logger.info(`[Batch Monitoring] Found ${runningBatches.length} running batches`);

      for (const batch of runningBatches) {
        // Log to PostgreSQL
        await this.logBatchExecution({
          batch_code: batch.BATCH_CD,
          batch_nbr: batch.BATCH_NBR,
          status: 'Running',
          start_time: batch.START_DTTM,
          end_time: null,
          duration_seconds: null,
          thread_count: batch.BATCH_THREAD_CNT,
          records_processed: batch.TOTAL_RECORDS || 0,
          rps: null,
          business_date: batch.BATCH_BUS_DT,
          error_message: null
        });

        // Check for long-running batch
        await this.checkLongRunningBatch(batch);

        // Store current state for stuck detection
        this.previousBatchStates.set(batch.BATCH_CD, {
          records: batch.TOTAL_RECORDS || 0,
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('[Batch Monitoring] Error monitoring running batches:', error);
    }
  }

  /**
   * Monitor completed batches (last 15 minutes)
   */
  async monitorCompletedBatches() {
    try {
      logger.info('[Batch Monitoring] Checking completed batches...');

      const result = await executeQuery(
        `SELECT
          run.BATCH_CD,
          run.BATCH_NBR,
          job.BATCH_JOB_STAT_FLG,
          run.START_DTTM,
          run.END_DTTM,
          BATCH_THREAD_CNT,
          (END_DTTM - START_DTTM) * 24 * 60 * 60 as TOTAL_DURATION,
          SUM(rec_proc_cnt) as TOTAL_RECORDS,
          DECODE((END_DTTM - START_DTTM) * 24 * 60 * 60, 0, 0,
            (SUM(rec_proc_cnt) / ((END_DTTM - START_DTTM) * 24 * 60 * 60))) as RPS,
          batch_bus_dt
        FROM CI_BATCH_job job
        JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd
        JOIN CI_BATCH_INST inst ON run.batch_nbr = inst.batch_nbr AND job.batch_nbr = inst.batch_nbr
        WHERE run.END_DTTM >= SYSDATE - (15/1440)
          AND job.BATCH_JOB_STAT_FLG IN ('CM', 'ED', 'ER')
          AND run.BATCH_CD = inst.BATCH_CD
          AND run.batch_cd NOT IN ('F1-FLUSH', 'C1-WFSUB')
        GROUP BY run.BATCH_CD, run.BATCH_NBR, job.BATCH_JOB_STAT_FLG, run.START_DTTM, run.END_DTTM, BATCH_THREAD_CNT, batch_bus_dt
        ORDER BY run.END_DTTM DESC`
      );

      const completedBatches = result.rows || [];
      logger.info(`[Batch Monitoring] Found ${completedBatches.length} completed batches`);

      for (const batch of completedBatches) {
        const statusMap = {
          'ST': 'Running',
          'CM': 'Complete',
          'ED': 'Ended',
          'ER': 'Error',
          'PD': 'Pending'
        };

        const status = statusMap[batch.BATCH_JOB_STAT_FLG] || batch.BATCH_JOB_STAT_FLG;

        // Log to PostgreSQL
        const logId = await this.logBatchExecution({
          batch_code: batch.BATCH_CD,
          batch_nbr: batch.BATCH_NBR,
          status: status,
          start_time: batch.START_DTTM,
          end_time: batch.END_DTTM,
          duration_seconds: Math.round(batch.TOTAL_DURATION || 0),
          thread_count: batch.BATCH_THREAD_CNT,
          records_processed: batch.TOTAL_RECORDS || 0,
          rps: Math.round((batch.RPS || 0) * 100) / 100,
          business_date: batch.BATCH_BUS_DT,
          error_message: null
        });

        // Check if batch failed
        if (batch.BATCH_JOB_STAT_FLG === 'ER') {
          await this.createFailureAlert(batch, logId);
        }

        // Update performance summary
        await this.updatePerformanceSummary(batch, status);
      }

    } catch (error) {
      logger.error('[Batch Monitoring] Error monitoring completed batches:', error);
    }
  }

  /**
   * Detect stuck batches (no progress for > 60 minutes)
   */
  async detectStuckBatches() {
    try {
      const stuckThresholdMinutes = 60; // 1 hour
      const now = new Date();

      for (const [batchCode, previousState] of this.previousBatchStates.entries()) {
        const minutesElapsed = (now - previousState.timestamp) / 1000 / 60;

        if (minutesElapsed >= stuckThresholdMinutes) {
          // Fetch current state
          const result = await executeQuery(
            `SELECT
              run.BATCH_CD,
              SUM(rec_proc_cnt) as TOTAL_RECORDS
            FROM CI_BATCH_job job
            JOIN CI_BATCH_RUN run ON job.batch_cd = run.batch_cd
            JOIN CI_BATCH_INST inst ON run.batch_nbr = inst.batch_nbr
            WHERE job.BATCH_JOB_STAT_FLG = 'ST'
              AND run.BATCH_CD = :batchCode
            GROUP BY run.BATCH_CD`,
            { batchCode }
          );

          if (result.rows.length > 0) {
            const currentRecords = result.rows[0].TOTAL_RECORDS || 0;

            // If no progress in 60 minutes, it's stuck
            if (currentRecords === previousState.records) {
              logger.warn(`[Batch Monitoring] Stuck batch detected: ${batchCode}`);
              await this.createStuckAlert(batchCode, minutesElapsed);
            }
          }

          // Remove from tracking
          this.previousBatchStates.delete(batchCode);
        }
      }
    } catch (error) {
      logger.error('[Batch Monitoring] Error detecting stuck batches:', error);
    }
  }

  /**
   * Log batch execution to PostgreSQL
   */
  async logBatchExecution(batchData) {
    try {
      // Check if this exact batch run already exists (same batch_nbr and start_time)
      if (batchData.batch_nbr) {
        const existing = await BatchExecutionLog.findOne({
          where: {
            batch_code: batchData.batch_code,
            batch_nbr: batchData.batch_nbr,
            start_time: batchData.start_time
          }
        });

        if (existing) {
          // Update existing record
          await existing.update({
            ...batchData,
            snapshot_time: new Date()
          });
          return existing.id;
        }
      }

      // Create new log entry
      const log = await BatchExecutionLog.create({
        ...batchData,
        snapshot_time: new Date()
      });

      return log.id;
    } catch (error) {
      logger.error('[Batch Monitoring] Error logging batch execution:', error);
      return null;
    }
  }

  /**
   * Check if batch is running too long
   */
  async checkLongRunningBatch(batch) {
    try {
      const durationMinutes = batch.DURATION_MINUTES || 0;

      // Get threshold from workflow config
      const [workflow] = await sequelize.query(
        `SELECT max_duration_minutes, is_critical
         FROM batch_workflow_config
         WHERE batch_code = :batchCode AND enabled = true`,
        {
          replacements: { batchCode: batch.BATCH_CD },
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (workflow && workflow.max_duration_minutes) {
        if (durationMinutes >= workflow.max_duration_minutes) {
          // Check if alert already exists for this batch run
          const existingAlert = await BatchMonitoringAlert.findOne({
            where: {
              batch_code: batch.BATCH_CD,
              alert_type: 'LONG_RUNNING',
              business_date: batch.BATCH_BUS_DT,
              acknowledged: false
            }
          });

          if (!existingAlert) {
            await this.createAlert({
              batch_code: batch.BATCH_CD,
              alert_type: 'LONG_RUNNING',
              alert_severity: 'WARNING',
              alert_message: `Batch ${batch.BATCH_CD} has been running for ${Math.round(durationMinutes)} minutes (threshold: ${workflow.max_duration_minutes} min)`,
              business_date: batch.BATCH_BUS_DT,
              send_email: workflow.is_critical
            });
          }
        }
      }
    } catch (error) {
      logger.error('[Batch Monitoring] Error checking long running batch:', error);
    }
  }

  /**
   * Create failure alert
   */
  async createFailureAlert(batch, logId) {
    try {
      // Check if alert already exists
      const existingAlert = await BatchMonitoringAlert.findOne({
        where: {
          batch_code: batch.BATCH_CD,
          alert_type: 'FAILED',
          business_date: batch.BATCH_BUS_DT,
          acknowledged: false
        }
      });

      if (!existingAlert) {
        await this.createAlert({
          batch_code: batch.BATCH_CD,
          alert_type: 'FAILED',
          alert_severity: 'CRITICAL',
          alert_message: `Batch ${batch.BATCH_CD} FAILED at ${new Date(batch.END_DTTM).toLocaleString()}`,
          batch_execution_log_id: logId,
          business_date: batch.BATCH_BUS_DT,
          send_email: true // Always send email for failures
        });
      }
    } catch (error) {
      logger.error('[Batch Monitoring] Error creating failure alert:', error);
    }
  }

  /**
   * Create stuck batch alert
   */
  async createStuckAlert(batchCode, minutesElapsed) {
    try {
      await this.createAlert({
        batch_code: batchCode,
        alert_type: 'STUCK',
        alert_severity: 'CRITICAL',
        alert_message: `Batch ${batchCode} appears STUCK - no progress for ${Math.round(minutesElapsed)} minutes`,
        business_date: new Date(),
        send_email: true // Always send email for stuck batches
      });
    } catch (error) {
      logger.error('[Batch Monitoring] Error creating stuck alert:', error);
    }
  }

  /**
   * Create alert and optionally send email
   */
  async createAlert(alertData) {
    try {
      const alert = await BatchMonitoringAlert.create(alertData);

      logger.warn(`[Batch Monitoring] 🚨 ALERT: ${alertData.alert_type} - ${alertData.alert_message}`);

      // Send email if configured
      if (alertData.send_email) {
        await this.sendEmailAlert(alert);
      }

      return alert;
    } catch (error) {
      logger.error('[Batch Monitoring] Error creating alert:', error);
      return null;
    }
  }

  /**
   * Send email alert (placeholder - implement with your email service)
   */
  async sendEmailAlert(alert) {
    try {
      // TODO: Implement email sending using nodemailer
      // For now, just log it
      logger.info(`[Batch Monitoring] 📧 Email alert would be sent: ${alert.alert_message}`);

      // Mark as sent
      await alert.update({
        email_sent: true,
        email_sent_at: new Date()
      });

      // Actual email implementation will be added in next phase
    } catch (error) {
      logger.error('[Batch Monitoring] Error sending email alert:', error);
    }
  }

  /**
   * Update performance summary (daily aggregates)
   */
  async updatePerformanceSummary(batch, status) {
    try {
      const businessDate = batch.BATCH_BUS_DT;
      const batchCode = batch.BATCH_CD;

      // Get or create summary record
      const [summary] = await sequelize.query(
        `INSERT INTO batch_performance_summary (batch_code, business_date, total_runs, successful_runs, failed_runs, success_rate, avg_duration_seconds, avg_rps, total_records, created_at, updated_at)
         VALUES (:batchCode, :businessDate, 1, :successfulRuns, :failedRuns, :successRate, :duration, :rps, :records, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (batch_code, business_date)
         DO UPDATE SET
           total_runs = batch_performance_summary.total_runs + 1,
           successful_runs = batch_performance_summary.successful_runs + :successfulRuns,
           failed_runs = batch_performance_summary.failed_runs + :failedRuns,
           success_rate = ((batch_performance_summary.successful_runs + :successfulRuns)::decimal / (batch_performance_summary.total_runs + 1) * 100),
           avg_duration_seconds = ((batch_performance_summary.avg_duration_seconds * batch_performance_summary.total_runs + :duration) / (batch_performance_summary.total_runs + 1)),
           avg_rps = ((batch_performance_summary.avg_rps * batch_performance_summary.total_runs + :rps) / (batch_performance_summary.total_runs + 1)),
           total_records = batch_performance_summary.total_records + :records,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        {
          replacements: {
            batchCode: batchCode,
            businessDate: businessDate,
            successfulRuns: status === 'Complete' ? 1 : 0,
            failedRuns: status === 'Error' ? 1 : 0,
            successRate: status === 'Complete' ? 100 : 0,
            duration: Math.round(batch.TOTAL_DURATION || 0),
            rps: Math.round((batch.RPS || 0) * 100) / 100,
            records: batch.TOTAL_RECORDS || 0
          },
          type: sequelize.QueryTypes.INSERT
        }
      );

    } catch (error) {
      logger.error('[Batch Monitoring] Error updating performance summary:', error);
    }
  }

  /**
   * Clean old logs (keep 60 days)
   */
  async cleanOldLogs() {
    try {
      const retentionDays = 60;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.setDate() - retentionDays);

      const deleted = await BatchExecutionLog.destroy({
        where: {
          created_at: {
            [sequelize.Sequelize.Op.lt]: cutoffDate
          }
        }
      });

      if (deleted > 0) {
        logger.info(`[Batch Monitoring] Cleaned ${deleted} old log records (>60 days)`);
      }
    } catch (error) {
      logger.error('[Batch Monitoring] Error cleaning old logs:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.lastRunTime
        ? new Date(this.lastRunTime.getTime() + this.intervalMinutes * 60 * 1000)
        : null
    };
  }
}

// Export singleton instance
const batchMonitoringScheduler = new BatchMonitoringScheduler();
module.exports = batchMonitoringScheduler;
