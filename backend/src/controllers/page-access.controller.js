const { PageAccessConfig } = require('../models');

// Default page access config — seeded automatically if the table is empty
const DEFAULT_PAGES = [
  { route_name: 'rc-dc-dashboard',       page_name: 'RC/DC Monitor',            page_group: 'Main',               allowed_roles: ['admin', 'power_user', 'user', 'viewer'], sort_order: 1  },
  { route_name: 'rc-in-progress',        page_name: 'RC In Progress',           page_group: 'Main',               allowed_roles: ['admin', 'power_user', 'user', 'viewer'], sort_order: 2  },
  { route_name: 'ami-operational',       page_name: 'AMI Operational',          page_group: 'Main',               allowed_roles: ['admin'],                                 sort_order: 3  },
  { route_name: 'meter-wise-report',     page_name: 'Meter Report',             page_group: 'Main',               allowed_roles: ['admin', 'power_user', 'user'],            sort_order: 4  },
  { route_name: 'reports',               page_name: 'Reports',                  page_group: 'Main',               allowed_roles: ['admin'],                                 sort_order: 5  },
  { route_name: 'nocs-balance-summary',  page_name: 'NOCS Balance',             page_group: 'NOCS',               allowed_roles: ['admin', 'power_user', 'user', 'viewer'], sort_order: 6  },
  { route_name: 'nocs-customer-payoff',  page_name: 'NOCS Customer Payoff',     page_group: 'NOCS',               allowed_roles: ['admin', 'power_user', 'user'],            sort_order: 7  },
  { route_name: 'customer-billing-details', page_name: 'Customer Billing',      page_group: 'Customer',           allowed_roles: ['admin', 'power_user', 'user'],            sort_order: 8  },
  { route_name: 'customer-details',      page_name: 'Customer Details',         page_group: 'Customer',           allowed_roles: ['admin', 'power_user', 'user'],            sort_order: 9  },
  { route_name: 'crp-cpc',               page_name: 'CRP-CPC',                  page_group: 'Customer',           allowed_roles: ['admin', 'power_user', 'user'],            sort_order: 10 },
  { route_name: 'bill-stop',             page_name: 'Bill Stop',                page_group: 'Customer',           allowed_roles: ['admin', 'power_user', 'user'],            sort_order: 11 },
  { route_name: 'bank-wise-collection',  page_name: 'Bank Wise Collection',     page_group: 'Collection & Vending', allowed_roles: ['admin', 'power_user', 'user'],          sort_order: 12 },
  { route_name: 'bank-reconciliation',   page_name: 'Bank Reconciliation',      page_group: 'Collection & Vending', allowed_roles: ['admin', 'power_user', 'user'],          sort_order: 13 },
  { route_name: 'nocs-collection-summary', page_name: 'NOCS Collection Summary', page_group: 'Collection & Vending', allowed_roles: ['admin', 'power_user', 'user'],        sort_order: 14 },
  { route_name: 'nocs-meter-installation', page_name: 'NOCS Meter Installation', page_group: 'Collection & Vending', allowed_roles: ['admin', 'power_user', 'user'],        sort_order: 15 },
  { route_name: 'query-history',         page_name: 'Query History',            page_group: 'Admin',              allowed_roles: ['admin'],                                 sort_order: 16 },
];

/**
 * GET /api/page-access
 * Returns all page access configs. Auto-seeds defaults on first call.
 * Available to all authenticated users (they need it to determine navigation).
 */
const getPageAccess = async (req, res) => {
  try {
    let configs = await PageAccessConfig.findAll({ order: [['sort_order', 'ASC']] });

    if (configs.length === 0) {
      await PageAccessConfig.bulkCreate(DEFAULT_PAGES, { ignoreDuplicates: true });
      configs = await PageAccessConfig.findAll({ order: [['sort_order', 'ASC']] });
    }

    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/page-access/bulk
 * Admin only. Updates allowed_roles for multiple pages at once.
 * Body: { pages: [{ route_name, allowed_roles: ['admin', 'power_user', ...] }] }
 */
const updateBulkPageAccess = async (req, res) => {
  try {
    const { pages } = req.body;

    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ success: false, message: 'pages must be a non-empty array' });
    }

    for (const page of pages) {
      if (!page.route_name || !Array.isArray(page.allowed_roles)) continue;

      // Admin is always in allowed_roles — cannot be removed
      const finalRoles = page.allowed_roles.includes('admin')
        ? page.allowed_roles
        : ['admin', ...page.allowed_roles];

      await PageAccessConfig.update(
        { allowed_roles: finalRoles },
        { where: { route_name: page.route_name } }
      );
    }

    const configs = await PageAccessConfig.findAll({ order: [['sort_order', 'ASC']] });
    res.json({ success: true, data: configs, message: 'Page access updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPageAccess, updateBulkPageAccess };
