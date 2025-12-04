/**
 * Microsoft Teams Service
 * Sends notifications to Teams channels via Incoming Webhooks
 */

const axios = require('axios');
const logger = require('../config/logger');

class TeamsService {
  constructor() {
    this.webhookUrl = null;
  }

  /**
   * Initialize Teams service with webhook URL
   */
  initialize(webhookUrl) {
    this.webhookUrl = webhookUrl;
    logger.info('[Teams] Service initialized');
  }

  /**
   * Send a simple text message to Teams
   */
  async sendTextMessage(text) {
    try {
      // Skip Teams messages in development environment
      if (process.env.NODE_ENV !== 'production') {
        logger.info('[Teams] Skipping message in development environment');
        return { success: true, skipped: true, reason: 'Development environment' };
      }

      if (!this.webhookUrl) {
        throw new Error('Teams webhook URL not configured');
      }

      const payload = {
        text: text
      };

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('[Teams] Text message sent successfully');
      return { success: true, response: response.data };
    } catch (error) {
      logger.error('[Teams] Failed to send text message:', error.message);
      throw error;
    }
  }

  /**
   * Send an Adaptive Card to Teams
   */
  async sendAdaptiveCard(card) {
    try {
      // Skip Teams messages in development environment
      if (process.env.NODE_ENV !== 'production') {
        logger.info('[Teams] Skipping message in development environment');
        return { success: true, skipped: true, reason: 'Development environment' };
      }

      if (!this.webhookUrl) {
        throw new Error('Teams webhook URL not configured');
      }

      const payload = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: card
          }
        ]
      };

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('[Teams] Adaptive card sent successfully');
      return { success: true, response: response.data };
    } catch (error) {
      logger.error('[Teams] Failed to send adaptive card:', error.message);
      throw error;
    }
  }

  /**
   * Send RC/DC Dashboard Report
   */
  async sendRCDCDashboard(data) {
    const card = this.formatRCDCDashboardCard(data);
    return await this.sendAdaptiveCard(card);
  }

  /**
   * Send NOCS-wise Breakdown Report
   */
  async sendNOCSBreakdown(data) {
    const card = this.formatNOCSBreakdownCard(data);
    return await this.sendAdaptiveCard(card);
  }

  /**
   * Send NOCS Balance Dashboard
   */
  async sendNOCSBalance(data) {
    const card = this.formatNOCSBalanceCard(data);
    return await this.sendAdaptiveCard(card);
  }

  /**
   * Send Batch Monitoring Report (every 30 mins)
   */
  async sendBatchMonitoringReport(data) {
    const card = this.formatBatchMonitoringCard(data);
    return await this.sendAdaptiveCard(card);
  }

  /**
   * Send Batch Stuck Alert
   */
  async sendBatchStuckAlert(batchData, stuckInfo) {
    const card = this.formatBatchStuckAlertCard(batchData, stuckInfo);
    return await this.sendAdaptiveCard(card);
  }

  /**
   * Send NOCS Balance Summary Only (every 1 hour)
   */
  async sendNOCSBalanceSummaryOnly(summaryData) {
    const card = this.formatNOCSBalanceSummaryOnlyCard(summaryData);
    return await this.sendAdaptiveCard(card);
  }

  /**
   * Format RC/DC Dashboard Adaptive Card
   */
  formatRCDCDashboardCard(data) {
    const { rc, dc, timestamp } = data;

    return {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'TextBlock',
              text: '📊 DPDC RC/DC DASHBOARD REPORT',
              size: 'Large',
              weight: 'Bolder',
              color: 'Accent',
              horizontalAlignment: 'Center'
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: '🔄 Remote Connect (RC)',
              weight: 'Bolder',
              size: 'Medium',
              color: 'Good'
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'Total In Progress:', value: rc.total.toString() },
                { title: '✅ Normal (< 30 min):', value: rc.normal.toString() },
                { title: '⚠️ Warning (30-60 min):', value: rc.warning.toString() },
                { title: '🔶 Alert (1-2 hrs):', value: rc.alert.toString() },
                { title: '🚨 Stuck (> 2 hrs):', value: rc.stuck.toString() }
              ]
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: '🔌 Disconnect (DC)',
              weight: 'Bolder',
              size: 'Medium',
              color: 'Warning'
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'Total In Progress:', value: dc.total.toString() },
                { title: '✅ Normal:', value: dc.normal.toString() },
                { title: '⚠️ Warning:', value: dc.warning.toString() },
                { title: '🔶 Alert:', value: dc.alert.toString() },
                { title: '🚨 Stuck:', value: dc.stuck.toString() }
              ]
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Small',
          items: [
            {
              type: 'TextBlock',
              text: `Generated: ${timestamp}`,
              size: 'Small',
              color: 'Default',
              horizontalAlignment: 'Center'
            },
            {
              type: 'TextBlock',
              text: 'DPDC AMI Monitoring System',
              size: 'Small',
              weight: 'Lighter',
              horizontalAlignment: 'Center',
              color: 'Default'
            }
          ]
        }
      ]
    };
  }

  /**
   * Format NOCS-wise Breakdown Adaptive Card
   */
  formatNOCSBreakdownCard(data) {
    const { nocs, timestamp } = data;

    const nocsItems = nocs.map(location => ({
      type: 'Container',
      separator: true,
      spacing: 'Medium',
      items: [
        {
          type: 'TextBlock',
          text: `🏢 ${location.name}`,
          weight: 'Bolder',
          size: 'Medium'
        },
        {
          type: 'FactSet',
          facts: [
            {
              title: 'RC:',
              value: `${location.rc.total} total (${location.rc.stuck} 🚨 Stuck, ${location.rc.alert} 🔶 Alert)`
            },
            {
              title: 'DC:',
              value: `${location.dc.total} total (${location.dc.stuck} 🚨 Stuck, ${location.dc.alert} 🔶 Alert)`
            }
          ]
        }
      ]
    }));

    return {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'TextBlock',
              text: '📍 NOCS-WISE RC/DC BREAKDOWN',
              size: 'Large',
              weight: 'Bolder',
              color: 'Accent',
              horizontalAlignment: 'Center'
            }
          ]
        },
        ...nocsItems,
        {
          type: 'Container',
          separator: true,
          spacing: 'Small',
          items: [
            {
              type: 'TextBlock',
              text: `Generated: ${timestamp}`,
              size: 'Small',
              color: 'Default',
              horizontalAlignment: 'Center'
            },
            {
              type: 'TextBlock',
              text: 'DPDC AMI Monitoring System',
              size: 'Small',
              weight: 'Lighter',
              horizontalAlignment: 'Center'
            }
          ]
        }
      ]
    };
  }

  /**
   * Format NOCS Balance Dashboard Adaptive Card
   */
  formatNOCSBalanceCard(data) {
    const { nocs, summary, timestamp } = data;

    const nocsItems = nocs.map(location => ({
      type: 'Container',
      separator: true,
      spacing: 'Medium',
      items: [
        {
          type: 'TextBlock',
          text: `🏢 ${location.name} (${location.code.trim()})`,
          weight: 'Bolder',
          size: 'Medium',
          color: 'Accent'
        },
        {
          type: 'FactSet',
          facts: [
            { title: '👥 Total Customers:', value: location.customers.toLocaleString('en-IN') },
            { title: '✅ Credit Qty:', value: location.dueQty.toLocaleString('en-IN') },
            { title: '💚 Credit Balance:', value: `৳${location.dueBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { title: '⚠️ Due Qty:', value: location.creditQty.toLocaleString('en-IN') },
            { title: '🔴 Due Balance:', value: `-৳${Math.abs(location.creditBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { title: '💰 Net Balance:', value: `${location.netBalance >= 0 ? '-' : ''}৳${Math.abs(location.netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
          ]
        }
      ]
    }));

    return {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'TextBlock',
              text: '💰 NOCS BALANCE DASHBOARD',
              size: 'Large',
              weight: 'Bolder',
              color: 'Accent',
              horizontalAlignment: 'Center'
            }
          ]
        },
        ...nocsItems,
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          style: 'good',
          items: [
            {
              type: 'TextBlock',
              text: '📊 Overall Summary',
              weight: 'Bolder',
              size: 'Large',
              color: 'Good'
            },
            {
              type: 'FactSet',
              facts: [
                { title: '🏢 Total NOCS Areas:', value: summary.totalNocs.toString() },
                { title: '👥 Total Customers:', value: summary.totalCustomers.toLocaleString('en-IN') },
                { title: '💚 Credit Balance:', value: `৳${summary.totalDueBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${summary.totalDueQty.toLocaleString('en-IN')} customers)` },
                { title: '🔴 Due Balance:', value: `-৳${Math.abs(summary.totalCreditBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${summary.totalCreditQty.toLocaleString('en-IN')} customers)` },
                { title: '💰 Net Balance:', value: `${summary.totalNetBalance >= 0 ? '-' : ''}৳${Math.abs(summary.totalNetBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
              ]
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Small',
          items: [
            {
              type: 'TextBlock',
              text: `Last Updated: ${timestamp}`,
              size: 'Small',
              color: 'Default',
              horizontalAlignment: 'Center'
            },
            {
              type: 'TextBlock',
              text: 'DPDC AMI Monitoring System',
              size: 'Small',
              weight: 'Lighter',
              horizontalAlignment: 'Center'
            }
          ]
        }
      ]
    };
  }

  /**
   * Format Batch Monitoring Report Adaptive Card
   */
  formatBatchMonitoringCard(data) {
    const { pendingIMD, lastUpdate, runningBatches, batchStatistics, timestamp } = data;

    // Format running batches
    const batchItems = runningBatches.map(batch => {
      const rpsColor = batch.rps >= 100 ? 'Good' : batch.rps >= 50 ? 'Attention' : 'Warning';
      const rpsIcon = batch.rps >= 100 ? '🟢' : batch.rps >= 50 ? '🟡' : '🔴';

      return {
        type: 'Container',
        separator: true,
        spacing: 'Small',
        items: [
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  {
                    type: 'TextBlock',
                    text: `${rpsIcon} **${batch.batchCode}**`,
                    weight: 'Bolder',
                    size: 'Medium'
                  }
                ]
              },
              {
                type: 'Column',
                width: 'auto',
                items: [
                  {
                    type: 'TextBlock',
                    text: `RPS: ${batch.rps.toFixed(2)}`,
                    color: rpsColor,
                    weight: 'Bolder'
                  }
                ]
              }
            ]
          },
          {
            type: 'FactSet',
            facts: [
              { title: '⏰ Start Time:', value: new Date(batch.startTime).toLocaleString('en-US') },
              { title: '⏱️ Duration:', value: this.formatDuration(batch.durationSeconds) },
              { title: '📊 Records:', value: batch.totalRecords.toLocaleString('en-IN') },
              { title: '📈 Status:', value: batch.status || 'Running' }
            ]
          }
        ]
      };
    });

    // Format statistics if available
    const statisticsItems = batchStatistics && batchStatistics.length > 0 ? [
      {
        type: 'Container',
        separator: true,
        spacing: 'Medium',
        items: [
          {
            type: 'TextBlock',
            text: '📈 Batch Statistics (Last 24 Hours)',
            weight: 'Bolder',
            size: 'Large',
            color: 'Accent'
          },
          ...batchStatistics.map(stat => ({
            type: 'Container',
            spacing: 'Small',
            items: [
              {
                type: 'TextBlock',
                text: `**${stat.batch_code}**`,
                weight: 'Bolder'
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'Avg RPS:', value: parseFloat(stat.avg_rps || 0).toFixed(2) },
                  { title: 'Max RPS:', value: parseFloat(stat.max_rps || 0).toFixed(2) },
                  { title: 'Max Records:', value: (stat.max_records || 0).toLocaleString('en-IN') },
                  { title: 'Checks:', value: (stat.total_checks || 0).toString() }
                ]
              }
            ]
          }))
        ]
      }
    ] : [];

    return {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'TextBlock',
              text: '🔄 BATCH MONITORING REPORT',
              size: 'ExtraLarge',
              weight: 'Bolder',
              color: 'Accent',
              horizontalAlignment: 'Center'
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          style: 'good',
          items: [
            {
              type: 'TextBlock',
              text: '📋 Pending IMD',
              weight: 'Bolder',
              size: 'Large'
            },
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  width: 'stretch',
                  items: [
                    {
                      type: 'TextBlock',
                      text: `**${pendingIMD.toLocaleString('en-IN')}** records pending`,
                      size: 'Large',
                      color: pendingIMD > 10000 ? 'Warning' : 'Good'
                    }
                  ]
                },
                {
                  type: 'Column',
                  width: 'auto',
                  items: [
                    {
                      type: 'TextBlock',
                      text: `Last Update: ${lastUpdate}`,
                      size: 'Small',
                      color: 'Default'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: `⚡ Currently Running Batches (${runningBatches.length})`,
              weight: 'Bolder',
              size: 'Large',
              color: 'Accent'
            }
          ]
        },
        ...batchItems,
        ...statisticsItems,
        {
          type: 'Container',
          separator: true,
          spacing: 'Small',
          items: [
            {
              type: 'TextBlock',
              text: `Generated: ${timestamp}`,
              size: 'Small',
              color: 'Default',
              horizontalAlignment: 'Center'
            },
            {
              type: 'TextBlock',
              text: 'DPDC AMI Batch Monitoring System',
              size: 'Small',
              weight: 'Lighter',
              horizontalAlignment: 'Center'
            }
          ]
        }
      ]
    };
  }

  /**
   * Format Batch Stuck Alert Adaptive Card
   */
  formatBatchStuckAlertCard(batchData, stuckInfo) {
    const { statistics } = stuckInfo;

    return {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'Container',
          style: 'attention',
          items: [
            {
              type: 'TextBlock',
              text: '🚨 BATCH STUCK ALERT',
              size: 'ExtraLarge',
              weight: 'Bolder',
              color: 'Attention',
              horizontalAlignment: 'Center'
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: `⚠️ Batch: **${batchData.batchCode}**`,
              size: 'Large',
              weight: 'Bolder',
              color: 'Warning'
            },
            {
              type: 'TextBlock',
              text: stuckInfo.reason,
              size: 'Medium',
              color: 'Attention',
              wrap: true
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: '📊 Current Status',
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'FactSet',
              facts: [
                { title: '⏰ Start Time:', value: new Date(batchData.startTime).toLocaleString('en-US') },
                { title: '⏱️ Duration:', value: this.formatDuration(batchData.durationSeconds) },
                { title: '📊 Records:', value: batchData.totalRecords.toLocaleString('en-IN') },
                { title: '📈 RPS:', value: batchData.rps.toFixed(2) }
              ]
            }
          ]
        },
        statistics ? {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: '📉 Comparison with Previous Check',
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'Previous Records:', value: statistics.previousRecords.toLocaleString('en-IN') },
                { title: 'Current Records:', value: statistics.currentRecords.toLocaleString('en-IN') },
                { title: 'Records Diff:', value: `${statistics.recordsDiff >= 0 ? '+' : ''}${statistics.recordsDiff.toLocaleString('en-IN')}` },
                { title: 'Previous RPS:', value: statistics.previousRps.toFixed(2) },
                { title: 'Current RPS:', value: statistics.currentRps.toFixed(2) },
                { title: 'Trend:', value: statistics.rpsTrend.toUpperCase() }
              ]
            }
          ]
        } : {},
        {
          type: 'Container',
          separator: true,
          spacing: 'Small',
          items: [
            {
              type: 'TextBlock',
              text: `Alert Time: ${new Date().toLocaleString('en-US')}`,
              size: 'Small',
              color: 'Default',
              horizontalAlignment: 'Center'
            },
            {
              type: 'TextBlock',
              text: 'DPDC AMI Batch Monitoring System',
              size: 'Small',
              weight: 'Lighter',
              horizontalAlignment: 'Center'
            }
          ]
        }
      ]
    };
  }

  /**
   * Helper to format duration in human-readable format
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format NOCS Balance Summary Only Adaptive Card
   * Just the Overall Summary section
   */
  formatNOCSBalanceSummaryOnlyCard(summaryData) {
    const {
      totalNocs,
      totalCustomers,
      totalCreditQty,
      totalCreditBalance,
      totalDueQty,
      totalDueBalance,
      totalNetBalance,
      timestamp
    } = summaryData;

    return {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'TextBlock',
              text: '💰 NOCS Balance - Overall Summary',
              size: 'ExtraLarge',
              weight: 'Bolder',
              color: 'Accent',
              horizontalAlignment: 'Center'
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [
            {
              type: 'FactSet',
              facts: [
                {
                  title: '🏢 Total NOCS Areas:',
                  value: totalNocs.toString()
                },
                {
                  title: '👥 Total Customers:',
                  value: totalCustomers.toLocaleString('en-IN')
                },
                {
                  title: '💚 Credit Balance:',
                  value: `৳${totalCreditBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalCreditQty.toLocaleString('en-IN')} customers)`
                },
                {
                  title: '🔴 Due Balance:',
                  value: `-৳${Math.abs(totalDueBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalDueQty.toLocaleString('en-IN')} customers)`
                },
                {
                  title: '💰 Net Balance:',
                  value: `${totalNetBalance >= 0 ? '-' : ''}৳${Math.abs(totalNetBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              ]
            }
          ]
        },
        {
          type: 'Container',
          separator: true,
          spacing: 'Small',
          items: [
            {
              type: 'TextBlock',
              text: `Last Updated: ${timestamp}`,
              size: 'Small',
              color: 'Default',
              horizontalAlignment: 'Center'
            },
            {
              type: 'TextBlock',
              text: 'DPDC AMI Monitoring System',
              size: 'Small',
              weight: 'Lighter',
              horizontalAlignment: 'Center'
            }
          ]
        }
      ]
    };
  }

  /**
   * Test connection by sending a test message
   */
  async testConnection() {
    try {
      await this.sendTextMessage('✅ Teams integration test successful!\n\nDPDC AMI Monitoring System is connected.');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const teamsService = new TeamsService();
module.exports = teamsService;
