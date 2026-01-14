#!/bin/bash

echo "=================================="
echo "CRP-CPC Frontend Diagnostic Check"
echo "=================================="
echo ""

# Check 1: Git status
echo "1. Checking Git Status..."
cd /path/to/DPDC-AMI-BY-OTBL
git log --oneline -1
echo "Expected: 2c954dc or 8db8085"
echo ""

# Check 2: Verify file has export button
echo "2. Checking if source file has Export button..."
grep -c "Export to Excel" frontend/src/views/CRPCPCView.vue
echo "Expected: Should show a number > 0"
echo ""

# Check 3: Show the actual line
echo "3. Showing Export to Excel lines in source:"
grep -n "Export to Excel" frontend/src/views/CRPCPCView.vue | head -3
echo ""

# Check 4: Check if dist exists
echo "4. Checking if dist folder exists..."
if [ -d "frontend/dist" ]; then
    echo "✓ dist folder exists"
    ls -lh frontend/dist/index.html
else
    echo "✗ dist folder NOT found - Need to run: npm run build"
fi
echo ""

# Check 5: Backend status
echo "5. Checking Backend Status..."
pm2 status | grep dpdc-ami
echo ""

# Check 6: Check nginx/apache
echo "6. Checking Web Server..."
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
    ls -lh /var/www/html/dpdc-ami/index.html 2>/dev/null || echo "✗ Files not in /var/www/html/dpdc-ami/"
elif systemctl is-active --quiet apache2; then
    echo "✓ Apache is running"
    ls -lh /var/www/html/dpdc-ami/index.html 2>/dev/null || echo "✗ Files not in /var/www/html/dpdc-ami/"
else
    echo "? Web server status unknown"
fi
echo ""

# Check 7: Test API endpoint
echo "7. Testing Backend API..."
curl -s http://localhost:5000/api/health | head -1
echo ""

echo "=================================="
echo "Diagnostic Complete"
echo "=================================="
