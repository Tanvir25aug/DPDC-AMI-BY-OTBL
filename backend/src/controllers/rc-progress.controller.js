/**
 * RC In Progress Controller
 * Handles Remote Connect commands that are currently in progress
 * Provides detailed reporting, analytics, and export functionality
 */

const reportsService = require('../services/reports.service');
const cacheService = require('../services/cache.service');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Get detailed list of RC commands in progress
 * Returns paginated data with time tracking and duration status
 *
 * @route GET /api/rc-progress/detailed
 * @query page - Page number (default: 1)
 * @query limit - Records per page (default: 100, max: 1000)
 * @query nocs - Filter by NOCS name (optional)
 * @query durationStatus - Filter by NORMAL/WARNING/ALERT/STUCK (optional)
 * @query minMinutes - Filter by minimum minutes elapsed (optional)
 */
const getRCInProgressDetailed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const nocs = req.query.nocs;
    const durationStatus = req.query.durationStatus;
    const minMinutes = req.query.minMinutes ? parseInt(req.query.minMinutes) : null;

    // Build cache key with filters
    const cacheKey = `rc_progress:detailed:page:${page}:limit:${limit}:nocs:${nocs || 'all'}:status:${durationStatus || 'all'}:min:${minMinutes || 'all'}`;

    // Check cache first (1 minute TTL for fresh data)
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Execute report query
    const result = await reportsService.executeReport('rc_in_progress_detailed');
    let data = result || [];  // executeReport returns rows array directly

    // Apply filters if provided
    if (nocs) {
      data = data.filter(row => row.NOCS_NAME === nocs);
    }
    if (durationStatus) {
      data = data.filter(row => row.DURATION_STATUS === durationStatus);
    }
    if (minMinutes !== null) {
      data = data.filter(row => row.MINUTES_ELAPSED >= minMinutes);
    }

    // Calculate total count after filtering
    const totalCount = data.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);

    const response = {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        nocs: nocs || null,
        durationStatus: durationStatus || null,
        minMinutes: minMinutes || null
      },
      timestamp: new Date().toISOString()
    };

    // Cache for 1 minute (real-time data needs frequent updates)
    cacheService.set(cacheKey, response, 60 * 1000);

    res.json(response);
  } catch (error) {
    console.error('Error fetching RC In Progress detailed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RC In Progress detailed data',
      message: error.message
    });
  }
};

/**
 * Get summary statistics for RC In Progress
 * Returns aggregated analytics for dashboard cards
 *
 * @route GET /api/rc-progress/summary
 */
const getRCInProgressSummary = async (req, res) => {
  try {
    const cacheKey = 'rc_progress:summary';

    // Check cache (1 minute TTL)
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Execute summary report
    const result = await reportsService.executeReport('rc_in_progress_summary');
    const summary = result && result.length > 0 ? result[0] : {  // result is already the rows array
      TOTAL_IN_PROGRESS: 0,
      NORMAL_0_30MIN: 0,
      WARNING_30_60MIN: 0,
      ALERT_1_2HOURS: 0,
      STUCK_2HOURS_PLUS: 0,
      AVG_MINUTES_ELAPSED: 0,
      MAX_MINUTES_ELAPSED: 0,
      MIN_MINUTES_ELAPSED: 0
    };

    const response = {
      success: true,
      data: {
        total: summary.TOTAL_IN_PROGRESS || 0,
        byDuration: {
          normal: summary.NORMAL_0_30MIN || 0,
          warning: summary.WARNING_30_60MIN || 0,
          alert: summary.ALERT_1_2HOURS || 0,
          stuck: summary.STUCK_2HOURS_PLUS || 0
        },
        metrics: {
          avgMinutes: parseFloat(summary.AVG_MINUTES_ELAPSED || 0),
          maxMinutes: parseFloat(summary.MAX_MINUTES_ELAPSED || 0),
          minMinutes: parseFloat(summary.MIN_MINUTES_ELAPSED || 0)
        }
      },
      timestamp: new Date().toISOString()
    };

    // Cache for 1 minute
    cacheService.set(cacheKey, response, 60 * 1000);

    res.json(response);
  } catch (error) {
    console.error('Error fetching RC In Progress summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RC In Progress summary',
      message: error.message
    });
  }
};

