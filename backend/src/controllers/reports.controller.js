const reportsService = require('../services/reports.service');
const realtimeService = require('../services/realtime.service');
const pdfService = require('../services/pdf.service');
const cacheService = require('../services/cache.service');

/**
 * Get RC/DC analytics summary
 * Returns today's remote connect/disconnect command statistics
 */
const getRCDCAnalyticsSummary = async (req, res) => {
  try {
    const data = await reportsService.executeReport('rc_dc_analytics_summary');

    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getRCDCAnalyticsSummary:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch RC/DC analytics',
      error: error.message
    });
  }
};

/**
 * Get meter-wise commands (DEPRECATED - Use getMeterWiseCommandsPaginated instead)
 * Returns detailed list of meter commands for today
 */
const getMeterWiseCommands = async (req, res) => {
  try {
    const data = await reportsService.executeReport('meter_wise_commands');

    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getMeterWiseCommands:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter-wise commands',
      error: error.message
    });
  }
};

/**
 * Get meter-wise commands with PAGINATION and CACHING
 * Optimized for 200+ concurrent users and 30k+ records
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 100, max: 1000)
 */
const getMeterWiseCommandsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000); // Max 1000 per page

    // Check cache first
    const cacheKey = `meter_commands:page:${page}:limit:${limit}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      console.log(`[Reports Controller] Returning cached data for page ${page}`);
      return res.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get total count (with caching)
    const countCacheKey = 'meter_commands:total_count';
    let totalCount = cacheService.get(countCacheKey);

    if (!totalCount) {
      totalCount = await reportsService.getReportCount('meter_wise_commands_count');
      cacheService.set(countCacheKey, totalCount, 2 * 60 * 1000); // Cache count for 2 minutes
    }

    // Get paginated data
    const result = await reportsService.executeReportPaginated(
      'meter_wise_commands_paginated',
      page,
      limit
    );

    const totalPages = Math.ceil(totalCount / limit);

    const response = {
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Cache this page for 3 minutes
    cacheService.set(cacheKey, response, 3 * 60 * 1000);

    res.json(response);
  } catch (error) {
    console.error('[Reports Controller] Error in getMeterWiseCommandsPaginated:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter-wise commands',
      error: error.message
    });
  }
};

/**
 * Get meter-wise commands by NOCS
 * Returns detailed list of meter commands for a specific NOCS location
 */
const getMeterWiseCommandsByNocs = async (req, res) => {
  try {
    const { nocsName } = req.query;

    if (!nocsName) {
      return res.status(400).json({
        success: false,
        message: 'NOCS name is required'
      });
    }

    const data = await reportsService.executeReport('meter_wise_commands_by_nocs', {
      nocsName: nocsName
    });

    res.json({
      success: true,
      data,
      count: data.length,
      nocsName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getMeterWiseCommandsByNocs:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter-wise commands for NOCS',
      error: error.message
    });
  }
};

/**
 * Get daily connect/disconnect count
 * Returns aggregated counts of RC/DC commands by type and status
 */
const getDailyConnectDisconnectCount = async (req, res) => {
  try {
    const data = await reportsService.executeReport('daily_connect_disconnect_count');

    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getDailyConnectDisconnectCount:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily RC/DC count',
      error: error.message
    });
  }
};

/**
 * Get RC/DC NOCS aggregated summary
 * Returns pre-aggregated counts grouped by NOCS, command type, and status
 */
const getRCDCNocsAggregated = async (req, res) => {
  try {
    const data = await reportsService.executeReport('rc_dc_nocs_aggregated');

    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getRCDCNocsAggregated:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch NOCS aggregated summary',
      error: error.message
    });
  }
};

/**
 * Start real-time polling
 * Enables automatic data broadcasting via WebSocket
 */
const startRealtime = async (req, res) => {
  try {
    const { interval = 300000 } = req.body; // Default 5 minutes (300000ms)

    realtimeService.startPolling(interval);

    res.json({
      success: true,
      message: 'Real-time updates started',
      status: realtimeService.getStatus()
    });
  } catch (error) {
    console.error('[Reports Controller] Error starting realtime:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to start real-time updates',
      error: error.message
    });
  }
};

/**
 * Stop real-time polling
 * Disables automatic data broadcasting
 */
const stopRealtime = async (req, res) => {
  try {
    realtimeService.stopPolling();

    res.json({
      success: true,
      message: 'Real-time updates stopped',
      status: realtimeService.getStatus()
    });
  } catch (error) {
    console.error('[Reports Controller] Error stopping realtime:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to stop real-time updates',
      error: error.message
    });
  }
};

/**
 * Get real-time status
 * Returns current polling status and connected clients
 */
const getRealtimeStatus = async (req, res) => {
  try {
    const status = realtimeService.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('[Reports Controller] Error getting realtime status:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get real-time status',
      error: error.message
    });
  }
};

/**
 * Force broadcast data now (for testing)
 * Manually triggers a data broadcast to all connected clients
 */
const broadcastNow = async (req, res) => {
  try {
    const result = await realtimeService.broadcastNow();

    res.json(result);
  } catch (error) {
    console.error('[Reports Controller] Error broadcasting data:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to broadcast data',
      error: error.message
    });
  }
};

/**
 * Download NOCS Report as PDF
 * Generates a PDF report for a specific NOCS with summary and meter-wise data
 */
const downloadNocsReportPDF = async (req, res) => {
  try {
    const { nocsName } = req.query;

    if (!nocsName) {
      return res.status(400).json({
        success: false,
        message: 'NOCS name is required'
      });
    }

    console.log('[Reports Controller] Generating PDF for NOCS:', nocsName);

    // Fetch NOCS aggregated data to calculate summary
    const nocsAggregatedData = await reportsService.executeReport('rc_dc_nocs_aggregated');

    // Find the specific NOCS data
    const nocsMap = {};
    nocsAggregatedData.forEach((row) => {
      const commandType = row.COMMAND_TYPE?.trim();
      const commandStatus = row.COMMAND_STATUS?.trim();
      const nocs = row.NOCS_NAME?.trim() || 'Unknown NOCS';
      const count = parseInt(row.COMMAND_COUNT) || 0;

      if (!nocsMap[nocs]) {
        nocsMap[nocs] = {
          nocsName: nocs,
          rcSuccess: 0,
          rcInProgress: 0,
          dcSuccess: 0,
          dcInProgress: 0,
          dcFailed: 0,
          total: 0
        };
      }

      nocsMap[nocs].total += count;

      if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMPLETED') {
        nocsMap[nocs].rcSuccess = count;
      } else if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMINPROG') {
        nocsMap[nocs].rcInProgress = count;
      } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMPLETED') {
        nocsMap[nocs].dcSuccess = count;
      } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMINPROG') {
        nocsMap[nocs].dcInProgress = count;
      } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'DISCARDED') {
        nocsMap[nocs].dcFailed = count;
      }
    });

    const nocsData = nocsMap[nocsName];

    if (!nocsData) {
      return res.status(404).json({
        success: false,
        message: `NOCS "${nocsName}" not found`
      });
    }

    // Generate PDF (summary only, no meter data)
    const pdfDoc = pdfService.generateNocsReport(nocsData);

    // Set response headers for PDF download
    const filename = `NOCS_Report_${nocsName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();

    console.log('[Reports Controller] PDF generated successfully for:', nocsName);
  } catch (error) {
    console.error('[Reports Controller] Error generating PDF:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
      error: error.message
    });
  }
};

module.exports = {
  getRCDCAnalyticsSummary,
  getMeterWiseCommands,
  getMeterWiseCommandsPaginated, // NEW: Optimized paginated endpoint
  getMeterWiseCommandsByNocs,
  getDailyConnectDisconnectCount,
  getRCDCNocsAggregated,
  startRealtime,
  stopRealtime,
  getRealtimeStatus,
  broadcastNow,
  downloadNocsReportPDF
};
