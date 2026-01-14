# CRP-CPC Export Feature - Production Deployment Guide

## Overview

This guide covers deploying the CRP-CPC Export to Excel feature that includes **13 columns** of detailed customer information, including the **CPC Customer ID**.

**New in this release:**
- ✅ CPC Customer ID column in Excel export
- ✅ Complete customer details (name, address, phone, feeder)
- ✅ Bill stop status tracking
- ✅ Last bill date and current balance
- ✅ PostgreSQL batch system for performance
- ✅ Daily automated batch job at 2 AM

---

## Quick Deployment (Recommended)

### Option 1: Automated Script (Easiest)

Run the deployment script that handles everything automatically:

```bash
cd ~/DPDC-AMI-BY-OTBL
bash DEPLOY_CRP_CPC_EXPORT.sh
```

This script will:
1. Create backup of current system
2. Pull latest code from GitHub
3. Verify required files exist
4. Setup PostgreSQL tables
5. Install dependencies
6. Build frontend
7. Deploy to nginx
8. Restart services
9. Setup daily batch job
10. Verify deployment

### Option 2: Quick Deploy (No Prompts)

For experienced users who want a fast deployment without prompts:

```bash
cd ~/DPDC-AMI-BY-OTBL
bash QUICK_DEPLOY_CRP_CPC.sh
```

---

## Manual Deployment

If you prefer to run commands manually:

### Step 1: Backup Current System

```bash
cd ~
cp -r DPDC-AMI-BY-OTBL DPDC-AMI-BY-OTBL-backup-$(date +%Y%m%d_%H%M%S)
```

### Step 2: Pull Latest Code

```bash
cd ~/DPDC-AMI-BY-OTBL
git fetch origin
git reset --hard origin/main
git pull origin main
```

Verify you have the latest commit:
```bash
git log --oneline -1
```

### Step 3: Verify Required Files

```bash
ls -la backend/src/config/postgresDB.js
ls -la backend/src/jobs/billStopBatchJob.js
ls -la backend/setup_bill_stop_tables.js
ls -la backend/RUN_BILL_STOP_BATCH.js
```

All files should exist. If any are missing, the pull failed.

### Step 4: Setup PostgreSQL Tables

```bash
cd backend
node setup_bill_stop_tables.js
```

Expected output:
```
============================================================
BILL STOP TABLES SETUP
============================================================

Testing PostgreSQL connection...
✅ Connected to PostgreSQL successfully

Creating tables...
✅ Tables created successfully

Verifying tables...
Tables found:
  - bill_stop_batch_log
  - bill_stop_details
  - bill_stop_summary

============================================================
✅ SUCCESS! Bill Stop tables are ready.
============================================================
```

### Step 5: Install Backend Dependencies

```bash
cd ~/DPDC-AMI-BY-OTBL/backend
npm install
```

### Step 6: Run Initial Batch Job

This populates PostgreSQL with bill stop data (takes 5-10 minutes):

```bash
cd ~/DPDC-AMI-BY-OTBL/backend
node RUN_BILL_STOP_BATCH.js
```

Wait for completion. You should see:
```
========================================
BILL STOP BATCH JOB COMPLETED
Duration: XXX seconds
Summary Records: XXXX
Detail Records: XXXX
========================================
```

### Step 7: Build Frontend

```bash
cd ~/DPDC-AMI-BY-OTBL/frontend
npm install
rm -rf dist/ node_modules/.vite
npm run build
```

### Step 8: Deploy Frontend to Nginx

```bash
sudo rm -rf /var/www/html/dpdc-ami/*
sudo mkdir -p /var/www/html/dpdc-ami
sudo cp -r dist/* /var/www/html/dpdc-ami/
sudo chown -R www-data:www-data /var/www/html/dpdc-ami/
sudo chmod -R 755 /var/www/html/dpdc-ami/
```

### Step 9: Restart Services

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart Backend
cd ~/DPDC-AMI-BY-OTBL/backend
pm2 restart dpdc-backend

