const reportsService = require('../services/reports.service');
const realtimeService = require('../services/realtime.service');
const pdfService = require('../services/pdf.service');
const cacheService = require('../services/cache.service');
const nocsBalanceScheduler = require('../services/nocs-balance-scheduler.service');

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

/**
 * Get Bank Wise Collection Report
 * Returns collection summary grouped by bank/payment tender type
 * Query parameters: startDate, endDate (format: DD-MON-YYYY)
 */
const getBankWiseCollection = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required (format: DD-MON-YYYY)'
      });
    }

    const data = await reportsService.executeReport('bank_wise_collection', {
      startDate,
      endDate
    });

    res.json({
      success: true,
      data,
      count: data.length,
      parameters: { startDate, endDate },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getBankWiseCollection:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank-wise collection data',
      error: error.message
    });
  }
};

/**
 * Get Bank Reconciliation Data
 * Returns detailed payment transactions for bank reconciliation
 * Query parameters: startDate, endDate, bankCode (optional)
 */
const getBankReconciliationData = async (req, res) => {
  try {
    const { startDate, endDate, bankCode } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required (format: DD-MON-YYYY)'
      });
    }

    const data = await reportsService.executeReport('bank_reconciliation_data', {
      startDate,
      endDate,
      bankCode: bankCode || null
    });

    res.json({
      success: true,
      data,
      count: data.length,
      parameters: { startDate, endDate, bankCode: bankCode || 'All Banks' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getBankReconciliationData:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank reconciliation data',
      error: error.message
    });
  }
};

/**
 * Get NOCS Collection Summary Report
 * Returns collection summary grouped by NOCS area
 * Query parameters: startDate, endDate (format: DD-MON-YYYY)
 */
const getNocsCollectionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required (format: DD-MON-YYYY)'
      });
    }

    const data = await reportsService.executeReport('nocs_collection_summary', {
      startDate,
      endDate
    });

    res.json({
      success: true,
      data,
      count: data.length,
      parameters: { startDate, endDate },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getNocsCollectionSummary:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch NOCS collection summary',
      error: error.message
    });
  }
};

/**
 * Get Customer Billing Details
 * Returns comprehensive billing data with daily charges and meter readings
 * Query parameters: custId (required)
 */
const getCustomerBillingDetails = async (req, res) => {
  try {
    const { custId, startDate, endDate } = req.query;

    if (!custId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID (custId) is required'
      });
    }

    console.log('[Reports Controller] Fetching billing details for customer:', custId,
                'Date range:', startDate || 'all', 'to', endDate || 'all');

    // Prepare bind parameters
    const bindParams = {
      custId,
      startDate: startDate || null,
      endDate: endDate || null
    };

    // Execute billing query with no row limit (fetch all data)
    const billingData = await reportsService.executeReport('customer_billing_details', bindParams, { maxRows: 0 });

    // Execute customer info query
    const customerInfo = await reportsService.executeReport('customer_additional_info', {
      custId
    });

    // Add meter number from billing data (first record)
    if (customerInfo[0] && billingData.length > 0) {
      customerInfo[0].METER_NO = billingData[0].MSN;
    }

    // Process data for monthly aggregation
    const monthlyData = aggregateMonthlyBilling(billingData);

    // Calculate analytics
    const analytics = calculateBillingAnalytics(billingData, monthlyData);

    res.json({
      success: true,
      customerInfo: customerInfo[0] || null,
      dailyBilling: billingData,
      monthlyBilling: monthlyData,
      analytics,
      counts: {
        dailyRecords: billingData.length,
        monthlyRecords: monthlyData.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getCustomerBillingDetails:', error);
    console.error('[Reports Controller] Error details:', {
      message: error.message,
      code: error.code,
      offset: error.offset,
      custId,
      startDate,
      endDate
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer billing details',
      error: error.message,
      errorCode: error.code,
      errorOffset: error.offset
    });
  }
};

/**
 * Helper: Aggregate daily billing into monthly totals
 */
function aggregateMonthlyBilling(dailyData) {
  const monthlyMap = new Map();

  dailyData.forEach(record => {
    // Use START_DT to determine which month the billing record belongs to
    const startDate = new Date(record.START_DT);
    const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        MONTH: monthKey,
        YEAR: startDate.getFullYear(),
        MONTH_NAME: startDate.toLocaleString('en-US', { month: 'long' }),
        TOTAL_CHARGES: 0,
        TOTAL_CONSUMPTION: 0,
        BILLING_DAYS: 0,
        START_DATE: record.START_DT,
        END_DATE: record.END_DT,
        RECORDS_COUNT: 0
      });
    }

    const monthData = monthlyMap.get(monthKey);
    monthData.TOTAL_CHARGES += parseFloat(record.DAILY_CHARGES || 0);
    monthData.TOTAL_CONSUMPTION += parseFloat(record.QUANTITY || 0);
    monthData.BILLING_DAYS += 1;
    monthData.RECORDS_COUNT += 1;

    // Update start date to earliest in the month
    if (new Date(record.START_DT) < new Date(monthData.START_DATE)) {
      monthData.START_DATE = record.START_DT;
    }

    // Update end date to latest in the month
    if (new Date(record.END_DT) > new Date(monthData.END_DATE)) {
      monthData.END_DATE = record.END_DT;
    }
  });

  return Array.from(monthlyMap.values()).sort((a, b) => a.MONTH.localeCompare(b.MONTH));
}

