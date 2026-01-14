#!/bin/bash

################################################################################
# Quick Deploy - CRP-CPC Export Feature
#
# Simple one-command deployment without prompts
# Usage: bash QUICK_DEPLOY_CRP_CPC.sh
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "================================================================================"
echo -e "${BLUE}Quick Deploy - CRP-CPC Export${NC}"
echo "================================================================================"
echo ""

# Get directories
APP_DIR=$(pwd)
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
NGINX_DIR="/var/www/html/dpdc-ami"

# Backup
echo "Creating backup..."
BACKUP_DIR="${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
cd ..
cp -r "$(basename $APP_DIR)" "$BACKUP_DIR"
cd "$(basename $APP_DIR)"
echo -e "${GREEN}✓ Backup: $BACKUP_DIR${NC}"

# Pull code
echo ""
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

# Backend
echo ""
echo "Setting up backend..."
cd "$BACKEND_DIR"
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Frontend
echo ""
echo "Building frontend..."
cd "$FRONTEND_DIR"
npm install
rm -rf dist/ node_modules/.vite
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"

# Deploy
echo ""
echo "Deploying frontend..."
sudo rm -rf "$NGINX_DIR"
sudo mkdir -p "$NGINX_DIR"
sudo cp -r dist/* "$NGINX_DIR/"
sudo chown -R www-data:www-data "$NGINX_DIR"
sudo chmod -R 755 "$NGINX_DIR"
echo -e "${GREEN}✓ Frontend deployed${NC}"

# Restart
echo ""
echo "Restarting services..."
sudo systemctl restart nginx
cd "$BACKEND_DIR"
pm2 restart dpdc-backend
echo -e "${GREEN}✓ Services restarted${NC}"

# Status
echo ""
echo "================================================================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "================================================================================"
echo ""
echo "Backend Status:"
pm2 status dpdc-backend
echo ""
echo "Next Steps:"
echo "1. Open: http://your-server/crp-cpc"
echo "2. Press Ctrl+F5 (hard refresh)"
echo "3. Look for green 'Export to Excel' button"
echo ""
