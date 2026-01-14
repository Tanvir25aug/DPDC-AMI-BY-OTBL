const reportsService = require('../services/reports.service');
const cacheService = require('../services/cache.service');
const pgPool = require('../config/postgresDB');

/**
 * Get CRP-CPC List with Pagination, Search, and Filters
 * Returns list of CRP customers with their CPC counts and billing status
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 100, max: 1000)
 * @param {string} search - Search term for CRP account, customer ID, or name
 * @param {string} filterConnectionCount - Filter by connection count range (0-10, 10-50, 50-100, 100+)
 * @param {string} filterBillStop - Filter by bill stop status (has-issues, no-issues)
 * @param {string} filterActiveBilling - Filter by active billing status (has-active, no-active)
 * @param {string} sortBy - Sort order (account-asc, account-desc, connections-asc, connections-desc, billstop-desc, active-desc)
 */
const getCRPCPCList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const search = req.query.search || null;
    const filterConnectionCount = req.query.filterConnectionCount || null;
    const filterBillStop = req.query.filterBillStop || null;
    const filterActiveBilling = req.query.filterActiveBilling || null;
    const sortBy = req.query.sortBy || 'account-asc';
    const offset = (page - 1) * limit;

    // Create cache key based on all params (normalized search for consistent caching)
    const normalizedSearch = search ? search.trim().toLowerCase() : 'all';
    const cacheKey = `crp_cpc_list:page:${page}:limit:${limit}:search:${normalizedSearch}:conn:${filterConnectionCount || 'all'}:billstop:${filterBillStop || 'all'}:active:${filterActiveBilling || 'all'}:sort:${sortBy}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      console.log(`[CRP-CPC Controller] Returning cached data for page ${page} with filters`);
      return res.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get the latest available batch date (fallback if today's batch hasn't run)
    let latestBatchDate;
    try {
      const batchDateResult = await pgPool.query(
        'SELECT batch_date FROM bill_stop_summary ORDER BY batch_date DESC LIMIT 1'
      );
      latestBatchDate = batchDateResult.rows[0]?.batch_date;
      console.log('[CRP-CPC Controller] Using batch date:', latestBatchDate);
    } catch (err) {
      console.error('[CRP-CPC Controller] Error getting latest batch date:', err);
      latestBatchDate = null;
    }

    // Build PostgreSQL WHERE clause for filters
    let pgWhereConditions = [];
    let pgParams = [];
    let paramIndex = 1;

    // Use latest batch date instead of CURRENT_DATE
    if (latestBatchDate) {
      pgWhereConditions.push(`batch_date = $${paramIndex}`);
      pgParams.push(latestBatchDate);
      paramIndex++;
    } else {
      // Fallback to CURRENT_DATE if no batch data found
      pgWhereConditions.push('batch_date = CURRENT_DATE');
    }

    // Apply Bill Stop Filter
    if (filterBillStop === 'has-issues') {
      pgWhereConditions.push(`bill_stop_count > 0`);
    } else if (filterBillStop === 'no-issues') {
      pgWhereConditions.push(`(bill_stop_count = 0 OR bill_stop_count IS NULL)`);
    }

    // Apply Active Billing Filter
    if (filterActiveBilling === 'has-active') {
      pgWhereConditions.push(`active_billing_count > 0`);
    } else if (filterActiveBilling === 'no-active') {
      pgWhereConditions.push(`(active_billing_count = 0 OR active_billing_count IS NULL)`);
    }

    // Apply Connection Count Filter
    if (filterConnectionCount) {
      switch (filterConnectionCount) {
        case '0-10':
          pgWhereConditions.push(`total_cpc_count < 10`);
          break;
        case '10-50':
          pgWhereConditions.push(`total_cpc_count >= 10 AND total_cpc_count <= 50`);
          break;
        case '50-100':
          pgWhereConditions.push(`total_cpc_count > 50 AND total_cpc_count <= 100`);
          break;
        case '100+':
          pgWhereConditions.push(`total_cpc_count > 100`);
          break;
      }
    }

    // Build PostgreSQL ORDER BY clause
    let pgOrderBy = 'crp_account_no ASC';
    switch (sortBy) {
      case 'account-asc':
        pgOrderBy = 'crp_account_no ASC';
        break;
      case 'account-desc':
        pgOrderBy = 'crp_account_no DESC';
        break;
      case 'connections-asc':
        pgOrderBy = 'total_cpc_count ASC';
        break;
      case 'connections-desc':
        pgOrderBy = 'total_cpc_count DESC';
        break;
      case 'billstop-desc':
        pgOrderBy = 'bill_stop_count DESC';
        break;
      case 'active-desc':
        pgOrderBy = 'active_billing_count DESC';
        break;
    }

    // Determine if we have filters that require PostgreSQL filtering
    const hasFilters = filterConnectionCount || filterBillStop || filterActiveBilling || (sortBy && sortBy !== 'account-asc');

    // Get filtered CRP accounts from PostgreSQL first (only if filters are active)
    let filteredCRPAccounts = [];
    let billStopMap = new Map();

    if (hasFilters) {
      try {
        const pgQuery = `
          SELECT
            crp_account_no,
            total_cpc_count,
            bill_stop_count,
            active_billing_count
          FROM bill_stop_summary
          WHERE ${pgWhereConditions.join(' AND ')}
          ORDER BY ${pgOrderBy}
        `;

        console.log('[CRP-CPC Controller] PostgreSQL Query:', pgQuery);
        console.log('[CRP-CPC Controller] Query Params:', pgParams);
        const billStopData = await pgPool.query(pgQuery, pgParams);

        // Build map and list of CRP accounts
        billStopData.rows.forEach(row => {
          filteredCRPAccounts.push(row.crp_account_no);
          billStopMap.set(row.crp_account_no, {
            billStopCount: parseInt(row.bill_stop_count) || 0,
            activeBillingCount: parseInt(row.active_billing_count) || 0,
            totalCpcCount: parseInt(row.total_cpc_count) || 0
          });
        });

        console.log(`[CRP-CPC Controller] Found ${filteredCRPAccounts.length} CRPs matching filters`);
      } catch (pgError) {
        console.error('[CRP-CPC Controller] Error filtering with PostgreSQL:', pgError);
        // Fall back to getting all CRPs without filters
        filteredCRPAccounts = null;
      }
    } else {
      // No filters active, will use Oracle search directly
      filteredCRPAccounts = null;
    }

    // If filters were applied and no CRPs match, return empty result
    if (filteredCRPAccounts && filteredCRPAccounts.length === 0) {
      const response = {
        data: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        batchInfo: latestBatchDate ? {
          batchDate: latestBatchDate,
          message: 'No matching records found in latest batch data'
        } : null
      };

      cacheService.set(cacheKey, response, 5 * 60 * 1000);

      return res.json({
        success: true,
        ...response,
        timestamp: new Date().toISOString()
      });
    }

    // Now get data from Oracle, filtered by the CRP accounts from PostgreSQL
    let data;
    let totalCount;

    if (filteredCRPAccounts && filteredCRPAccounts.length > 0) {
      // If search is also active, we need to filter the CRP list by search term
      if (search) {
        console.log(`[CRP-CPC Controller] Applying search "${search}" to ${filteredCRPAccounts.length} filtered CRPs`);

        // Build comma-separated list of all filtered CRPs
        const accountsParam = filteredCRPAccounts.join(',');

        // Query Oracle with both CRP list AND search term
        const searchFilteredData = await reportsService.executeReport(
          'crp_cpc_list_filtered_with_search',
          { crp_accounts: accountsParam, search }
        );

        console.log(`[CRP-CPC Controller] Search filtered ${filteredCRPAccounts.length} CRPs down to ${searchFilteredData.length} CRPs`);

        // Update filtered accounts list to only include search matches
        const searchMatchedAccounts = searchFilteredData.map(crp => crp.CRP_ACCOUNT_NO);
        filteredCRPAccounts = searchMatchedAccounts;
        totalCount = filteredCRPAccounts.length;

        // Apply pagination to search-filtered results
        const paginatedAccounts = filteredCRPAccounts.slice(offset, offset + limit);

        if (paginatedAccounts.length > 0) {
          const paginatedParam = paginatedAccounts.join(',');
          data = await reportsService.executeReport(
            'crp_cpc_list_filtered_with_search',
            { crp_accounts: paginatedParam, search }
          );
        } else {
          data = [];
        }
      } else {
        // No search, just apply pagination to filtered accounts
        const paginatedAccounts = filteredCRPAccounts.slice(offset, offset + limit);

        // Build Oracle query to get only these specific CRPs
        if (paginatedAccounts.length > 0) {
          const accountsParam = paginatedAccounts.join(',');
          data = await reportsService.executeReport(
            'crp_cpc_list_filtered',
            { crp_accounts: accountsParam }
          );
        } else {
          data = [];
        }

        totalCount = filteredCRPAccounts.length;
      }
    } else {
      // No filters applied, use original pagination query
      const countCacheKey = `crp_cpc_count:search:${search || 'all'}`;
      totalCount = cacheService.get(countCacheKey);

      if (!totalCount) {
        const countResult = await reportsService.executeReport(
          'crp_cpc_list_count',
          { search }
        );
        totalCount = countResult[0]?.TOTAL || countResult[0]?.total || 0;
        cacheService.set(countCacheKey, totalCount, 30 * 60 * 1000);
      }

      data = await reportsService.executeReport(
        'crp_cpc_list',
        { search, limit, offset }
      );

      // Enrich with bill stop data
      try {
        const crpAccounts = data.map(crp => crp.CRP_ACCOUNT_NO);

        if (crpAccounts.length > 0) {
          let billStopQuery;
          let billStopParams;

          if (latestBatchDate) {
            billStopQuery = `SELECT
              crp_account_no,
              total_cpc_count,
              bill_stop_count,
              active_billing_count
             FROM bill_stop_summary
             WHERE batch_date = $1
               AND crp_account_no = ANY($2)`;
            billStopParams = [latestBatchDate, crpAccounts];
          } else {
            billStopQuery = `SELECT
              crp_account_no,
              total_cpc_count,
              bill_stop_count,
              active_billing_count
             FROM bill_stop_summary
             WHERE batch_date = CURRENT_DATE
               AND crp_account_no = ANY($1)`;
            billStopParams = [crpAccounts];
          }

          const billStopData = await pgPool.query(billStopQuery, billStopParams);

          billStopData.rows.forEach(row => {
            billStopMap.set(row.crp_account_no, {
              billStopCount: parseInt(row.bill_stop_count) || 0,
              activeBillingCount: parseInt(row.active_billing_count) || 0
            });
          });
        }
      } catch (pgError) {
        console.error('[CRP-CPC Controller] Error fetching bill stop data:', pgError);
      }
    }

    // Enrich all data with bill stop information
    data.forEach(crp => {
      const billStop = billStopMap.get(crp.CRP_ACCOUNT_NO);
      if (billStop) {
        crp.BILL_STOP_COUNT = billStop.billStopCount;
        crp.ACTIVE_BILLING_COUNT = billStop.activeBillingCount;
        // Override total CPC count from PostgreSQL if available (more accurate)
        if (billStop.totalCpcCount) {
          crp.TOTAL_CPC_COUNT = billStop.totalCpcCount;
        }
      } else {
        crp.BILL_STOP_COUNT = 0;
        crp.ACTIVE_BILLING_COUNT = 0;
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    const response = {
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      batchInfo: latestBatchDate ? {
        batchDate: latestBatchDate,
        message: 'Data from latest batch job'
      } : null
    };

    // Cache the response for 15 minutes (increased from 2)
    cacheService.set(cacheKey, response, 15 * 60 * 1000);

    res.json({
      success: true,
      ...response,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRP-CPC Controller] Error in getCRPCPCList:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch CRP-CPC list',
      error: error.message
    });
  }
};

/**
 * Get CPC Details for a specific CRP
 * Returns all CPC (meters) under a CRP with customer information
 * @param {string} crpId - CRP Account ID
 */
const getCPCDetails = async (req, res) => {
  try {
    const { crpId } = req.params;

    if (!crpId) {
      return res.status(400).json({
        success: false,
        message: 'CRP ID is required'
      });
    }

    // Check cache first
    const cacheKey = `cpc_details:crp:${crpId}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      console.log(`[CRP-CPC Controller] Returning cached CPC details for CRP ${crpId}`);
      return res.json({
        success: true,
        data: cached,
        count: cached.length,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get CPC details
    const data = await reportsService.executeReport(
      'crp_cpc_details',
      { crpId }
    );

    // Cache the response for 5 minutes
    cacheService.set(cacheKey, data, 5 * 60 * 1000);

    res.json({
      success: true,
      data,
      count: data.length,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRP-CPC Controller] Error in getCPCDetails:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch CPC details',
      error: error.message
    });
  }
};