/**
 * Helper: Calculate billing analytics
 */
function calculateBillingAnalytics(dailyData, monthlyData) {
  if (!dailyData || dailyData.length === 0) {
    return {
      totalConsumption: 0,
      totalCharges: 0,
      averageDailyConsumption: 0,
      averageDailyCharges: 0,
      averageMonthlyConsumption: 0,
      averageMonthlyCharges: 0,
      highestDailyCharge: 0,
      lowestDailyCharge: 0,
      currentBalance: 0
    };
  }

  const totalConsumption = dailyData.reduce((sum, r) => sum + parseFloat(r.QUANTITY || 0), 0);
  const totalCharges = dailyData.reduce((sum, r) => sum + parseFloat(r.DAILY_CHARGES || 0), 0);
  const currentBalance = dailyData[dailyData.length - 1]?.PAYOFF_BAL || 0;

  const dailyCharges = dailyData.map(r => parseFloat(r.DAILY_CHARGES || 0));
  const highestDailyCharge = Math.max(...dailyCharges);
  const lowestDailyCharge = Math.min(...dailyCharges.filter(c => c > 0));

  return {
    totalConsumption: Math.round(totalConsumption * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
    averageDailyConsumption: Math.round((totalConsumption / dailyData.length) * 100) / 100,
    averageDailyCharges: Math.round((totalCharges / dailyData.length) * 100) / 100,
    averageMonthlyConsumption: monthlyData.length > 0
      ? Math.round((totalConsumption / monthlyData.length) * 100) / 100
      : 0,
    averageMonthlyCharges: monthlyData.length > 0
      ? Math.round((totalCharges / monthlyData.length) * 100) / 100
      : 0,
    highestDailyCharge: Math.round(highestDailyCharge * 100) / 100,
    lowestDailyCharge: lowestDailyCharge === Infinity ? 0 : Math.round(lowestDailyCharge * 100) / 100,
    currentBalance: Math.round(parseFloat(currentBalance) * -1 * 100) / 100
  };
}

/**
 * Get Customer Details (New Page)
 * Search by Customer ID or Meter Number
 * Returns customer info, billing history, and recharge history
 */
const getCustomerDetails = async (req, res) => {
  try {
    const { searchValue, startDate, endDate, fetchAll } = req.query;

    if (!searchValue) {
      return res.status(400).json({
        success: false,
        message: 'Search value (Customer ID or Meter Number) is required'
      });
    }

    console.log('[Reports Controller] Fetching customer details for:', searchValue);

    // 1. Try to find customer by ID first (fast path - dedicated query)
    let customerData = await reportsService.executeReport('customer_details_search', {
      searchValue
    });

    // 2. If not found, try meter number search (optimized single query)
    if (!customerData || customerData.length === 0) {
      console.log('[Reports Controller] Customer ID not found, trying meter number search...');

      customerData = await reportsService.executeReport('customer_search_by_meter', {
        meterNumber: searchValue
      });

      if (customerData && customerData.length > 0) {
        console.log('[Reports Controller] Found customer via meter number');
      }
    }

    // 3. If still not found, return 404
    if (!customerData || customerData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customer = customerData[0];
    const saId = customer.SA_ID;
    const custId = customer.CUSTOMER_ID;

    // 2. Get billing data
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Default: Current month daily + Last 12 months monthly
    let dailyStartDate = null;
    let monthlyStartDate = null;

    if (!fetchAll || fetchAll === 'false') {
      // Current month daily
      dailyStartDate = new Date(currentYear, currentMonth, 1);
      // Last 12 months
      monthlyStartDate = new Date(currentYear, currentMonth - 11, 1);
    }

    const billingParams = {
      custId,
      startDate: startDate || (dailyStartDate ? formatDateForOracle(dailyStartDate) : null),
      endDate: endDate || null
    };

    const billingData = await reportsService.executeReport('customer_billing_details', billingParams, { maxRows: 0 });

    // Add meter number from billing data if available
    if (billingData && billingData.length > 0 && billingData[0].MSN) {
      customer.METER_NO = billingData[0].MSN;

      // Get meter status
      try {
        const meterStatusData = await reportsService.executeReport('meter_status_lookup', {
          meterNumber: billingData[0].MSN
        });
        if (meterStatusData && meterStatusData.length > 0) {
          customer.METER_STATUS = meterStatusData[0].METER_STATUS || 'Unknown';
        } else {
          customer.METER_STATUS = 'Unknown';
        }
      } catch (err) {
        console.error('[Reports Controller] Error fetching meter status:', err);
        customer.METER_STATUS = 'Unknown';
      }
    } else {
      customer.METER_STATUS = 'N/A';
    }

    // 3. Get recharge history
    const rechargeHistory = await reportsService.executeReport('customer_recharge_history', {
      saId
    });

    // 4. Aggregate data
    const monthlyData = aggregateMonthlyBilling(billingData);
    const analytics = calculateBillingAnalytics(billingData, monthlyData);

    res.json({
      success: true,
      customer,
      dailyBilling: billingData,
      monthlyBilling: monthlyData,
      rechargeHistory,
      analytics,
      counts: {
        dailyRecords: billingData.length,
        monthlyRecords: monthlyData.length,
        rechargeRecords: rechargeHistory.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getCustomerDetails:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message
    });
  }
};

/**
 * Get NOCS Balance Summary (Ultra Fast - Cached in PostgreSQL)
 * Returns cached balance summary for all NOCS areas
 * Data is refreshed hourly by background scheduler
 * Performance: <0.1 seconds (serves from PostgreSQL cache)
 *
 * Cache Strategy:
 * - Query runs hourly in background (takes 5-10 min for 3 lakh customers)
 * - Results cached in PostgreSQL database (NOT in Oracle database)
 * - Users get instant response from PostgreSQL cache
 * - No writes to Oracle database (read-only access)
 * - Cache survives server restarts
 */
const getNocsBalanceSummary = async (req, res) => {
  try {
    console.log('[Reports Controller] Fetching NOCS balance summary from PostgreSQL cache...');

    // Check if manual refresh requested
    const forceRefresh = req.query.refresh === 'true';

    let cachedData;
    if (forceRefresh) {
      console.log('[Reports Controller] Manual refresh requested...');
      cachedData = await nocsBalanceScheduler.forceRefresh();
    } else {
      cachedData = await nocsBalanceScheduler.getCachedData();
    }

    if (!cachedData) {
      // Cache miss - data is being refreshed
      return res.status(202).json({
        success: false,
        message: 'NOCS balance data is being calculated. Please try again in a few moments.',
        refreshing: true,
        estimatedWaitTime: '5-10 minutes',
        note: 'Initial data load takes 5-10 minutes for 3 lakh customers. Subsequent requests will be instant.'
      });
    }

    console.log(`[Reports Controller] Retrieved ${cachedData.count} NOCS balance records from cache`);

    // Transform data to match frontend expectations (uppercase field names)
    const transformedData = cachedData.data.map(row => ({
      NOCS_NAME: row.nocs_name,
      NOCS_CODE: row.nocs_code?.trim(), // Remove trailing spaces
      TOTAL_CUSTOMERS: row.total_customers,
      CREDIT_QTY: row.credit_qty,
      CREDIT_BALANCE_AMT: parseFloat(row.credit_balance_amt) || 0,
      DUE_QTY: row.due_qty,
      DUE_BALANCE_AMT: parseFloat(row.due_balance_amt) || 0,
      NET_BALANCE: parseFloat(row.net_balance) || 0
    }));

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      lastUpdated: cachedData.lastUpdated,
      ageMinutes: cachedData.ageMinutes,
      source: cachedData.source,
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error in getNocsBalanceSummary:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch NOCS balance summary',
      error: error.message
    });
  }
};

/**
 * Get NOCS Customer Payoff Balance
 * Returns customer-wise payoff balance for a specific NOCS
 * Ordered by payoff balance (highest to lowest)
 * @param {string} nocsCode - NOCS code from route parameter
 */
const getNocsCustomerPayoff = async (req, res) => {
  const startTime = Date.now();
  try {
    const { nocsCode } = req.params;

    if (!nocsCode) {
      return res.status(400).json({
        success: false,
        message: 'NOCS code is required'
      });
    }

    // Trim NOCS code to handle trailing spaces
    const trimmedNocsCode = nocsCode.trim();

    console.log('[Reports Controller] Fetching customer payoff data for NOCS:', trimmedNocsCode);

    // Execute query with NOCS code parameter (maxRows: 0 = fetch ALL customers)
    const data = await reportsService.executeReport('nocs_customer_payoff', {
      nocs_code: trimmedNocsCode
    }, { maxRows: 0 }); // Fetch all customers for this NOCS

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Reports Controller] Retrieved ${data.length} customers for NOCS ${trimmedNocsCode} in ${duration}s`);

    // Calculate summary statistics
    const withNames = data.filter(r => r.CUSTOMER_NAME && r.CUSTOMER_NAME !== r.CUSTOMER_ID).length;
    console.log(`[Reports Controller] Customers with names: ${withNames} (${data.length > 0 ? ((withNames / data.length) * 100).toFixed(1) : 0}%)`);

    res.json({
      success: true,
      data,
      count: data.length,
      nocsCode: trimmedNocsCode,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[Reports Controller] Error in getNocsCustomerPayoff after ${duration}s:`, error);
    console.error('[Reports Controller] Error details:', {
      message: error.message,
      code: error.code,
      offset: error.offset
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer payoff data',
      error: error.message,
      duration: `${duration}s`
    });
  }
};

// Helper: Format date for Oracle
function formatDateForOracle(date) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

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
  downloadNocsReportPDF,
  getBankWiseCollection,
  getBankReconciliationData,
  getNocsCollectionSummary,
  getCustomerBillingDetails, // Customer billing details
  getCustomerDetails, // NEW: Customer details page
  getNocsBalanceSummary, // NEW: NOCS balance summary (hourly cached)
  getNocsCustomerPayoff // NEW: Customer payoff balance by NOCS
};
