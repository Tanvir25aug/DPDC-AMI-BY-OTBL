# Deployment Scripts Ready - How to Deploy on Production

## Summary

I've created **automated deployment scripts** and pushed them to GitHub. You can now deploy the CRP-CPC Export feature on production with a single command.

**Latest Commit:** `c729a70` - Add automated deployment scripts for CRP-CPC Export feature

---

## What Was Created

### 1. **DEPLOY_CRP_CPC_EXPORT.sh** (Full Deployment)

**Interactive script with prompts and verification at each step.**

Features:
- ✅ Creates automatic backup before deployment
- ✅ Pulls latest code from GitHub
- ✅ Verifies all required files exist
- ✅ Sets up PostgreSQL tables
- ✅ Installs dependencies (backend + frontend)
- ✅ Builds frontend for production
- ✅ Deploys to nginx
- ✅ Restarts services (nginx + PM2)
- ✅ Runs initial batch job to populate data
- ✅ Sets up daily batch job at 2 AM (PM2 or system cron)
- ✅ Verifies deployment success
- ✅ Provides rollback instructions

**Best for:** First-time deployment or when you want to control each step

### 2. **QUICK_DEPLOY_CRP_CPC.sh** (Fast Deployment)

**No-prompts script for experienced users.**

Same steps as above but runs automatically without asking questions.

**Best for:** Quick updates after first deployment

### 3. **DEPLOYMENT_GUIDE_CRP_CPC_EXPORT.md** (Documentation)

Complete deployment documentation including:
- Step-by-step manual deployment instructions
- Troubleshooting guide
- Verification procedures
- Rollback procedures
- Maintenance tasks

---

## How to Deploy on Production Server

### Step 1: Pull the Scripts

SSH into your production server and pull the latest code:

```bash
cd ~/DPDC-AMI-BY-OTBL
git fetch origin
git pull origin main
```

Verify you have the scripts:
```bash
ls -la DEPLOY_CRP_CPC_EXPORT.sh QUICK_DEPLOY_CRP_CPC.sh
```

### Step 2: Make Scripts Executable

```bash
chmod +x DEPLOY_CRP_CPC_EXPORT.sh
chmod +x QUICK_DEPLOY_CRP_CPC.sh
```

### Step 3: Run Deployment

**Option A: Interactive Deployment (Recommended for first time)**

```bash
bash DEPLOY_CRP_CPC_EXPORT.sh
```

This will:
- Ask for confirmation before each major step
- Show progress and output for each operation
- Let you choose between PM2 cron or system cron for batch job
- Give you option to run batch job now or later

**Option B: Quick Deployment (No prompts)**

```bash
bash QUICK_DEPLOY_CRP_CPC.sh
```

This runs everything automatically without asking questions.

### Step 4: Wait for Completion

The script will take 10-20 minutes to complete (mostly waiting for batch job to run).

You'll see output like:
```
========================================
BILL STOP BATCH JOB STARTED
Start Time: 2026-01-14T10:30:00.000Z
========================================

Step 1: Fetching bill stop details from Oracle...
✓ Fetched 25000 bill stop records in 45.23s

Step 2: Calculating summary data...
✓ Calculated summary for 500 CRPs in 2.15s

Step 3: Clearing old data from PostgreSQL...
✓ Old data cleared

Step 4: Inserting summary data into PostgreSQL...
✓ Inserted 500 summary records in 5.32s

Step 5: Inserting details data into PostgreSQL...
  Progress: 1000/25000 records inserted...
  Progress: 2000/25000 records inserted...
  ...
✓ Inserted 25000 detail records in 180.45s

========================================
BILL STOP BATCH JOB COMPLETED
Duration: 233 seconds (3.88 minutes)
Summary Records: 500
Detail Records: 25000
========================================
```

### Step 5: Verify Deployment

1. **Check Backend Status**
   ```bash
   pm2 status dpdc-backend
   pm2 logs dpdc-backend --lines 20
   ```

   Should show "online" with no errors.

2. **Check PostgreSQL Data**
   ```bash
   psql -U dpdc_prod_user -d dpdc_ami_prod -c "SELECT COUNT(*) FROM bill_stop_summary;"
   ```

   Should show a number > 0.

3. **Test in Browser**
   - Open: `http://your-server/crp-cpc`
   - Press **Ctrl+F5** (hard refresh)
   - Look for green **"Export to Excel"** button
   - Click to download
   - Verify Excel file has **13 columns** including **CPC Customer ID**

---

## What the Scripts Do

### Automated Steps:

1. **Backup** - Creates timestamped backup of entire application
2. **Pull Code** - Fetches latest changes from GitHub (commit `c729a70` or later)
3. **Verify Files** - Checks all required files exist:
   - `backend/src/config/postgresDB.js`
   - `backend/src/jobs/billStopBatchJob.js`
   - `backend/setup_bill_stop_tables.js`
   - `backend/RUN_BILL_STOP_BATCH.js`
   - `backend/migrations/create_bill_stop_tables.sql`
   - `frontend/src/views/CRPCPCView.vue`
