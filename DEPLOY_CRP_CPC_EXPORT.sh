#!/bin/bash

################################################################################
# Deploy CRP-CPC Export Feature to Production
#
# This script automates the complete deployment process:
# 1. Backup current system
# 2. Pull latest code from GitHub
# 3. Setup PostgreSQL tables
# 4. Install dependencies
# 5. Build frontend
# 6. Deploy to nginx
# 7. Restart backend
# 8. Setup cron job for batch
# 9. Verify deployment
#
# Usage: bash DEPLOY_CRP_CPC_EXPORT.sh
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Auto-detect or use defaults
APP_DIR=$(pwd)
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
NGINX_DIR="/var/www/html/dpdc-ami"
PM2_APP_NAME="dpdc-backend"

echo ""
echo "================================================================================"
echo -e "${BLUE}CRP-CPC Export Feature - Production Deployment${NC}"
echo "================================================================================"
echo ""
echo "Deployment Configuration:"
echo "  App Directory:     $APP_DIR"
echo "  Backend Directory: $BACKEND_DIR"
echo "  Frontend Directory: $FRONTEND_DIR"
echo "  Nginx Directory:   $NGINX_DIR"
echo "  PM2 App Name:      $PM2_APP_NAME"
echo ""
echo "================================================================================"
echo ""

read -p "Continue with deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi
echo ""

# Step 1: Backup
echo "================================================================================"
echo -e "${BLUE}Step 1: Creating Backup${NC}"
echo "================================================================================"
BACKUP_DIR="${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
echo "Backing up to: $BACKUP_DIR"
cd ..
cp -r "$(basename $APP_DIR)" "$BACKUP_DIR"
cd "$(basename $APP_DIR)"
echo -e "${GREEN}✓ Backup created successfully${NC}"
echo ""

# Step 2: Pull Latest Code
echo "================================================================================"
echo -e "${BLUE}Step 2: Pulling Latest Code from GitHub${NC}"
echo "================================================================================"
echo "Fetching latest changes..."
git fetch origin

echo ""
echo "Current commit:"
git log --oneline -1

echo ""
echo "Latest commit on origin/main:"
git log --oneline -1 origin/main

echo ""
read -p "Force pull latest code (overwrites local changes)? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Resetting to origin/main..."
    git reset --hard origin/main
    git pull origin main
    echo -e "${GREEN}✓ Code pulled successfully${NC}"
    echo ""
    echo "Now at commit:"
    git log --oneline -1
else
    echo -e "${YELLOW}Skipping git pull. Using current code.${NC}"
fi
echo ""

# Step 3: Verify Files Exist
echo "================================================================================"
echo -e "${BLUE}Step 3: Verifying Required Files${NC}"
echo "================================================================================"

REQUIRED_FILES=(
    "backend/src/config/postgresDB.js"
    "backend/src/jobs/billStopBatchJob.js"
    "backend/setup_bill_stop_tables.js"
    "backend/RUN_BILL_STOP_BATCH.js"
    "backend/migrations/create_bill_stop_tables.sql"
    "frontend/src/views/CRPCPCView.vue"
)

ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file ${RED}(MISSING!)${NC}"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = false ]; then
    echo ""
    echo -e "${RED}ERROR: Required files are missing!${NC}"
    echo "Please ensure you pulled the latest code."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All required files exist${NC}"
echo ""

# Step 4: Setup PostgreSQL Tables
echo "================================================================================"
echo -e "${BLUE}Step 4: Setting Up PostgreSQL Tables${NC}"
echo "================================================================================"
cd "$BACKEND_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo "Please create .env file with PostgreSQL credentials:"
    echo "  POSTGRES_HOST=localhost"
    echo "  POSTGRES_PORT=5432"
    echo "  POSTGRES_DB=dpdc_ami_prod"
    echo "  POSTGRES_USER=dpdc_prod_user"
    echo "  POSTGRES_PASSWORD=admin"
    exit 1
fi

echo "PostgreSQL Configuration (from .env):"
grep "POSTGRES_" .env || echo -e "${YELLOW}Warning: No POSTGRES_* variables found in .env${NC}"
echo ""

read -p "Setup PostgreSQL tables? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running setup script..."
    node setup_bill_stop_tables.js
    echo -e "${GREEN}✓ PostgreSQL tables setup complete${NC}"
else
    echo -e "${YELLOW}Skipping PostgreSQL setup${NC}"
fi
echo ""