/**
 * Get NOCS breakdown for RC In Progress
 * Returns count and analytics by NOCS for charts
 *
 * @route GET /api/rc-progress/by-nocs
 */
const getRCInProgressByNOCS = async (req, res) => {
  try {
    const cacheKey = 'rc_progress:by_nocs';

    // Check cache (1 minute TTL)
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Execute NOCS breakdown report
    const result = await reportsService.executeReport('rc_in_progress_by_nocs');
    const data = result || [];  // result is already the rows array

    const response = {
      success: true,
      data: data.map(row => ({
        nocs: row.NOCS_NAME,
        count: row.COUNT || 0,
        stuckCount: row.STUCK_COUNT || 0,
        avgMinutes: parseFloat(row.AVG_MINUTES || 0)
      })),
      timestamp: new Date().toISOString()
    };

    // Cache for 1 minute
    cacheService.set(cacheKey, response, 60 * 1000);

    res.json(response);
  } catch (error) {
    console.error('Error fetching RC In Progress by NOCS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RC In Progress by NOCS',
      message: error.message
    });
  }
};

/**
 * Export RC In Progress with customer details
 * Creates Excel file with enriched customer information
 *
 * @route GET /api/rc-progress/export
 * @query format - 'excel' or 'csv' (default: excel)
 */