/**
 * Get CPC Count by NOCS for a specific CRP
 * Returns count of CPC customers grouped by NOCS area
 * @param {string} crpId - CRP Account ID
 */
const getCPCNocsSummary = async (req, res) => {
  try {
    const { crpId } = req.params;

    if (!crpId) {
      return res.status(400).json({
        success: false,
        message: 'CRP ID is required'
      });
    }

    // Check cache first
    const cacheKey = `cpc_nocs_summary:crp:${crpId}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      console.log(`[CRP-CPC Controller] Returning cached NOCS summary for CRP ${crpId}`);
      return res.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get NOCS summary
    const data = await reportsService.executeReport(
      'crp_cpc_nocs_summary',
      { crpId }
    );

    // Calculate total count
    const totalCount = data.reduce((sum, row) => sum + (row.CPC_COUNT || 0), 0);

    const response = {
      summary: data,
      totalCount
    };

    // Cache the response for 10 minutes
    cacheService.set(cacheKey, response, 10 * 60 * 1000);

    res.json({
      success: true,
      ...response,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRP-CPC Controller] Error in getCPCNocsSummary:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch CPC NOCS summary',
      error: error.message
    });
  }
};

/**
 * Get Bill Stop Analysis
 * Analyzes CPC customers to identify bill stop issues
 * Returns both summary (grouped by CRP) and detailed data
 */
const getBillStopAnalysis = async (req, res) => {
  try {
    console.log('[CRP-CPC Controller] Starting bill stop analysis...');

    // Get max rows parameter (default 10000 for safety)
    const maxRows = parseInt(req.query.maxRows) || 10000;

    // Check cache first (include maxRows in key)
    const cacheKey = `bill_stop_analysis:maxRows:${maxRows}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      console.log('[CRP-CPC Controller] Returning cached bill stop analysis');
      return res.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[CRP-CPC Controller] Using maxRows limit: ${maxRows}`);

    // Get summary data (grouped by CRP) - using simple version
    console.log('[CRP-CPC Controller] Fetching bill stop summary...');
    const summaryStartTime = Date.now();
    const summary = await reportsService.executeReport('crp_cpc_bill_stop_summary_simple', {});
    console.log(`[CRP-CPC Controller] Summary fetched in ${Date.now() - summaryStartTime}ms: ${summary.length} CRPs with bill stop issues`);

    // Get detailed data (only CPC customers with bill stop issues) - using simple version
    console.log('[CRP-CPC Controller] Fetching bill stop details...');
    const detailsStartTime = Date.now();

    // Set a timeout for the detailed query
    const detailsPromise = reportsService.executeReport('crp_cpc_bill_stop_analysis_simple', { maxRows: Math.min(maxRows, 5000) });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Details query timeout')), 45000) // 45 second timeout
    );

    let details = [];
    try {
      details = await Promise.race([detailsPromise, timeoutPromise]);
      console.log(`[CRP-CPC Controller] Details fetched in ${Date.now() - detailsStartTime}ms: ${details.length} CPC customers with bill stop issues`);
    } catch (timeoutError) {
      console.warn(`[CRP-CPC Controller] Details query timed out after ${Date.now() - detailsStartTime}ms, returning summary only`);
      details = []; // Return empty details if timeout
    }

    // Safety check for very large datasets
    if (details.length > 100000) {
      console.warn(`[CRP-CPC Controller] WARNING: Large dataset (${details.length} rows). Consider adding pagination.`);
    }

    // Calculate overall statistics from summary data
    const totalCRPs = summary.length;
    const totalCPCs = summary.reduce((sum, row) => sum + (row.TOTAL_CPC_COUNT || 0), 0);
    const totalBillStopIssues = summary.reduce((sum, row) => sum + (row.BILL_STOP_COUNT || 0), 0);
    const totalActiveBilling = summary.reduce((sum, row) => sum + (row.ACTIVE_BILLING_COUNT || 0), 0);

    const response = {
      summary,
      details,
      statistics: {
        totalCRPs,
        totalCPCs,
        totalBillStopIssues,
        totalActiveBilling,
        billStopPercentage: totalCPCs > 0 ? ((totalBillStopIssues / totalCPCs) * 100).toFixed(2) : 0
      },
      truncated: details.length >= Math.min(maxRows, 5000),
      detailsAvailable: details.length > 0,
      maxRows: Math.min(maxRows, 5000),
      note: details.length === 0
        ? 'Detailed data timed out. Showing summary only. Statistics are still accurate.'
        : details.length >= Math.min(maxRows, 5000)
        ? `Results limited to ${Math.min(maxRows, 5000)} rows for performance. Total bill stop issues may be higher.`
        : null
    };

    // Cache for 10 minutes
    cacheService.set(cacheKey, response, 10 * 60 * 1000);

    console.log(`[CRP-CPC Controller] Analysis complete: ${totalBillStopIssues} bill stop issues out of ${totalCPCs} total CPCs (${response.statistics.billStopPercentage}%)`);

    res.json({
      success: true,
      ...response,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRP-CPC Controller] Error in getBillStopAnalysis:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to analyze bill stop issues',
      error: error.message
    });
  }
};

/**
 * Clear CRP-CPC cache
 * Admin endpoint to clear cache manually
 */
const clearCache = async (req, res) => {
  try {
    // Clear all CRP-CPC related cache entries
    const cacheKeys = cacheService.keys();
    const crpCpcKeys = cacheKeys.filter(key =>
      key.startsWith('crp_cpc_') || key.startsWith('cpc_details_') || key.startsWith('cpc_nocs_') || key.startsWith('bill_stop_')
    );

    crpCpcKeys.forEach(key => cacheService.delete(key));

    res.json({
      success: true,
      message: 'CRP-CPC cache cleared successfully',
      clearedKeys: crpCpcKeys.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRP-CPC Controller] Error in clearCache:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
};

/**
 * Get Detailed CPC Export Data
 * Returns all CPC customers with full details for Excel export
 * Supports same filters as getCRPCPCList
 */
const getDetailedExport = async (req, res) => {
  try {
    const search = req.query.search || null;
    const filterConnectionCount = req.query.filterConnectionCount || null;
    const filterBillStop = req.query.filterBillStop || null;
    const filterActiveBilling = req.query.filterActiveBilling || null;
    const sortBy = req.query.sortBy || 'account-asc';
    const limit = Math.min(parseInt(req.query.limit) || 10000, 10000); // Max 10,000 for export

    console.log('[CRP-CPC Export] Getting detailed export with filters:', {
      search, filterConnectionCount, filterBillStop, filterActiveBilling, sortBy, limit
    });

    // Get latest batch date
    let latestBatchDate;
    try {
      const batchDateResult = await pgPool.query(
        'SELECT batch_date FROM bill_stop_summary ORDER BY batch_date DESC LIMIT 1'
      );
      latestBatchDate = batchDateResult.rows[0]?.batch_date;
    } catch (err) {
      console.error('[CRP-CPC Export] Error getting latest batch date:', err);
      latestBatchDate = null;
    }

    // Build PostgreSQL WHERE clause
    let pgWhereConditions = [];
    let pgParams = [];
    let paramIndex = 1;

    if (latestBatchDate) {
      pgWhereConditions.push(`batch_date = $${paramIndex}`);
      pgParams.push(latestBatchDate);
      paramIndex++;
    } else {
      pgWhereConditions.push('batch_date = CURRENT_DATE');
    }

    // Apply filters
    if (filterBillStop === 'has-issues') {
      pgWhereConditions.push(`bill_stop_count > 0`);
    } else if (filterBillStop === 'no-issues') {
      pgWhereConditions.push(`(bill_stop_count = 0 OR bill_stop_count IS NULL)`);
    }

    if (filterActiveBilling === 'has-active') {
      pgWhereConditions.push(`active_billing_count > 0`);
    } else if (filterActiveBilling === 'no-active') {
      pgWhereConditions.push(`(active_billing_count = 0 OR active_billing_count IS NULL)`);
    }

    if (filterConnectionCount) {
      switch (filterConnectionCount) {
        case '0-10':
          pgWhereConditions.push(`total_cpc_count < 10`);
          break;
        case '10-50':
          pgWhereConditions.push(`total_cpc_count >= 10 AND total_cpc_count <= 50`);
          break;
        case '50-100':
          pgWhereConditions.push(`total_cpc_count > 50 AND total_cpc_count <= 100`);
          break;
        case '100+':
          pgWhereConditions.push(`total_cpc_count > 100`);
          break;
      }
    }

    // Build ORDER BY clause
    let pgOrderBy = 'crp_account_no ASC';
    switch (sortBy) {
      case 'account-asc':
        pgOrderBy = 'crp_account_no ASC';
        break;
      case 'account-desc':
        pgOrderBy = 'crp_account_no DESC';
        break;
      case 'connections-asc':
        pgOrderBy = 'total_cpc_count ASC';
        break;
      case 'connections-desc':
        pgOrderBy = 'total_cpc_count DESC';
        break;
      case 'billstop-desc':
        pgOrderBy = 'bill_stop_count DESC';
        break;
      case 'active-desc':
        pgOrderBy = 'active_billing_count DESC';
        break;
    }

    // Determine if we have filters
    const hasFilters = filterConnectionCount || filterBillStop || filterActiveBilling || (sortBy && sortBy !== 'account-asc');

    let filteredCRPAccounts = [];

    if (hasFilters) {
      // Get filtered CRP accounts from PostgreSQL
      const pgQuery = `
        SELECT crp_account_no
        FROM bill_stop_summary
        WHERE ${pgWhereConditions.join(' AND ')}
        ORDER BY ${pgOrderBy}
        LIMIT ${limit}
      `;

      const billStopData = await pgPool.query(pgQuery, pgParams);
      filteredCRPAccounts = billStopData.rows.map(row => row.crp_account_no);
      console.log(`[CRP-CPC Export] Found ${filteredCRPAccounts.length} filtered CRPs`);
    }

    // Get CPC details for filtered CRPs
    let cpcDetails = [];

    if (hasFilters && filteredCRPAccounts.length > 0) {
      // Get CPC details for filtered CRPs
      if (search) {
        // Apply search filter too
        const accountsParam = filteredCRPAccounts.join(',');
        const searchFilteredCRPs = await reportsService.executeReport(
          'crp_cpc_list_filtered_with_search',
          { crp_accounts: accountsParam, search }
        );
        filteredCRPAccounts = searchFilteredCRPs.map(crp => crp.CRP_ACCOUNT_NO);
        console.log(`[CRP-CPC Export] After search filter: ${filteredCRPAccounts.length} CRPs`);
      }

      // Get CPC details for each CRP
      for (const crpId of filteredCRPAccounts) {
        const details = await reportsService.executeReport('crp_cpc_details', { crpId });
        details.forEach(cpc => {
          cpc.CRP_ACCOUNT_NO = crpId;
        });
        cpcDetails.push(...details);
      }
    } else {
      // No filters, get CRPs with search only
      let crpAccounts = [];

      if (search) {
        const searchResult = await reportsService.executeReport(
          'crp_cpc_list_count',
          { search }
        );
        const totalCount = searchResult[0]?.TOTAL || 0;

        const crpList = await reportsService.executeReport(
          'crp_cpc_list',
          { search, limit, offset: 0 }
        );
        crpAccounts = crpList.map(crp => crp.CRP_ACCOUNT_NO);
      } else {
        // Get first N CRPs
        const crpList = await reportsService.executeReport(
          'crp_cpc_list',
          { search: null, limit, offset: 0 }
        );
        crpAccounts = crpList.map(crp => crp.CRP_ACCOUNT_NO);
      }

      console.log(`[CRP-CPC Export] Getting CPC details for ${crpAccounts.length} CRPs`);

      // Get CPC details for each CRP
      for (const crpId of crpAccounts) {
        const details = await reportsService.executeReport('crp_cpc_details', { crpId });
        details.forEach(cpc => {
          cpc.CRP_ACCOUNT_NO = crpId;
        });
        cpcDetails.push(...details);
      }
    }

    console.log(`[CRP-CPC Export] Returning ${cpcDetails.length} CPC customer records`);

    res.json({
      success: true,
      data: cpcDetails,
      totalRecords: cpcDetails.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRP-CPC Export] Error in getDetailedExport:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to generate export data',
      error: error.message
    });
  }
};

module.exports = {
  getCRPCPCList,
  getCPCDetails,
  getCPCNocsSummary,
  getBillStopAnalysis,
  clearCache,
  getDetailedExport
};