4. **PostgreSQL Setup** - Creates 3 tables:
   - `bill_stop_summary` - CRP-level aggregated data
   - `bill_stop_details` - Individual CPC customer records
   - `bill_stop_batch_log` - Batch job execution history
5. **Install Dependencies** - `npm install` for backend and frontend
6. **Build Frontend** - Creates production-optimized bundle
7. **Deploy** - Copies files to `/var/www/html/dpdc-ami/`
8. **Restart Services** - nginx and PM2 backend
9. **Run Batch Job** - Populates PostgreSQL with data
10. **Setup Cron** - Schedules daily batch at 2 AM

### Safety Features:

- ✅ Automatic backup before any changes
- ✅ Verification at each step
- ✅ Rollback instructions if something fails
- ✅ Detailed logging of all operations
- ✅ Confirmation prompts (in interactive mode)

---

## Troubleshooting

### Script Fails During Execution

**Check the error message carefully.** The script will show exactly what went wrong.

**Common Issues:**

1. **Git pull fails (merge conflicts)**
   ```bash
   git reset --hard origin/main
   git pull origin main
   ```

2. **PostgreSQL connection fails**
   - Check `.env` file has correct credentials
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`

3. **Frontend build fails**
   - Check Node.js version: `node --version` (should be v20+)
   - Clear cache: `rm -rf node_modules/.vite`

4. **PM2 restart fails**
   - Check logs: `pm2 logs dpdc-backend --lines 50`
   - Manually restart: `pm2 restart dpdc-backend`

### Rollback

If deployment fails, restore from backup:

```bash
cd ~
rm -rf DPDC-AMI-BY-OTBL
mv DPDC-AMI-BY-OTBL-backup-YYYYMMDD_HHMMSS DPDC-AMI-BY-OTBL
cd DPDC-AMI-BY-OTBL/backend
pm2 restart dpdc-backend
```

(Replace `YYYYMMDD_HHMMSS` with your backup timestamp)

---

## Daily Batch Job

The scripts will setup a daily batch job at **2:00 AM** to refresh the data.

### Check Batch Job Status

**If using PM2 Cron:**
```bash
pm2 list
pm2 logs bill-stop-batch
```

**If using System Cron:**
```bash
crontab -l
tail -f /var/log/bill_stop_batch.log
```

### Manual Batch Run

To refresh data immediately:
```bash
cd ~/DPDC-AMI-BY-OTBL/backend
node RUN_BILL_STOP_BATCH.js
```

---

## What Changed in GitHub

**Commit:** `c729a70` - Add automated deployment scripts for CRP-CPC Export feature

**New Files:**
- `DEPLOY_CRP_CPC_EXPORT.sh` - Interactive deployment script
- `QUICK_DEPLOY_CRP_CPC.sh` - Fast deployment script
- `DEPLOYMENT_GUIDE_CRP_CPC_EXPORT.md` - Complete documentation

**These files were already in GitHub from previous commits:**
- `backend/src/config/postgresDB.js` - PostgreSQL connection config
- `backend/src/jobs/billStopBatchJob.js` - Batch job logic
- `backend/setup_bill_stop_tables.js` - Table setup script
- `backend/RUN_BILL_STOP_BATCH.js` - Manual batch runner
- `backend/migrations/create_bill_stop_tables.sql` - SQL schema
- `frontend/src/views/CRPCPCView.vue` - Export to Excel feature

---

## Next Steps

1. **SSH to Production Server**
   ```bash
   ssh oculin@your-server-ip
   ```

2. **Run Deployment Script**
   ```bash
   cd ~/DPDC-AMI-BY-OTBL
   git pull origin main
   chmod +x DEPLOY_CRP_CPC_EXPORT.sh
   bash DEPLOY_CRP_CPC_EXPORT.sh
   ```

3. **Follow On-Screen Instructions**

4. **Test in Browser**

---

## Expected Results

After successful deployment:

1. ✅ CRP-CPC page shows green **"Export to Excel"** button
2. ✅ Excel export includes **13 columns** with all customer details
3. ✅ **CPC Customer ID** column is populated
4. ✅ Export works with search/filter applied
5. ✅ Batch job runs daily at 2 AM automatically
6. ✅ No errors in PM2 logs

---

## Summary of Files Pushed to GitHub

```
✅ DEPLOY_CRP_CPC_EXPORT.sh (400 lines)
   - Interactive deployment with prompts
   - Full backup and verification
   - Setup cron job options

✅ QUICK_DEPLOY_CRP_CPC.sh (120 lines)
   - Fast deployment, no prompts
   - Same functionality, automated

✅ DEPLOYMENT_GUIDE_CRP_CPC_EXPORT.md (600 lines)
   - Complete deployment documentation
   - Troubleshooting guide
   - Maintenance procedures
```

**GitHub Repository:** https://github.com/Tanvir25aug/DPDC-AMI-BY-OTBL
**Branch:** main
**Latest Commit:** `c729a70`

---

## Support

If you encounter any issues:

1. Check the `DEPLOYMENT_GUIDE_CRP_CPC_EXPORT.md` troubleshooting section
2. Review PM2 logs: `pm2 logs dpdc-backend --lines 100`
3. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

**Ready to deploy! Just pull and run the script on production.** 🚀