const exportRCInProgressWithCustomerDetails = async (req, res) => {
  try {
    const format = req.query.format || 'excel';

    // Get RC In Progress detailed data
    const rcResult = await reportsService.executeReport('rc_in_progress_detailed');
    const rcData = rcResult || [];  // executeReport returns rows array directly

    console.log(`Exporting ${rcData.length} RC In Progress records with customer details...`);

    // Enrich each record with customer details
    const enrichedData = [];
    for (const record of rcData) {
      try {
        // Get customer details for this meter
        const customerResult = await reportsService.executeReport(
          'customer_details_by_meter',
          { meter_no: record.METER_NUMBER }
        );

        const customerDetails = customerResult && customerResult.length > 0
          ? customerResult[0]  // customerResult is already the rows array
          : {};

        // Merge RC data with customer details
        enrichedData.push({
          // RC Command Info
          METER_NUMBER: record.METER_NUMBER,
          CUSTOMER_ID: record.CUSTOMER_ID,
          COMMAND_TYPE: record.COMMAND_TYPE,
          COMMAND_STATUS: record.COMMAND_STATUS,
          TRIGGER_TIME: record.TRIGGER_TIME,
          HOURS_ELAPSED: record.HOURS_ELAPSED,
          MINUTES_ELAPSED: record.MINUTES_ELAPSED,
          DURATION_STATUS: record.DURATION_STATUS,
          PAYOFF_BALANCE: record.PAYOFF_BALANCE,
          COMMAND_ID: record.COMMAND_ID,

          // Customer Details (enriched)
          CUSTOMER_NO: customerDetails.CUSTOMER_NO || 'N/A',
          NOCS: customerDetails.NOCS || record.NOCS_NAME || 'N/A',
          FEEDER: customerDetails.FEEDER || 'N/A',
          FEEDER_DESCRIPTION: customerDetails.FEEDER_DESCRIPTION || 'N/A',
          ADDRESS: customerDetails.ADDRESS || 'N/A',
          PHONE_NO: customerDetails.PHONE_NO || 'N/A'
        });
      } catch (error) {
        console.error(`Error enriching meter ${record.METER_NUMBER}:`, error.message);
        // Add record without customer details
        enrichedData.push({
          ...record,
          CUSTOMER_NO: 'Error',
          FEEDER: 'Error',
          FEEDER_DESCRIPTION: 'Error',
          ADDRESS: 'Error',
          PHONE_NO: 'Error'
        });
      }
    }

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('RC In Progress');

      // Define columns
      worksheet.columns = [
        { header: 'Meter Number', key: 'METER_NUMBER', width: 15 },
        { header: 'Customer ID', key: 'CUSTOMER_ID', width: 15 },
        { header: 'Customer No', key: 'CUSTOMER_NO', width: 15 },
        { header: 'NOCS', key: 'NOCS', width: 20 },
        { header: 'Feeder', key: 'FEEDER', width: 15 },
        { header: 'Feeder Description', key: 'FEEDER_DESCRIPTION', width: 30 },
        { header: 'Address', key: 'ADDRESS', width: 50 },
        { header: 'Phone No', key: 'PHONE_NO', width: 15 },
        { header: 'Command Type', key: 'COMMAND_TYPE', width: 20 },
        { header: 'Command Status', key: 'COMMAND_STATUS', width: 15 },
        { header: 'Trigger Time', key: 'TRIGGER_TIME', width: 20 },
        { header: 'Hours Elapsed', key: 'HOURS_ELAPSED', width: 15 },
        { header: 'Minutes Elapsed', key: 'MINUTES_ELAPSED', width: 15 },
        { header: 'Duration Status', key: 'DURATION_STATUS', width: 15 },
        { header: 'Payoff Balance', key: 'PAYOFF_BALANCE', width: 15 },
        { header: 'Command ID', key: 'COMMAND_ID', width: 20 }
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Add data rows
      enrichedData.forEach(record => {
        const row = worksheet.addRow(record);

        // Color-code duration status
        const statusCell = row.getCell('DURATION_STATUS');
        switch (record.DURATION_STATUS) {
          case 'NORMAL':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
            break;
          case 'WARNING':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };
            break;
          case 'ALERT':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };
            break;
          case 'STUCK':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };
            statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            break;
        }
      });

      // Auto-filter
      worksheet.autoFilter = {
        from: 'A1',
        to: 'P1'
      };

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `RC_In_Progress_${timestamp}.xlsx`;

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

    } else if (format === 'csv') {
      // CSV Export
      const csv = [];

      // Header
      csv.push([
        'Meter Number', 'Customer ID', 'Customer No', 'NOCS', 'Feeder', 'Feeder Description',
        'Address', 'Phone No', 'Command Type', 'Command Status', 'Trigger Time',
        'Hours Elapsed', 'Minutes Elapsed', 'Duration Status', 'Payoff Balance', 'Command ID'
      ].join(','));

      // Data rows
      enrichedData.forEach(record => {
        csv.push([
          record.METER_NUMBER,
          record.CUSTOMER_ID,
          record.CUSTOMER_NO,
          `"${record.NOCS}"`,
          record.FEEDER,
          `"${record.FEEDER_DESCRIPTION}"`,
          `"${record.ADDRESS}"`,
          record.PHONE_NO,
          record.COMMAND_TYPE,
          record.COMMAND_STATUS,
          record.TRIGGER_TIME,
          record.HOURS_ELAPSED,
          record.MINUTES_ELAPSED,
          record.DURATION_STATUS,
          record.PAYOFF_BALANCE,
          record.COMMAND_ID
        ].join(','));
      });

      const csvContent = csv.join('\n');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `RC_In_Progress_${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid format. Use "excel" or "csv"'
      });
    }

  } catch (error) {
    console.error('Error exporting RC In Progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export RC In Progress data',
      message: error.message
    });
  }
};

/**
 * Export RC In Progress by NOCS (separate tabs for each NOCS)
 * Creates Excel file with one tab per NOCS
 *
 * @route GET /api/rc-progress/export-by-nocs
 * @query format - 'excel' only (default: excel)
 */
const exportRCInProgressByNOCSWithTabs = async (req, res) => {
  try {
    // Get RC In Progress detailed data
    const rcResult = await reportsService.executeReport('rc_in_progress_detailed');
    const rcData = rcResult || [];

    console.log(`Exporting ${rcData.length} RC In Progress records by NOCS...`);

    // Group data by NOCS
    const nocsGroups = {};
    rcData.forEach(record => {
      const nocs = record.NOCS_NAME || 'Unknown';
      if (!nocsGroups[nocs]) {
        nocsGroups[nocs] = [];
      }
      nocsGroups[nocs].push(record);
    });

    // Enrich each record with customer details
    const enrichedNocsGroups = {};
    for (const [nocs, records] of Object.entries(nocsGroups)) {
      enrichedNocsGroups[nocs] = [];

      for (const record of records) {
        try {
          const customerResult = await reportsService.executeReport(
            'customer_details_by_meter',
            { meter_no: record.METER_NUMBER }
          );

          const customerDetails = customerResult && customerResult.length > 0
            ? customerResult[0]
            : {};

          enrichedNocsGroups[nocs].push({
            METER_NUMBER: record.METER_NUMBER,
            CUSTOMER_ID: record.CUSTOMER_ID,
            CUSTOMER_NO: customerDetails.CUSTOMER_NO || 'N/A',
            NOCS: customerDetails.NOCS || record.NOCS_NAME || 'N/A',
            FEEDER: customerDetails.FEEDER || 'N/A',
            FEEDER_DESCRIPTION: customerDetails.FEEDER_DESCRIPTION || 'N/A',
            ADDRESS: customerDetails.ADDRESS || 'N/A',
            PHONE_NO: customerDetails.PHONE_NO || 'N/A',
            COMMAND_TYPE: record.COMMAND_TYPE,
            COMMAND_STATUS: record.COMMAND_STATUS,
            TRIGGER_TIME: record.TRIGGER_TIME,
            HOURS_ELAPSED: record.HOURS_ELAPSED,
            MINUTES_ELAPSED: record.MINUTES_ELAPSED,
            DURATION_STATUS: record.DURATION_STATUS,
            PAYOFF_BALANCE: record.PAYOFF_BALANCE,
            COMMAND_ID: record.COMMAND_ID
          });
        } catch (error) {
          console.error(`Error enriching meter ${record.METER_NUMBER}:`, error.message);
          enrichedNocsGroups[nocs].push({
            ...record,
            CUSTOMER_NO: 'Error',
            FEEDER: 'Error',
            FEEDER_DESCRIPTION: 'Error',
            ADDRESS: 'Error',
            PHONE_NO: 'Error'
          });
        }
      }
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();

    // Create a tab for each NOCS
    for (const [nocs, records] of Object.entries(enrichedNocsGroups)) {
      // Sanitize sheet name (Excel sheet names can't contain: \ / * [ ] : ?)
      const sheetName = nocs.replace(/[\\\/\*\[\]:?]/g, '_').substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);

      // Define columns
      worksheet.columns = [
        { header: 'Meter Number', key: 'METER_NUMBER', width: 15 },
        { header: 'Customer ID', key: 'CUSTOMER_ID', width: 15 },
        { header: 'Customer No', key: 'CUSTOMER_NO', width: 15 },
        { header: 'NOCS', key: 'NOCS', width: 20 },
        { header: 'Feeder', key: 'FEEDER', width: 15 },
        { header: 'Feeder Description', key: 'FEEDER_DESCRIPTION', width: 30 },
        { header: 'Address', key: 'ADDRESS', width: 50 },
        { header: 'Phone No', key: 'PHONE_NO', width: 15 },
        { header: 'Command Type', key: 'COMMAND_TYPE', width: 20 },
        { header: 'Command Status', key: 'COMMAND_STATUS', width: 15 },
        { header: 'Trigger Time', key: 'TRIGGER_TIME', width: 20 },
        { header: 'Hours Elapsed', key: 'HOURS_ELAPSED', width: 15 },
        { header: 'Minutes Elapsed', key: 'MINUTES_ELAPSED', width: 15 },
        { header: 'Duration Status', key: 'DURATION_STATUS', width: 15 },
        { header: 'Payoff Balance', key: 'PAYOFF_BALANCE', width: 15 },
        { header: 'Command ID', key: 'COMMAND_ID', width: 20 }
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      // Add data rows
      records.forEach(record => {
        const row = worksheet.addRow(record);

        // Color-code duration status
        const statusCell = row.getCell('DURATION_STATUS');
        switch (record.DURATION_STATUS) {
          case 'NORMAL':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
            break;
          case 'WARNING':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };
            break;
          case 'ALERT':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };
            break;
          case 'STUCK':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };
            statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            break;
        }
      });

      // Auto-filter
      worksheet.autoFilter = {
        from: 'A1',
        to: 'P1'
      };
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `RC_In_Progress_By_NOCS_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting RC In Progress by NOCS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export RC In Progress by NOCS',
      message: error.message
    });
  }
};