# Check status
pm2 status
pm2 logs dpdc-backend --lines 20
```

### Step 10: Setup Daily Batch Job (2 AM)

**Option A: PM2 Cron (Recommended)**

```bash
cd ~/DPDC-AMI-BY-OTBL/backend
pm2 delete bill-stop-batch 2>/dev/null || true
pm2 start RUN_BILL_STOP_BATCH.js --name bill-stop-batch --cron "0 2 * * *" --no-autorestart
pm2 save
```

Verify:
```bash
pm2 list
```

View logs:
```bash
pm2 logs bill-stop-batch
```

**Option B: System Cron**

```bash
crontab -e
```

Add this line:
```
0 2 * * * cd /home/oculin/DPDC-AMI-BY-OTBL/backend && /usr/bin/node RUN_BILL_STOP_BATCH.js >> /var/log/bill_stop_batch.log 2>&1
```

Verify:
```bash
crontab -l
```

---

## Verification

### 1. Check Backend Status

```bash
pm2 status dpdc-backend
pm2 logs dpdc-backend --lines 30
```

Should show "online" with no errors.

### 2. Check PostgreSQL Data

```bash
psql -U dpdc_prod_user -d dpdc_ami_prod -c "SELECT COUNT(*) FROM bill_stop_summary;"
psql -U dpdc_prod_user -d dpdc_ami_prod -c "SELECT COUNT(*) FROM bill_stop_details;"
```

Both should show numbers > 0.

### 3. Test in Browser

1. Open: `http://your-server/crp-cpc`
2. Press **Ctrl+F5** (hard refresh) or open in Incognito mode
3. Look for green **"Export to Excel"** button
4. Click to download
5. Open Excel file and verify 13 columns:
   - CRP Account No
   - **CPC Customer ID** ✅
   - Meter Number
   - Customer Name
   - Address
   - NOCS Name
   - Phone Number
   - Feeder
   - Status
   - Start Date
   - Billed This Month
   - Last Bill Date
   - Current Balance

---

## Troubleshooting

### Frontend Not Updating

**Symptoms:** Still see old UI without Export button

**Solutions:**

