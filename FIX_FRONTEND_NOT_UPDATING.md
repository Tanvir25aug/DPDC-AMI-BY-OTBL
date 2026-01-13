# Fix: CRP-CPC Frontend Not Showing Updated Page

## Issue
After pulling latest code, the CRP-CPC page doesn't show the new "Export to Excel" button or other updates.

## Common Causes
1. ❌ Browser cache serving old files
2. ❌ Frontend not rebuilt after git pull
3. ❌ Old dist/ folder not replaced
4. ❌ Nginx/Apache serving cached files
5. ❌ Service worker caching old version

---

## Solution 1: Clear Browser Cache (Try First)

### Option A: Hard Refresh
**Windows/Linux:**
- Press `Ctrl + F5` or `Ctrl + Shift + R`

**Mac:**
- Press `Cmd + Shift + R`

### Option B: Clear Cache in Browser
**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached Web Content"
3. Click "Clear Now"

### Option C: Incognito/Private Window
1. Open browser in incognito mode
2. Go to CRP-CPC page
3. Check if updates are visible

---

## Solution 2: Rebuild Frontend on Server

```bash
# SSH into production server
ssh user@production-server

# Go to frontend directory
cd /path/to/DPDC-AMI-BY-OTBL/frontend

# Remove old build
rm -rf dist/

# Rebuild
npm run build

# Verify build created
ls -la dist/

# You should see:
# - index.html
# - assets/ folder with .js and .css files
```

---

## Solution 3: Deploy New Build to Web Server

### If using Nginx:

```bash
# Copy new build to nginx directory
sudo rm -rf /var/www/html/dpdc-ami/*
sudo cp -r dist/* /var/www/html/dpdc-ami/

# Set correct permissions
sudo chown -R www-data:www-data /var/www/html/dpdc-ami/
sudo chmod -R 755 /var/www/html/dpdc-ami/

# Restart nginx
sudo systemctl restart nginx

# Clear nginx cache (if enabled)
sudo rm -rf /var/cache/nginx/*
```

### If using Apache:

```bash
# Copy new build to apache directory
sudo rm -rf /var/www/html/dpdc-ami/*
sudo cp -r dist/* /var/www/html/dpdc-ami/

# Set correct permissions
sudo chown -R www-data:www-data /var/www/html/dpdc-ami/
sudo chmod -R 755 /var/www/html/dpdc-ami/

# Restart apache
sudo systemctl restart apache2
```

### If using PM2 serve:

```bash
cd /path/to/DPDC-AMI-BY-OTBL/frontend

# Restart serve
pm2 restart dpdc-ami-frontend

# Or if not running, start it
pm2 start "npx serve -s dist -p 3000" --name dpdc-ami-frontend
```

---

## Solution 4: Add Cache Busting to Nginx

If nginx is serving cached files, update config:

```bash
sudo nano /etc/nginx/sites-available/dpdc-ami
```

Add these lines inside `location /` block:

```nginx
location / {
    # Disable caching for HTML files
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Cache static assets (JS, CSS, images) with versioning
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    try_files $uri $uri/ /index.html;
}
```

Save and restart nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Solution 5: Check if Files Were Actually Updated

### Check Vue Component File:

```bash
# On server
cd /path/to/DPDC-AMI-BY-OTBL/frontend/src/views

# Check if CRPCPCView.vue has export button
grep -n "Export to Excel" CRPCPCView.vue

# Should show line numbers with "Export to Excel" text
# Example: 27:  Export to Excel
```

### Check Commit:

```bash
cd /path/to/DPDC-AMI-BY-OTBL

# Verify you have latest commit
git log --oneline -3

# Should show:
# 2c954dc Add production deployment guides
# 8db8085 CRP-CPC Enhanced Export and Backend Filtering Implementation
# 69cb46d Fix validator to allow maxRows: 0
```

### Check Build Output:

```bash
cd frontend/dist/assets

# List JavaScript files
ls -lh *.js

# Check modification date - should be recent
# Check file sizes - should be reasonable
```

---

## Solution 6: Force Frontend Rebuild and Deploy

**Complete rebuild from scratch:**

```bash
# SSH to server
ssh user@production-server

cd /path/to/DPDC-AMI-BY-OTBL

# Pull latest code
git fetch origin
git reset --hard origin/main

# Clean install frontend
cd frontend
rm -rf node_modules/
rm -rf dist/
rm -f package-lock.json

# Fresh install
npm cache clean --force
npm install

# Build
npm run build

# Verify export button is in source
grep -r "Export to Excel" src/

# Check build created successfully
ls -la dist/
du -sh dist/  # Should be 2-5 MB

# Deploy (choose your method)
# Method 1: Copy to nginx
sudo rm -rf /var/www/html/dpdc-ami/*
sudo cp -r dist/* /var/www/html/dpdc-ami/
sudo systemctl restart nginx

# Method 2: Restart PM2 serve
pm2 restart dpdc-ami-frontend

# Method 3: Copy to Apache
sudo rm -rf /var/www/html/dpdc-ami/*
sudo cp -r dist/* /var/www/html/dpdc-ami/
sudo systemctl restart apache2
```

