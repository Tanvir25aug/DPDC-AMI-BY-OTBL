#!/bin/bash

echo "=========================================="
echo "Force Frontend Update - CRP-CPC Export"
echo "=========================================="
echo ""

# Configuration - UPDATE THESE PATHS
APP_DIR="/path/to/DPDC-AMI-BY-OTBL"
NGINX_DIR="/var/www/html/dpdc-ami"
PM2_APP_NAME="dpdc-ami-frontend"

echo "Using directories:"
echo "  App: $APP_DIR"
echo "  Nginx: $NGINX_DIR"
echo ""

# Step 1: Pull latest code
echo "Step 1: Pulling latest code..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main
git pull origin main
echo "✓ Code pulled"
echo ""

# Step 2: Verify export button exists in source
echo "Step 2: Verifying source code has Export button..."
EXPORT_COUNT=$(grep -c "Export to Excel" frontend/src/views/CRPCPCView.vue)
if [ $EXPORT_COUNT -gt 0 ]; then
    echo "✓ Export button found in source ($EXPORT_COUNT occurrences)"
    grep -n "Export to Excel" frontend/src/views/CRPCPCView.vue | head -2
else
    echo "✗ ERROR: Export button NOT found in source!"
    echo "   Code may not have been pulled correctly"
    exit 1
fi
echo ""

# Step 3: Clean old build
echo "Step 3: Cleaning old build..."
cd $APP_DIR/frontend
rm -rf dist/
rm -rf node_modules/.vite
echo "✓ Old build cleaned"
echo ""

# Step 4: Install dependencies
echo "Step 4: Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 5: Build frontend
echo "Step 5: Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "✗ Build FAILED!"
    exit 1
fi
echo ""

# Step 6: Verify build output
echo "Step 6: Verifying build output..."
if [ -f "dist/index.html" ]; then
    echo "✓ dist/index.html exists"
    ls -lh dist/index.html
else
    echo "✗ Build output NOT found!"
    exit 1
fi
echo ""

# Step 7: Deploy to nginx/apache
echo "Step 7: Deploying to web server..."
if [ -d "$NGINX_DIR" ]; then
    echo "  Backing up old files..."
    sudo mv $NGINX_DIR $NGINX_DIR.backup.$(date +%Y%m%d_%H%M%S)

    echo "  Creating directory..."
    sudo mkdir -p $NGINX_DIR

    echo "  Copying new files..."
    sudo cp -r dist/* $NGINX_DIR/

    echo "  Setting permissions..."
    sudo chown -R www-data:www-data $NGINX_DIR
    sudo chmod -R 755 $NGINX_DIR

    echo "✓ Files deployed to $NGINX_DIR"
else
    echo "  Nginx directory not found, skipping..."
fi
echo ""

# Step 8: Restart services
echo "Step 8: Restarting services..."

# Restart nginx if running
if systemctl is-active --quiet nginx; then
    echo "  Restarting nginx..."
    sudo systemctl restart nginx
    echo "✓ Nginx restarted"
fi

# Restart apache if running
if systemctl is-active --quiet apache2; then
    echo "  Restarting apache..."
    sudo systemctl restart apache2
    echo "✓ Apache restarted"
fi

# Restart PM2 if app exists
if pm2 list | grep -q $PM2_APP_NAME; then
    echo "  Restarting PM2 app..."
    pm2 restart $PM2_APP_NAME
    echo "✓ PM2 app restarted"
fi

echo ""

# Step 9: Final verification
echo "Step 9: Final verification..."
echo "  Source file has Export button:"
grep -c "Export to Excel" $APP_DIR/frontend/src/views/CRPCPCView.vue
echo ""
echo "  Build files deployed:"
ls -lh $NGINX_DIR/index.html 2>/dev/null || echo "  (Check your deployment directory)"
echo ""

echo "=========================================="
echo "✓ Frontend Update Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open browser to: http://your-server/crp-cpc"
echo "2. Press Ctrl+F5 (hard refresh) or Ctrl+Shift+R"
echo "3. Or open in Incognito/Private window"
echo "4. You should see green 'Export to Excel' button"
echo ""
echo "If STILL not showing:"
echo "- Clear browser cache completely"
echo "- Try different browser"
echo "- Check browser console (F12) for errors"
echo ""
