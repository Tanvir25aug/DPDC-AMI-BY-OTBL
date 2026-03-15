const express = require('express');
const router = express.Router();
const { getPageAccess, updateBulkPageAccess } = require('../controllers/page-access.controller');
const { authenticate, checkPermission } = require('../middleware/auth');

// GET  /api/page-access       — all authenticated users
router.get('/', authenticate, getPageAccess);

// PUT  /api/page-access/bulk  — admin only
router.put('/bulk', authenticate, checkPermission('can_manage_users'), updateBulkPageAccess);

module.exports = router;
