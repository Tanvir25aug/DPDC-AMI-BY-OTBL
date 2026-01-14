#!/bin/bash
# ========================================
# Production Deployment Script
# Run this script ON THE PRODUCTION SERVER
# ========================================

set -e  # Exit on any error

echo ""
echo "========================================"
echo "DPDC AMI - MS Teams Reports Deployment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$HOME/DPDC-AMI-BY-OTBL"
BACKUP_DIR="$HOME/DPDC-AMI-BY-OTBL-backup-$(date +%Y%m%d-%H%M%S)"

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Error: $APP_DIR not found${NC}"
    exit 1
fi

# Step 1: Backup
echo -e "${YELLOW}📦 Step 1: Creating backup...${NC}"
cp -r "$APP_DIR" "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
echo ""

# Step 2: Check if files were uploaded
echo -e "${YELLOW}📁 Step 2: Checking for updated files...${NC}"
cd "$APP_DIR/backend"

if [ ! -f "SETUP_MONITORING_TABLE.js" ]; then
    echo -e "${RED}❌ Error: Updated files not found!${NC}"
    echo "Please upload the files first using WinSCP or SCP"
    exit 1
fi
echo -e "${GREEN}✅ Files found${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Step 3: Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Setup PostgreSQL table
echo -e "${YELLOW}🗄️  Step 4: Setting up PostgreSQL table...${NC}"
node SETUP_MONITORING_TABLE.js
echo ""

# Step 5: Check webhook configuration
echo -e "${YELLOW}🔗 Step 5: Checking MS Teams webhook configuration...${NC}"
if grep -q "YOUR-PRODUCTION-WEBHOOK-URL" src/config/teams-webhooks.js; then
    echo -e "${RED}⚠️  WARNING: Webhook URLs not configured!${NC}"
    echo "Please update src/config/teams-webhooks.js with your production webhook URLs"
    echo ""
    echo "Run this command to edit:"
    echo "  nano $APP_DIR/backend/src/config/teams-webhooks.js"
    echo ""
    read -p "Press Enter after you've updated the webhooks, or Ctrl+C to exit..."
else
    echo -e "${GREEN}✅ Webhook configuration looks good${NC}"
fi
echo ""

# Step 6: Test MS Teams connection (optional)
echo -e "${YELLOW}🧪 Step 6: Test MS Teams connection? (optional)${NC}"
read -p "Run test? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node TEST_TEAMS_REPORTS.js
    echo ""
    read -p "Did you receive test messages in Teams? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}⚠️  Teams test failed. Check webhook configuration.${NC}"
        exit 1
    fi
fi
echo ""

# Step 7: Restart backend server
echo -e "${YELLOW}🔄 Step 7: Restarting backend server...${NC}"

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 restart dpdc-ami-backend || pm2 restart all
    echo ""
    sleep 3
    pm2 status
    echo ""
    echo -e "${GREEN}✅ Server restarted with PM2${NC}"
    echo ""
    echo "View logs with: pm2 logs dpdc-ami-backend"
else
    echo -e "${YELLOW}PM2 not found. Checking for systemd...${NC}"
    if systemctl is-active --quiet dpdc-ami-backend; then
        sudo systemctl restart dpdc-ami-backend
        sleep 3
        sudo systemctl status dpdc-ami-backend
        echo -e "${GREEN}✅ Server restarted with systemd${NC}"
    else
        echo -e "${RED}❌ Error: Could not find PM2 or systemd service${NC}"
        echo "Please restart your server manually"
        exit 1
    fi
fi
echo ""

# Step 8: Verify deployment
echo -e "${YELLOW}🔍 Step 8: Verifying deployment...${NC}"
echo ""

# Check PostgreSQL table
echo "Checking PostgreSQL table..."
if psql -U postgres -d dpdc_ami_users -c "\dt batch_monitoring_history" &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL table exists${NC}"
else
    echo -e "${RED}⚠️  Could not verify PostgreSQL table${NC}"
fi
echo ""

# Step 9: Build frontend (optional)
echo -e "${YELLOW}🎨 Step 9: Rebuild frontend? (optional)${NC}"
read -p "Rebuild and deploy frontend? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$APP_DIR/frontend"
    echo "Building frontend..."
    npm run build
    echo ""
    echo "Deploying to nginx..."
    sudo cp -r dist/* /var/www/html/dpdc-ami/ || sudo cp -r dist/* /usr/share/nginx/html/dpdc-ami/
    echo ""
    echo "Restarting nginx..."
    sudo systemctl restart nginx
    echo -e "${GREEN}✅ Frontend deployed${NC}"
fi
echo ""

# Summary
echo "========================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "📊 What to expect:"
echo "  - In 30 minutes: Batch Monitoring Report in MS Teams"
echo "  - In 1 hour: NOCS Balance Summary in MS Teams"
echo ""
echo "📋 Verification steps:"
echo "  1. Check server logs: pm2 logs dpdc-ami-backend"
echo "  2. Look for: '✅ Batch Monitoring Scheduler started'"
echo "  3. Look for: '✅ NOCS Balance Summary Scheduler started'"
echo "  4. Wait for Teams messages"
echo ""
echo "🔄 Rollback if needed:"
echo "  pm2 stop dpdc-ami-backend"
echo "  rm -rf $APP_DIR"
echo "  mv $BACKUP_DIR $APP_DIR"
echo "  pm2 restart dpdc-ami-backend"
echo ""
echo "📝 Backup location: $BACKUP_DIR"
echo "========================================"
echo ""