---

## Solution 7: Check Browser Console for Errors

1. Open browser to CRP-CPC page
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Refresh page
5. Look for errors (red text)

**Common errors:**

### Error: "Failed to load resource: 404"
**Cause:** Files not deployed correctly
**Fix:** Re-copy dist/ files to web server directory

### Error: "Unexpected token '<'"
**Cause:** HTML being served instead of JavaScript
**Fix:** Check nginx/apache configuration, ensure correct path

### Error: "Module not found"
**Cause:** Build incomplete
**Fix:** Delete dist/ and rebuild

---

## Solution 8: Verify Backend Is Running

Sometimes frontend works but backend is not running:

```bash
# Check backend status
pm2 status

# Should show dpdc-ami-backend as "online"

# Check backend logs
pm2 logs dpdc-ami-backend --lines 20

# Test API directly
curl http://localhost:5000/api/health

# Should return: {"status":"ok"}

# Test new endpoint
curl http://localhost:5000/api/crp-cpc/export/detailed?limit=1

# Should return JSON data
```

If backend is not running:
```bash
cd /path/to/DPDC-AMI-BY-OTBL/backend
pm2 restart dpdc-ami-backend
```

---

## Solution 9: Check Network Tab in Browser

1. Open CRP-CPC page
2. Press `F12` → Go to **Network** tab
3. Refresh page (`Ctrl + F5`)
4. Check loaded files

**Look for:**
- `CRPCPCView.[hash].js` - Should be loaded
- Check "Status" column - All should be `200 OK`
- Check "Size" column - Should not be "(from cache)"

**If files show "(from cache)":**
```bash
# In browser console, run:
location.reload(true);

# Or clear cache completely
```

---

## Solution 10: Verify Git Pull Worked

```bash
# On server
cd /path/to/DPDC-AMI-BY-OTBL

# Check if you have latest code
git status

# Should show: "Your branch is up to date with 'origin/main'"

# Check commit
git rev-parse HEAD

# Should show: 2c954dc... or 8db8085...

# If not, force pull
git fetch origin
git reset --hard origin/main
git pull origin main
```

---

## Debugging Checklist

Run through this checklist:

- [ ] Git pulled successfully showing commit `8db8085`
- [ ] Frontend rebuilt: `npm run build` completed without errors
- [ ] dist/ folder exists and contains files
- [ ] dist/ copied to web server directory (/var/www/html/dpdc-ami/)
- [ ] Web server (nginx/apache) restarted
- [ ] Browser cache cleared (Ctrl + F5)
- [ ] Opened in incognito window to verify
- [ ] Backend service is running (pm2 status shows "online")
- [ ] No errors in browser console (F12)
- [ ] Network tab shows files loaded (not cached)

---

## Quick Test Commands

Run these on production server to verify everything:

```bash
# 1. Verify code is latest
cd /path/to/DPDC-AMI-BY-OTBL
git log --oneline -1
# Should show: 2c954dc or 8db8085

# 2. Check if export button is in source code
grep -n "Export to Excel" frontend/src/views/CRPCPCView.vue
# Should show line number with text

# 3. Check if build exists
ls -lh frontend/dist/index.html
# Should show recent date/time

# 4. Check backend running
pm2 status | grep dpdc-ami-backend
# Should show "online"

# 5. Test API
curl http://localhost:5000/api/crp-cpc/list?page=1&limit=1
# Should return JSON
```

---

## Still Not Working?

### Option A: Try accessing directly with port

If using PM2 serve on port 3000:
```
http://your-server:3000
```

If it works on port but not on domain, nginx/apache config issue.

### Option B: Check file permissions

```bash
ls -la /var/www/html/dpdc-ami/

# All files should be readable (644 or 755)
# If not:
sudo chmod -R 755 /var/www/html/dpdc-ami/
sudo chown -R www-data:www-data /var/www/html/dpdc-ami/
```

### Option C: Check nginx/apache error logs

```bash
# Nginx
sudo tail -f /var/log/nginx/error.log

# Apache
sudo tail -f /var/log/apache2/error.log
```

### Option D: Restart everything

```bash
# Stop all
pm2 stop all
sudo systemctl stop nginx

# Start all
sudo systemctl start nginx
pm2 start all

# Wait 10 seconds, then test
```

---

## Contact for Help

If still not working, provide these details:

1. **Server type:** (Ubuntu, CentOS, etc.)
2. **Web server:** (Nginx, Apache, PM2 serve)
3. **Git commit:** Run `git log --oneline -1`
4. **Build output:** Run `npm run build` and share output
5. **Browser console errors:** Press F12 and share any red errors
6. **Backend status:** Run `pm2 status` and share output

---

**Most Common Solution:** Hard refresh browser with `Ctrl + F5` after running `npm run build` on server!
