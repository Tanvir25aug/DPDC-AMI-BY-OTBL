#!/bin/bash
# ========================================
# Production Deployment - SCP Upload Script
# ========================================

SERVER_USER="oculin"
SERVER_IP="172.18.42.200"
SERVER_PATH="/home/oculin/DPDC-AMI-BY-OTBL"

echo ""
echo "========================================"
echo "Uploading files to production server..."
echo "Server: $SERVER_IP"
echo "========================================"
echo ""

# Upload backend services
echo "📤 Uploading backend services..."
scp backend/src/services/batch-monitoring.service.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/services/
scp backend/src/services/teams.service.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/services/

# Upload schedulers
echo "📤 Uploading schedulers..."
scp backend/src/schedulers/batch-monitoring.scheduler.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/schedulers/
scp backend/src/schedulers/teams-reports.scheduler.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/schedulers/

# Upload config
echo "📤 Uploading config..."
scp backend/src/config/teams-webhooks.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/config/

# Upload controllers and routes
echo "📤 Uploading controllers and routes..."
scp backend/src/controllers/ami-operational.controller.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/controllers/
scp backend/src/routes/ami-operational.routes.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/routes/

# Upload migrations
echo "📤 Uploading migrations..."
scp backend/migrations/create_batch_monitoring_history.sql $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/migrations/

# Upload server.js
echo "📤 Uploading server.js..."
scp backend/src/server.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/src/

# Upload package files
echo "📤 Uploading package files..."
scp backend/package.json $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/
scp backend/package-lock.json $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/

# Upload test and setup scripts
echo "📤 Uploading scripts..."
scp backend/TEST_TEAMS_REPORTS.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/
scp backend/SETUP_MONITORING_TABLE.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/
scp backend/CHECK_STATUS_VALUES.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/
scp backend/CHECK_TABLE_STRUCTURE.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/
scp backend/FIND_ORACLE_TABLES.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/

# Upload frontend files
echo "📤 Uploading frontend files..."
scp frontend/src/views/AMIOperationalView.vue $SERVER_USER@$SERVER_IP:$SERVER_PATH/frontend/src/views/
scp frontend/src/services/ami-operational.api.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/frontend/src/services/

# Upload documentation
echo "📤 Uploading documentation..."
scp PRODUCTION_DEPLOYMENT_GUIDE.md $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo ""
echo "✅ Upload complete!"
echo ""
echo "========================================"
echo "Next steps on production server:"
echo "========================================"
echo "ssh $SERVER_USER@$SERVER_IP"
echo "cd $SERVER_PATH/backend"
echo "npm install"
echo "node SETUP_MONITORING_TABLE.js"
echo "pm2 restart dpdc-ami-backend"
echo "pm2 logs dpdc-ami-backend"
echo "========================================"
echo ""