1. **Hard refresh browser:**
   - Windows: `Ctrl + F5` or `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - Or open in Incognito/Private window

2. **Clear browser cache completely:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

3. **Verify deployment:**
   ```bash
   ls -la /var/www/html/dpdc-ami/index.html
   # Check modification time is recent
   ```

4. **Rebuild and redeploy:**
   ```bash
   cd ~/DPDC-AMI-BY-OTBL/frontend
   rm -rf dist/ node_modules/.vite
   npm run build
   sudo cp -r dist/* /var/www/html/dpdc-ami/
   sudo systemctl restart nginx
   ```

### Backend Not Starting

**Symptoms:** PM2 shows "errored" or "stopped"

**Check logs:**
```bash
pm2 logs dpdc-backend --lines 50
```

**Common errors:**

1. **"Cannot find module './jobs/scheduler'"**

   Fix: Comment out scheduler references in server.js
   ```bash
   cd ~/DPDC-AMI-BY-OTBL/backend
   nano src/server.js
   # Comment out line 21 and line 136
   ```

2. **"password authentication failed for user"**

   Fix: Check .env has correct PostgreSQL credentials
   ```bash
   cat .env | grep POSTGRES
   ```

   Should show:
   ```
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=dpdc_ami_prod
   POSTGRES_USER=dpdc_prod_user
   POSTGRES_PASSWORD=admin
   ```

3. **Port 3000 already in use**

   Fix:
   ```bash
   lsof -i :3000
   kill -9 <PID>
   pm2 restart dpdc-backend
   ```

### PostgreSQL Connection Failed

**Symptoms:** "ECONNREFUSED" or "password authentication failed"

**Checks:**

1. **PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Credentials are correct:**
   ```bash
   psql -U dpdc_prod_user -d dpdc_ami_prod
   # Enter password: admin
   ```

3. **Environment variables are set:**
   ```bash
   cd ~/DPDC-AMI-BY-OTBL/backend
   cat .env | grep POSTGRES
   ```

### Batch Job Failed

**Symptoms:** No data in PostgreSQL or batch job crashes

**Check batch log:**
```bash
cd ~/DPDC-AMI-BY-OTBL/backend
node RUN_BILL_STOP_BATCH.js
```

**Common issues:**

1. **Oracle connection timeout:** Increase timeout in .env
2. **Too many records:** Batch processes in chunks of 100
3. **PostgreSQL disk space:** Check with `df -h`

---

## Rollback Procedure

If deployment fails and you need to restore the previous version:

```bash
cd ~
rm -rf DPDC-AMI-BY-OTBL
mv DPDC-AMI-BY-OTBL-backup-YYYYMMDD_HHMMSS DPDC-AMI-BY-OTBL
cd DPDC-AMI-BY-OTBL/backend
pm2 restart dpdc-backend
sudo systemctl restart nginx
```

---

## System Requirements

- **Node.js:** v20.x or higher
- **PostgreSQL:** 12 or higher
- **PM2:** Latest version
- **Nginx:** 1.18 or higher
- **Git:** 2.x or higher
- **Disk Space:** At least 2GB free for PostgreSQL data

---

## Files Modified/Added

### New Files:
- `backend/src/config/postgresDB.js` - PostgreSQL connection config
- `backend/src/jobs/billStopBatchJob.js` - Batch job logic
- `backend/setup_bill_stop_tables.js` - Table creation script
- `backend/RUN_BILL_STOP_BATCH.js` - Manual batch runner
- `backend/migrations/create_bill_stop_tables.sql` - SQL schema
- `DEPLOY_CRP_CPC_EXPORT.sh` - Automated deployment script
- `QUICK_DEPLOY_CRP_CPC.sh` - Quick deployment script
- `DEPLOYMENT_GUIDE_CRP_CPC_EXPORT.md` - This guide

### Modified Files:
- `frontend/src/views/CRPCPCView.vue` - Added Export to Excel with 13 columns
- `backend/src/controllers/crp-cpc.controller.js` - Use shared PostgreSQL config
- `backend/src/server.js` - Commented out scheduler (not needed)

---

## Support

If you encounter issues not covered in this guide:

1. Check PM2 logs: `pm2 logs dpdc-backend --lines 100`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
4. Check system resources: `htop`

---

## Maintenance

### Daily Batch Job

The batch job runs automatically at 2 AM daily. To check:

```bash
# PM2 Cron
pm2 logs bill-stop-batch

# System Cron
tail -f /var/log/bill_stop_batch.log
```

### Manual Batch Run

If you need to refresh data immediately:

```bash
cd ~/DPDC-AMI-BY-OTBL/backend
node RUN_BILL_STOP_BATCH.js
```

### Database Maintenance

Clean old batch data (older than 7 days):

```bash
psql -U dpdc_prod_user -d dpdc_ami_prod

DELETE FROM bill_stop_details WHERE batch_date < CURRENT_DATE - INTERVAL '7 days';
DELETE FROM bill_stop_summary WHERE batch_date < CURRENT_DATE - INTERVAL '7 days';
DELETE FROM bill_stop_batch_log WHERE batch_date < CURRENT_DATE - INTERVAL '30 days';

VACUUM ANALYZE;
```

---

## Success Criteria

Deployment is successful when:

1. ✅ PM2 shows backend as "online"
2. ✅ No errors in PM2 logs
3. ✅ PostgreSQL has data in bill_stop_summary and bill_stop_details
4. ✅ Frontend shows green "Export to Excel" button
5. ✅ Export downloads Excel file with 13 columns
6. ✅ CPC Customer ID column is populated
7. ✅ Batch job scheduled for 2 AM daily

---

**Last Updated:** 2026-01-14
**Version:** 1.0.0
