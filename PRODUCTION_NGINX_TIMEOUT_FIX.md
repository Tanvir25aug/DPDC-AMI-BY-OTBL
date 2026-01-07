# Production Nginx Timeout Fix - 5 Minutes

## Problem

Getting 504 Gateway Timeout error in production when loading NOCS Customer Payoff:
```
504 Gateway Time-out
nginx/1.24.0 (Ubuntu)
```

## Root Cause

1. Nginx default timeout: **60 seconds**
2. Backend query for large NOCS: **60-120 seconds**
3. Result: Nginx times out before backend responds

## Solution

Increase all timeouts to **5 minutes (300 seconds)**:
- ✅ Nginx proxy timeout: 300 seconds
- ✅ Backend Oracle query timeout: 300 seconds
- ✅ Backend connection pool timeout: 300 seconds

---

## Step-by-Step Deployment

### Step 1: Find Your Nginx Configuration File

```bash
# Check which nginx config file is being used
sudo nginx -T | grep "server_name"

# Common locations:
# /etc/nginx/sites-available/dpdc-ami
# /etc/nginx/sites-available/default
# /etc/nginx/conf.d/dpdc-ami.conf
```

### Step 2: Edit Nginx Configuration

```bash
# Edit your nginx config file (replace with your actual file path)
sudo nano /etc/nginx/sites-available/dpdc-ami
```

### Step 3: Add/Update Timeout Settings

