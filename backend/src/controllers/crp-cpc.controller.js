const reportsService = require('../services/reports.service');
const cacheService = require('../services/cache.service');

/**
 * Get CRP-CPC List with Pagination and Search
 * Returns list of CRP customers with their CPC counts and billing status
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 100, max: 1000)
 * @param {string} search - Search term for CRP account, customer ID, or name
 */
const getCRPCPCList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 500); // Reduced from 100 to 50 default
    const search = req.query.search || null;
    const offset = (page - 1) * limit;

    // Create cache key based on params
    const cacheKey = `crp_cpc_list:page:${page}:limit:${limit}:search:${search || 'all'}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      console.log(`[CRP-CPC Controller] Returning cached data for page ${page}`);
      return res.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get total count
    const countCacheKey = `crp_cpc_count:search:${search || 'all'}`;
    let totalCount = cacheService.get(countCacheKey);

    if (!totalCount) {
      const countResult = await reportsService.executeReport(
        'crp_cpc_list_count',
        { search }
      );
      totalCount = countResult[0]?.TOTAL || countResult[0]?.total || 0;
      cacheService.set(countCacheKey, totalCount, 30 * 60 * 1000); // Cache for 30 minutes (increased from 5)
    }

    // Get paginated data
    const data = await reportsService.executeReport(
      'crp_cpc_list',
      { search, limit, offset }
    );

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
      }
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
 * Clear CRP-CPC cache
 * Admin endpoint to clear cache manually
 */
const clearCache = async (req, res) => {
  try {
    // Clear all CRP-CPC related cache entries
    const cacheKeys = cacheService.keys();
    const crpCpcKeys = cacheKeys.filter(key =>
      key.startsWith('crp_cpc_') || key.startsWith('cpc_details_')
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

module.exports = {
  getCRPCPCList,
  getCPCDetails,
  clearCache
};