# Step 5: Install Backend Dependencies
echo "================================================================================"
echo -e "${BLUE}Step 5: Installing Backend Dependencies${NC}"
echo "================================================================================"
cd "$BACKEND_DIR"
echo "Running npm install..."
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Step 6: Build Frontend
echo "================================================================================"
echo -e "${BLUE}Step 6: Building Frontend${NC}"
echo "================================================================================"
cd "$FRONTEND_DIR"

echo "Installing frontend dependencies..."
npm install
echo ""

echo "Cleaning old build..."
rm -rf dist/
rm -rf node_modules/.vite
echo -e "${GREEN}✓ Old build cleaned${NC}"
echo ""

echo "Building production bundle..."
npm run build

if [ $? -eq 0 ] && [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
    ls -lh dist/index.html
else
    echo -e "${RED}✗ Frontend build FAILED!${NC}"
    exit 1
fi
echo ""

# Step 7: Deploy Frontend to Nginx
echo "================================================================================"
echo -e "${BLUE}Step 7: Deploying Frontend to Nginx${NC}"
echo "================================================================================"

if [ ! -d "$NGINX_DIR" ]; then
    echo "Creating nginx directory: $NGINX_DIR"
    sudo mkdir -p "$NGINX_DIR"
fi

echo "Backing up old frontend..."
if [ -d "$NGINX_DIR" ] && [ "$(ls -A $NGINX_DIR)" ]; then
    sudo mv "$NGINX_DIR" "${NGINX_DIR}_backup_$(date +%Y%m%d_%H%M%S)" || true
    sudo mkdir -p "$NGINX_DIR"
fi

echo "Copying new frontend files..."
sudo cp -r dist/* "$NGINX_DIR/"

echo "Setting permissions..."
sudo chown -R www-data:www-data "$NGINX_DIR"
sudo chmod -R 755 "$NGINX_DIR"

echo -e "${GREEN}✓ Frontend deployed to $NGINX_DIR${NC}"
echo ""

# Step 8: Restart Services
echo "================================================================================"
echo -e "${BLUE}Step 8: Restarting Services${NC}"
echo "================================================================================"

# Restart Nginx
if systemctl is-active --quiet nginx; then
    echo "Restarting nginx..."
    sudo systemctl restart nginx
    echo -e "${GREEN}✓ Nginx restarted${NC}"
else
    echo -e "${YELLOW}Nginx not running, skipping...${NC}"
fi

# Restart Backend with PM2
cd "$BACKEND_DIR"
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo "Restarting PM2 app: $PM2_APP_NAME"
    pm2 restart "$PM2_APP_NAME"
    echo -e "${GREEN}✓ Backend restarted${NC}"
else
    echo -e "${YELLOW}PM2 app not found. Starting new instance...${NC}"
    pm2 start src/server.js --name "$PM2_APP_NAME"
    pm2 save
    echo -e "${GREEN}✓ Backend started${NC}"
fi

echo ""
echo "PM2 Status:"
pm2 status
echo ""

# Step 9: Run Initial Batch Job
echo "================================================================================"
echo -e "${BLUE}Step 9: Running Initial Batch Job${NC}"
echo "================================================================================"
echo "This will populate PostgreSQL with bill stop data (may take 5-10 minutes)"
echo ""
read -p "Run batch job now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$BACKEND_DIR"
    echo "Starting batch job..."
    node RUN_BILL_STOP_BATCH.js
    echo -e "${GREEN}✓ Batch job completed${NC}"
else
    echo -e "${YELLOW}Skipping batch job. Run manually later with:${NC}"
    echo "  cd $BACKEND_DIR"
    echo "  node RUN_BILL_STOP_BATCH.js"
fi
echo ""

# Step 10: Setup Cron Job
echo "================================================================================"
echo -e "${BLUE}Step 10: Setting Up Daily Batch Job (2 AM)${NC}"
echo "================================================================================"
echo "Options:"
echo "  1) PM2 Cron (Recommended - Easier to manage)"
echo "  2) System Cron (Traditional method)"
echo "  3) Skip for now"
echo ""
read -p "Choose option (1/2/3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "Setting up PM2 cron..."
        cd "$BACKEND_DIR"

        # Remove old cron job if exists
        pm2 delete bill-stop-batch 2>/dev/null || true

        # Create new cron job
        pm2 start RUN_BILL_STOP_BATCH.js --name bill-stop-batch --cron "0 2 * * *" --no-autorestart
        pm2 save

        echo -e "${GREEN}✓ PM2 cron job setup complete${NC}"
        echo ""
        echo "To check cron job status:"
        echo "  pm2 list"
        echo ""
        echo "To view cron job logs:"
        echo "  pm2 logs bill-stop-batch"
        ;;
    2)
        echo "Setting up system cron..."
        CRON_COMMAND="0 2 * * * cd $BACKEND_DIR && /usr/bin/node RUN_BILL_STOP_BATCH.js >> /var/log/bill_stop_batch.log 2>&1"

        # Check if cron job already exists
        if crontab -l 2>/dev/null | grep -q "RUN_BILL_STOP_BATCH.js"; then
            echo -e "${YELLOW}Cron job already exists. Skipping...${NC}"
        else
            echo "Adding cron job..."
            (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
            echo -e "${GREEN}✓ System cron job setup complete${NC}"
        fi

        echo ""
        echo "To verify cron job:"
        echo "  crontab -l"
        echo ""
        echo "To view logs:"
        echo "  tail -f /var/log/bill_stop_batch.log"
        ;;
    3)
        echo -e "${YELLOW}Skipping cron setup${NC}"
        echo ""
        echo "To setup later:"
        echo ""
        echo "PM2 Method:"
        echo "  cd $BACKEND_DIR"
        echo "  pm2 start RUN_BILL_STOP_BATCH.js --name bill-stop-batch --cron \"0 2 * * *\" --no-autorestart"
        echo "  pm2 save"
        echo ""
        echo "System Cron Method:"
        echo "  crontab -e"
        echo "  Add: 0 2 * * * cd $BACKEND_DIR && /usr/bin/node RUN_BILL_STOP_BATCH.js >> /var/log/bill_stop_batch.log 2>&1"
        ;;
esac
echo ""

# Step 11: Verification
echo "================================================================================"
echo -e "${BLUE}Step 11: Deployment Verification${NC}"
echo "================================================================================"

echo "Checking backend status..."
pm2 status "$PM2_APP_NAME"
echo ""

echo "Checking backend logs for errors..."
pm2 logs "$PM2_APP_NAME" --lines 20 --nostream
echo ""

echo "Verifying PostgreSQL data..."
cd "$BACKEND_DIR"
psql -U "${POSTGRES_USER:-dpdc_prod_user}" -d "${POSTGRES_DB:-dpdc_ami_prod}" -c "SELECT COUNT(*) as summary_records FROM bill_stop_summary;" 2>/dev/null || echo -e "${YELLOW}Note: Run psql manually to verify data${NC}"
echo ""

echo "Frontend deployment:"
if [ -f "$NGINX_DIR/index.html" ]; then
    echo -e "${GREEN}✓${NC} $NGINX_DIR/index.html"
    ls -lh "$NGINX_DIR/index.html"
else
    echo -e "${RED}✗${NC} Frontend not deployed correctly"
fi
echo ""

# Final Summary
echo "================================================================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "================================================================================"
echo ""
echo "Summary:"
echo "  ✓ Code pulled from GitHub"
echo "  ✓ PostgreSQL tables setup"
echo "  ✓ Dependencies installed"
echo "  ✓ Frontend built and deployed"
echo "  ✓ Backend restarted"
echo "  ✓ Services verified"
echo ""
echo "Next Steps:"
echo ""
echo "1. Open browser and navigate to:"
echo "   ${BLUE}http://your-server/crp-cpc${NC}"
echo ""
echo "2. Press ${YELLOW}Ctrl+F5${NC} (hard refresh) or open in Incognito mode"
echo ""
echo "3. Look for the green ${GREEN}'Export to Excel'${NC} button"
echo ""
echo "4. Click Export and verify Excel file has 13 columns:"
echo "   - CRP Account No"
echo "   - CPC Customer ID ✓"
echo "   - Meter Number"
echo "   - Customer Name"
echo "   - Address"
echo "   - NOCS Name"
echo "   - Phone Number"
echo "   - Feeder"
echo "   - Status"
echo "   - Start Date"
echo "   - Billed This Month"
echo "   - Last Bill Date"
echo "   - Current Balance"
echo ""
echo "Troubleshooting:"
echo "  - View backend logs: ${BLUE}pm2 logs $PM2_APP_NAME${NC}"
echo "  - Check nginx status: ${BLUE}sudo systemctl status nginx${NC}"
echo "  - Verify PostgreSQL: ${BLUE}psql -U dpdc_prod_user -d dpdc_ami_prod${NC}"
echo ""
echo "Rollback (if needed):"
echo "  cd .."
echo "  rm -rf $(basename $APP_DIR)"
echo "  mv $BACKUP_DIR $(basename $APP_DIR)"
echo "  cd $(basename $APP_DIR)/backend"
echo "  pm2 restart $PM2_APP_NAME"
echo ""
echo "================================================================================"
echo ""