/**
 * Export filtered RC In Progress data
 * Accepts filter parameters and exports only matching records
 *
 * @route POST /api/rc-progress/export-filtered
 * @body meterNumbers - Array of meter numbers to export
 */
const exportFilteredRCInProgress = async (req, res) => {
  try {
    const { meterNumbers } = req.body;

    if (!meterNumbers || !Array.isArray(meterNumbers) || meterNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No meter numbers provided for export'
      });
    }

    console.log(`Exporting ${meterNumbers.length} filtered RC In Progress records...`);

    // Get all RC In Progress data
    const rcResult = await reportsService.executeReport('rc_in_progress_detailed');
    const rcData = rcResult || [];

    // Filter to only requested meters
    const filteredData = rcData.filter(record =>
      meterNumbers.includes(record.METER_NUMBER)
    );

    // Enrich with customer details
    const enrichedData = [];
    for (const record of filteredData) {
      try {
        const customerResult = await reportsService.executeReport(
          'customer_details_by_meter',
          { meter_no: record.METER_NUMBER }
        );

        const customerDetails = customerResult && customerResult.length > 0
          ? customerResult[0]
          : {};

        enrichedData.push({
          METER_NUMBER: record.METER_NUMBER,
          CUSTOMER_ID: record.CUSTOMER_ID,
          CUSTOMER_NO: customerDetails.CUSTOMER_NO || 'N/A',
          NOCS: customerDetails.NOCS || record.NOCS_NAME || 'N/A',
          FEEDER: customerDetails.FEEDER || 'N/A',
          FEEDER_DESCRIPTION: customerDetails.FEEDER_DESCRIPTION || 'N/A',
          ADDRESS: customerDetails.ADDRESS || 'N/A',
          PHONE_NO: customerDetails.PHONE_NO || 'N/A',
          COMMAND_TYPE: record.COMMAND_TYPE,
          COMMAND_STATUS: record.COMMAND_STATUS,
          TRIGGER_TIME: record.TRIGGER_TIME,
          HOURS_ELAPSED: record.HOURS_ELAPSED,
          MINUTES_ELAPSED: record.MINUTES_ELAPSED,
          DURATION_STATUS: record.DURATION_STATUS,
          PAYOFF_BALANCE: record.PAYOFF_BALANCE,
          COMMAND_ID: record.COMMAND_ID
        });
      } catch (error) {
        console.error(`Error enriching meter ${record.METER_NUMBER}:`, error.message);
      }
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Filtered RC In Progress');

    // Define columns
    worksheet.columns = [
      { header: 'Meter Number', key: 'METER_NUMBER', width: 15 },
      { header: 'Customer ID', key: 'CUSTOMER_ID', width: 15 },
      { header: 'Customer No', key: 'CUSTOMER_NO', width: 15 },
      { header: 'NOCS', key: 'NOCS', width: 20 },
      { header: 'Feeder', key: 'FEEDER', width: 15 },
      { header: 'Feeder Description', key: 'FEEDER_DESCRIPTION', width: 30 },
      { header: 'Address', key: 'ADDRESS', width: 50 },
      { header: 'Phone No', key: 'PHONE_NO', width: 15 },
      { header: 'Command Type', key: 'COMMAND_TYPE', width: 20 },
      { header: 'Command Status', key: 'COMMAND_STATUS', width: 15 },
      { header: 'Trigger Time', key: 'TRIGGER_TIME', width: 20 },
      { header: 'Hours Elapsed', key: 'HOURS_ELAPSED', width: 15 },
      { header: 'Minutes Elapsed', key: 'MINUTES_ELAPSED', width: 15 },
      { header: 'Duration Status', key: 'DURATION_STATUS', width: 15 },
      { header: 'Payoff Balance', key: 'PAYOFF_BALANCE', width: 15 },
      { header: 'Command ID', key: 'COMMAND_ID', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Add data rows
    enrichedData.forEach(record => {
      const row = worksheet.addRow(record);

      // Color-code duration status
      const statusCell = row.getCell('DURATION_STATUS');
      switch (record.DURATION_STATUS) {
        case 'NORMAL':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
          break;
        case 'WARNING':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };
          break;
        case 'ALERT':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };
          break;
        case 'STUCK':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };
          statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          break;
      }
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'P1'
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `RC_In_Progress_Filtered_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting filtered RC In Progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export filtered RC In Progress data',
      message: error.message
    });
  }
};

module.exports = {
  getRCInProgressDetailed,
  getRCInProgressSummary,
  getRCInProgressByNOCS,
  exportRCInProgressWithCustomerDetails,
  exportRCInProgressByNOCSWithTabs,
  exportFilteredRCInProgress
};
