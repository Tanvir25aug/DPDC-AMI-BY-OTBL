#!/bin/bash

# DPDC AMI - Deploy Nginx Timeout Fix
# This script updates nginx configuration and restarts services

echo "=========================================="
echo "DPDC AMI - Deploy Nginx Timeout Fix"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    echo "   Usage: sudo bash DEPLOY_NGINX_TIMEOUT_FIX.sh"
    exit 1
fi

NGINX_CONFIG="/etc/nginx/sites-available/dpdc-ami"

echo "Step 1: Backing up current nginx configuration..."
if [ -f "$NGINX_CONFIG" ]; then
    BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "⚠️  Nginx config not found at: $NGINX_CONFIG"
    read -p "   Enter the correct path: " NGINX_CONFIG
    if [ ! -f "$NGINX_CONFIG" ]; then
        echo "❌ File not found. Exiting."
        exit 1
    fi
    BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
fi

echo ""
echo "Step 2: Copying updated nginx configuration..."
if [ -f "./nginx-dpdc-ami-updated.conf" ]; then
    cp "./nginx-dpdc-ami-updated.conf" "$NGINX_CONFIG"
    echo "✅ Nginx configuration updated"
else
    echo "❌ nginx-dpdc-ami-updated.conf not found in current directory"
    echo "   Make sure you're running this script from the DPDC-AMI-BY-OTBL directory"
    exit 1
fi

echo ""
echo "Step 3: Testing nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo "   Backup restored. Please check the configuration manually."
    exit 1
fi

echo "✅ Nginx configuration is valid"

echo ""
echo "Step 4: Restarting nginx..."
systemctl restart nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx restarted successfully"
else
    echo "❌ Failed to restart nginx!"
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    systemctl restart nginx
    exit 1
fi

echo ""
echo "Step 5: Checking nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running!"
    exit 1
fi

echo ""
echo "Step 6: Pulling latest backend code..."
cd /home/oculin/DPDC-AMI-BY-OTBL
sudo -u oculin git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Code pulled successfully"
else
    echo "⚠️  Failed to pull code (may not be critical)"
fi

echo ""
echo "Step 7: Restarting backend..."

# Check if PM2 is installed and has processes
if command -v pm2 &> /dev/null; then
    echo "   Using PM2 to restart backend..."
    sudo -u oculin pm2 restart backend

    if [ $? -eq 0 ]; then
        echo "✅ Backend restarted successfully"
        echo ""
        echo "   Backend status:"
        sudo -u oculin pm2 status
    else
        echo "⚠️  Failed to restart backend with PM2"
    fi
else
    echo "⚠️  PM2 not found. Please restart backend manually."
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Changes applied:"
echo "  • Nginx timeouts increased: 60s → 300s (5 minutes)"
echo "  • Backend timeouts increased: 60s → 300s (5 minutes)"
echo "  • Buffer sizes optimized for large responses"
echo ""
echo "What to test:"
echo "  1. Open: http://172.18.42.200"
echo "  2. Go to NOCS Balance Summary"
echo "  3. Click on a large NOCS (10,000+ customers)"
echo "  4. Verify: Page loads without 504 timeout error"
echo ""
echo "Expected load times:"
echo "  • 5,000 customers: 20-30 seconds"
echo "  • 10,000 customers: 30-60 seconds"
echo "  • 20,000+ customers: 60-120 seconds"
echo ""
echo "View logs:"
echo "  • Nginx: sudo tail -f /var/log/nginx/dpdc-ami-error.log"
echo "  • Backend: pm2 logs backend"
echo ""
echo "Backup location: $BACKUP_FILE"
echo ""