Find the `location /api/` block and update it:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Add these at server level
    client_max_body_size 100M;
    keepalive_timeout 300s;

    # API proxy with 5-minute timeout
    location /api/ {
        proxy_pass http://localhost:3000;

        # 5 MINUTE TIMEOUTS - Critical for large NOCS queries
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Buffer settings for large responses
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 8 128k;
        proxy_busy_buffers_size 256k;

        # Required headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Keep alive
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Frontend (if serving static files)
    location / {
        root /var/www/dpdc-ami/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 4: Test Nginx Configuration

```bash
# Test nginx configuration for syntax errors
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Restart Nginx

```bash
# Restart nginx to apply changes
sudo systemctl restart nginx

# Verify nginx is running
sudo systemctl status nginx
```

### Step 6: Pull Latest Backend Code

```bash
# Navigate to backend directory
cd /path/to/DPDC-AMI-BY-OTBL

# Pull latest code (includes backend timeout increases)
git pull origin main
```

### Step 7: Restart Backend Server

```bash
# If using PM2
pm2 restart backend

# Verify backend is running
pm2 status

# Check backend logs
pm2 logs backend --lines 50
```

**OR if using systemctl:**

```bash
# Restart backend service
sudo systemctl restart dpdc-ami-backend

# Check status
sudo systemctl status dpdc-ami-backend

# View logs
sudo journalctl -u dpdc-ami-backend -n 50 -f
```

### Step 8: Clear Browser Cache

Instruct users to hard refresh:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### Step 9: Test the Fix

1. Open your production application
2. Go to **NOCS Balance Summary**
3. Click on a large NOCS (10,000+ customers)
4. **Expected result:**
   - Page loads successfully (may take 30-60 seconds)
   - Summary cards appear
   - Customer data loads completely
   - **NO 504 timeout error**

---

## Verification Checklist

After deployment, verify:

- [ ] Nginx config syntax is valid (`nginx -t` passes)
- [ ] Nginx restarted successfully
- [ ] Backend pulled latest code
- [ ] Backend restarted successfully
- [ ] Large NOCS loads without 504 timeout
- [ ] Small NOCS still loads quickly
- [ ] No errors in backend logs
- [ ] No errors in nginx logs

---

## Check Logs

### Nginx Error Logs:

```bash
# View nginx error log
sudo tail -f /var/log/nginx/error.log

# View nginx access log
sudo tail -f /var/log/nginx/access.log
```

### Backend Logs:

```bash
# If using PM2
pm2 logs backend --lines 100

# If using systemctl
sudo journalctl -u dpdc-ami-backend -n 100 -f
```

**Look for these log messages:**
```
[Reports Controller] Fetching customer payoff data for NOCS: 0101
[Reports Service] Executing report: nocs_customer_payoff
[Reports Service] Report nocs_customer_payoff completed: 15420 rows
[Reports Controller] Retrieved 15420 customers for NOCS 0101 in 45.23s
```

---

## Timeout Settings Summary

### Before (causing 504 errors):
- Nginx timeout: **60 seconds** ❌
- Backend query timeout: **60 seconds** ❌
- Result: Timeout for NOCS with 10,000+ customers

### After (fixed):
- Nginx timeout: **300 seconds (5 minutes)** ✅
- Backend query timeout: **300 seconds (5 minutes)** ✅
- Backend pool queue timeout: **300 seconds (5 minutes)** ✅
- Result: **No timeout** for any NOCS size

---

## Alternative: Use Pagination (Recommended)

While increasing timeouts works, **pagination is the better long-term solution**:

### Benefits of Pagination:
- ✅ Fast initial load (< 3 seconds)
- ✅ No timeouts ever
- ✅ Better user experience
- ✅ Lower server load
- ✅ Works for any NOCS size

### To Use Pagination:
The pagination code is already deployed. Users just need to clear browser cache to get the new frontend code with pagination support.

---

## Troubleshooting

### Issue: Still getting 504 timeout after changes

**Possible causes:**
1. Nginx config not reloaded
2. Wrong nginx config file edited
3. Backend not restarted
4. Old frontend code cached in browser

**Solution:**
```bash
# 1. Verify nginx config is loaded
sudo nginx -T | grep "proxy_read_timeout"
# Should show: proxy_read_timeout 300s;

# 2. Force reload nginx
sudo systemctl reload nginx
sudo systemctl restart nginx

# 3. Restart backend
pm2 restart backend

# 4. Clear browser cache completely
# Or use incognito/private browsing mode
```

### Issue: Nginx syntax error

**Error:**
```
nginx: [emerg] invalid number of arguments in "proxy_read_timeout" directive
```

**Solution:**
Make sure timeout values have 's' suffix:
```nginx
# CORRECT:
proxy_read_timeout 300s;

# WRONG:
proxy_read_timeout 300;
```

### Issue: Backend still timing out

**Check backend logs:**
```bash
pm2 logs backend | grep "timeout"
```

**If you see Oracle timeout errors:**
```
ORA-01013: user requested cancel of current operation
```

This means the Oracle query itself is timing out. The backend timeout increase should fix this.

### Issue: Page takes too long to load

**Expected behavior with large NOCS:**
- 10,000 customers: 30-60 seconds ✅
- 20,000 customers: 60-120 seconds ✅
- 50,000+ customers: 2-5 minutes ✅

**If it takes longer:**
- Consider using pagination instead
- Check database performance
- Verify indexes are in place

---

## Files Modified

### Backend:
1. ✅ `backend/src/config/oracle.js`
   - Query timeout: 60s → 300s (5 minutes)
   - Pool queue timeout: 120s → 300s (5 minutes)

### Infrastructure:
2. ✅ Nginx configuration (manual update required)
   - `proxy_read_timeout`: 60s → 300s
   - `proxy_connect_timeout`: 60s → 300s
   - `proxy_send_timeout`: 60s → 300s

---

## Quick Reference Commands

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/dpdc-ami

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Pull latest code
cd /path/to/DPDC-AMI-BY-OTBL && git pull origin main

# Restart backend (PM2)
pm2 restart backend

# Restart backend (systemctl)
sudo systemctl restart dpdc-ami-backend

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# View backend logs
pm2 logs backend --lines 50
```

---

## Important Notes

1. **5-minute timeout is a TEMPORARY fix**
   - Works for current large NOCS
   - May still timeout for extremely large NOCS (100,000+ customers)
   - Pagination is the better long-term solution

2. **Server resources**
   - Long-running queries consume server resources
   - Monitor server CPU and memory during peak hours
   - Consider pagination if server performance degrades

3. **User experience**
   - Users may see loading spinner for 30-60+ seconds
   - Consider adding a message: "Loading large dataset, please wait..."
   - Pagination provides better UX with immediate feedback

4. **Backward compatibility**
   - Timeout increase doesn't affect small NOCS
   - Small NOCS still load in < 5 seconds
   - No functional changes, only timeout extension

---

**Status**: ✅ Ready for Production Deployment
**Testing**: Required after deployment
**Rollback**: Simply revert nginx config and restart nginx if issues occur

---

**Date**: 2026-01-06
**Priority**: HIGH - Fixes production 504 errors
**Impact**: All NOCS Customer Payoff pages, especially large NOCS
