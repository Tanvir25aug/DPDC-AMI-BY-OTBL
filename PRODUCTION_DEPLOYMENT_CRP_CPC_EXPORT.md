# Production Deployment Guide - CRP-CPC Export Enhancement

## Overview
This guide explains how to deploy the CRP-CPC Enhanced Export feature to production, including database migration and service restart.

## Prerequisites

Before starting, ensure you have:
- SSH access to production server
- PostgreSQL admin credentials
- Git installed on production server
- Node.js and npm installed
- PM2 or service manager access

## Step-by-Step Deployment

### Step 1: Backup Current System

**1.1 Backup Database (PostgreSQL)**
```bash
# SSH into production server
ssh user@production-server

# Backup PostgreSQL database
pg_dump -U dpdc_user -d dpdc_ami > backup_$(date +%Y%m%d_%H%M%S).sql

# Or if using different credentials:
pg_dump -U your_postgres_user -d your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

**1.2 Backup Code**
```bash
cd /path/to/DPDC-AMI-BY-OTBL
cp -r . ../DPDC-AMI-BY-OTBL-backup-$(date +%Y%m%d_%H%M%S)
```

### Step 2: Pull Latest Code from GitHub

```bash
# Navigate to application directory
cd /path/to/DPDC-AMI-BY-OTBL

# Check current branch
git branch

# Pull latest changes
git pull origin main

# Verify the commit
git log --oneline -3
# Should show: 8db8085 CRP-CPC Enhanced Export and Backend Filtering Implementation
```

### Step 3: Database Migration (PostgreSQL)

The new features require PostgreSQL tables for bill stop batch data.

**3.1 Setup PostgreSQL Tables**

```bash
cd backend

# Run the migration script
node setup_bill_stop_tables.js
```

**Expected Output:**
```
[Bill Stop Setup] Starting PostgreSQL table setup...
[Bill Stop Setup] Creating bill_stop_summary table...
[Bill Stop Setup] ✓ Table bill_stop_summary created successfully
[Bill Stop Setup] Creating bill_stop_details table...
[Bill Stop Setup] ✓ Table bill_stop_details created successfully
[Bill Stop Setup] Creating bill_stop_batch_log table...
[Bill Stop Setup] ✓ Table bill_stop_batch_log created successfully
[Bill Stop Setup] Creating indexes...
[Bill Stop Setup] ✓ All indexes created successfully
[Bill Stop Setup] ✓ PostgreSQL tables setup complete!
```

**If you get connection errors**, update the PostgreSQL credentials in the script:

```bash
# Edit the setup script
nano setup_bill_stop_tables.js

# Update these values:
const pgPool = new Pool({
  user: 'your_postgres_user',      # Update this
  host: 'localhost',                # Update if different
  database: 'your_database_name',   # Update this
  password: 'your_postgres_password', # Update this
  port: 5432
});
```

**3.2 Verify Tables Created**

```bash
# Connect to PostgreSQL
psql -U your_postgres_user -d your_database_name

# List tables
\dt

# Should see:
# bill_stop_summary
# bill_stop_details
# bill_stop_batch_log

# Check table structure
\d bill_stop_summary

# Exit psql
\q
```

### Step 4: Install Dependencies (if needed)

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 5: Build Frontend

```bash
cd frontend

# Build for production
npm run build

# This creates/updates the dist/ folder
```

### Step 6: Run Initial Bill Stop Batch Job

Before restarting services, run the initial batch to populate data:

```bash
cd backend

# Run the batch job manually first time
node RUN_BILL_STOP_BATCH.js
```

**Expected Output:**
```
[Bill Stop Batch] Starting bill stop analysis batch job...
[Bill Stop Batch] Running for date: 2026-01-13
[Bill Stop Batch] Batch started, ID: 1
[Bill Stop Batch] Processing batch in background...
[Bill Stop Batch] Checking batch status in 10 seconds...
[Bill Stop Batch] ✓ Batch completed successfully!
[Bill Stop Batch] - Processed: 18038 CRPs
[Bill Stop Batch] - Duration: 45 seconds
```

**If batch takes too long** (more than 5 minutes), you can run it in background:

```bash
# Run in background with nohup
nohup node RUN_BILL_STOP_BATCH.js > batch_output.log 2>&1 &

# Monitor progress
tail -f batch_output.log

# Or use screen/tmux
screen -S batch
node RUN_BILL_STOP_BATCH.js
# Press Ctrl+A, then D to detach
```

### Step 7: Setup Scheduled Batch Job (Cron)

The bill stop batch should run daily at 2:00 AM.

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2:00 AM):
0 2 * * * cd /path/to/DPDC-AMI-BY-OTBL/backend && /usr/bin/node RUN_BILL_STOP_BATCH.js >> /var/log/bill_stop_batch.log 2>&1

# Save and exit

# Verify crontab
crontab -l
```

**Alternative: Using PM2 Cron**

```bash
# If using PM2, add to ecosystem.config.js:
{
  name: 'bill-stop-batch',
  script: 'RUN_BILL_STOP_BATCH.js',
  cron_restart: '0 2 * * *',
  autorestart: false
}

# Then reload PM2
pm2 reload ecosystem.config.js
```

### Step 8: Restart Backend Service

**If using PM2:**

```bash
cd backend

# Restart the backend service
pm2 restart dpdc-ami-backend

# Or restart all
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs dpdc-ami-backend --lines 50
```

**If using systemd:**

```bash
# Restart the service
sudo systemctl restart dpdc-ami-backend

# Check status
sudo systemctl status dpdc-ami-backend

# View logs
sudo journalctl -u dpdc-ami-backend -f
```

**If using manual node process:**

```bash
# Kill old process
pkill -f "node.*server.js"

# Or find and kill by PID
ps aux | grep node
kill <PID>

# Start new process
cd backend
nohup node src/server.js > server.log 2>&1 &
```

### Step 9: Restart Frontend (if needed)

**If serving with nginx:**

```bash
# Copy new build to nginx
sudo cp -r /path/to/DPDC-AMI-BY-OTBL/frontend/dist/* /var/www/html/dpdc-ami/

# Restart nginx
sudo systemctl restart nginx
```

**If using serve or PM2:**

```bash
cd frontend

# Restart with PM2
pm2 restart dpdc-ami-frontend

# Or if using serve
pm2 delete dpdc-ami-frontend
pm2 start "npx serve -s dist -p 3000" --name dpdc-ami-frontend
```

### Step 10: Verify Deployment

**10.1 Check Backend Health**

```bash
# Test backend API
curl http://localhost:5000/api/health

# Check if new endpoint exists
curl -X GET "http://localhost:5000/api/crp-cpc/export/detailed?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**10.2 Check PostgreSQL Tables Have Data**

```bash
psql -U your_postgres_user -d your_database_name

# Check if batch data exists
SELECT COUNT(*) FROM bill_stop_summary;
# Should return 18038 (or close to it)

# Check latest batch
SELECT * FROM bill_stop_batch_log ORDER BY started_at DESC LIMIT 1;

# Exit
\q
```

**10.3 Test Frontend**

1. Open browser: http://your-production-url
2. Navigate to CRP-CPC page
3. Click "Export to Excel" button
4. Verify Excel file downloads with 13 columns
5. Check file contains CPC Customer ID, Name, Address, etc.

**10.4 Test Filters**

1. Apply filter: "Bill Stop Status" = "Has Issues"
2. Should show filtered CRPs (not all 18,000)
3. Click "Export to Excel"
4. Verify exported file only contains filtered CRPs

**10.5 Test Search**

1. Search for CPC customer ID (e.g., "15406365")
2. Should show matching CRP
3. Apply filter + search together
4. Verify both work correctly

### Step 11: Monitor Logs

**Backend Logs:**
```bash
# If using PM2
pm2 logs dpdc-ami-backend --lines 100

# If using systemd
sudo journalctl -u dpdc-ami-backend -f

# If using nohup
tail -f backend/server.log
```

**Look for these log messages:**
```
[CRP-CPC Controller] Using batch date: 2026-01-13
[CRP-CPC Export] Getting detailed export with filters
[CRP-CPC Export] Found 890 filtered CRPs
[CRP-CPC Export] Returning 44500 CPC customer records
```

**Batch Job Logs:**
```bash
# View cron job logs
tail -f /var/log/bill_stop_batch.log

# Or if using PM2
pm2 logs bill-stop-batch
```

## Database Schema Reference

### Table: bill_stop_summary

```sql
CREATE TABLE bill_stop_summary (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    crp_account_no VARCHAR(50) NOT NULL,
    total_cpc_count INTEGER DEFAULT 0,
    bill_stop_count INTEGER DEFAULT 0,
    active_billing_count INTEGER DEFAULT 0,
    billed_this_month INTEGER DEFAULT 0,
    not_billed_this_month INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_date, crp_account_no)
);

CREATE INDEX idx_bill_stop_summary_date ON bill_stop_summary(batch_date);
CREATE INDEX idx_bill_stop_summary_crp ON bill_stop_summary(crp_account_no);
CREATE INDEX idx_bill_stop_summary_counts ON bill_stop_summary(
    total_cpc_count, bill_stop_count, active_billing_count
);
```

### Table: bill_stop_details

```sql
CREATE TABLE bill_stop_details (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    crp_account_no VARCHAR(50),
    cpc_customer_no VARCHAR(50),
    meter_no VARCHAR(50),
    has_bill_stop BOOLEAN DEFAULT FALSE,
    bill_stop_reason TEXT,
    last_bill_date DATE,
    billed_this_month BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bill_stop_details_date ON bill_stop_details(batch_date);
CREATE INDEX idx_bill_stop_details_crp ON bill_stop_details(crp_account_no);
CREATE INDEX idx_bill_stop_details_cpc ON bill_stop_details(cpc_customer_no);
```

### Table: bill_stop_batch_log

```sql
CREATE TABLE bill_stop_batch_log (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running',
    crps_processed INTEGER DEFAULT 0,
    cpcs_processed INTEGER DEFAULT 0,
    errors TEXT,
    duration_seconds INTEGER
);

CREATE INDEX idx_bill_stop_batch_log_date ON bill_stop_batch_log(batch_date);
CREATE INDEX idx_bill_stop_batch_log_status ON bill_stop_batch_log(status);
```

## Environment Variables

Ensure these are set in production `.env` file:

```bash
# Backend .env
NODE_ENV=production
PORT=5000

# Oracle Database
ORACLE_USER=your_oracle_user
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=//host:port/service_name

# PostgreSQL Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=your_database_name
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=24h

# Cache
CACHE_TTL=300

# Batch Job
BILL_STOP_BATCH_ENABLED=true
```

## Troubleshooting

### Issue 1: Tables Already Exist

**Error:** `relation "bill_stop_summary" already exists`

**Solution:**
```bash
# Drop existing tables and recreate
psql -U your_postgres_user -d your_database_name

DROP TABLE IF EXISTS bill_stop_details CASCADE;
DROP TABLE IF EXISTS bill_stop_summary CASCADE;
DROP TABLE IF EXISTS bill_stop_batch_log CASCADE;

\q

# Run setup again
node setup_bill_stop_tables.js
```

### Issue 2: Batch Job Fails

**Error:** `Error getting latest batch date`

**Solution:**
```bash
# Check PostgreSQL connection
psql -U your_postgres_user -d your_database_name

# Test connection in Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'your_postgres_user',
  host: 'localhost',
  database: 'your_database_name',
  password: 'your_postgres_password',
  port: 5432
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? 'Error: ' + err : 'Connected: ' + res.rows[0].now);
  pool.end();
});
"
```

### Issue 3: Export Shows No Data

**Error:** Alert shows "No data to export"

**Causes:**
1. Batch job hasn't run yet
2. No data in PostgreSQL tables
3. Wrong batch date being queried

**Solution:**
```bash
# Check if batch data exists
psql -U your_postgres_user -d your_database_name

SELECT batch_date, COUNT(*)
FROM bill_stop_summary
GROUP BY batch_date
ORDER BY batch_date DESC;

# If no data, run batch manually
cd backend
node RUN_BILL_STOP_BATCH.js
```

### Issue 4: Export Takes Too Long

**Issue:** Export button shows "Exporting..." for more than 5 minutes

**Causes:**
1. Too many CRPs selected (1000+ CRPs)
2. Slow Oracle queries
3. Network issues

**Solution:**
```bash
# Reduce limit in frontend (temporary fix)
# Edit frontend/src/views/CRPCPCView.vue line 1014:
limit: 100,  # Reduce from 1000 to 100

# Or add more indexes to Oracle tables (contact DBA)
# Or implement batch query optimization (future enhancement)
```

### Issue 5: Permission Denied

**Error:** `permission denied for table bill_stop_summary`

**Solution:**
```bash
# Grant permissions to user
psql -U postgres -d your_database_name

GRANT ALL PRIVILEGES ON TABLE bill_stop_summary TO your_postgres_user;
GRANT ALL PRIVILEGES ON TABLE bill_stop_details TO your_postgres_user;
GRANT ALL PRIVILEGES ON TABLE bill_stop_batch_log TO your_postgres_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_postgres_user;

\q
```

## Rollback Procedure

If something goes wrong and you need to rollback:

### Rollback Code

```bash
cd /path/to/DPDC-AMI-BY-OTBL

# Rollback to previous commit
git reset --hard 69cb46d

# Restart services
pm2 restart all
```

### Rollback Database

```bash
# Drop new tables
psql -U your_postgres_user -d your_database_name

DROP TABLE IF EXISTS bill_stop_details CASCADE;
DROP TABLE IF EXISTS bill_stop_summary CASCADE;
DROP TABLE IF EXISTS bill_stop_batch_log CASCADE;

\q
```

### Remove Cron Job

```bash
crontab -e
# Remove the line with RUN_BILL_STOP_BATCH.js
# Save and exit
```

## Post-Deployment Checklist

- [ ] Code pulled from GitHub successfully
- [ ] PostgreSQL tables created (bill_stop_summary, bill_stop_details, bill_stop_batch_log)
- [ ] Initial batch job completed successfully
- [ ] Cron job scheduled for daily 2:00 AM
- [ ] Backend service restarted
- [ ] Frontend rebuilt and deployed
- [ ] Export button works and downloads file
- [ ] Excel file has 13 columns with CPC customer data
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Filters + search work together
- [ ] Logs show no errors
- [ ] Batch job runs successfully (wait for next day or run manually)
- [ ] Team notified of deployment

## Performance Monitoring

Monitor these metrics after deployment:

1. **API Response Time**
   - `/crp-cpc/list` should respond in < 2 seconds
   - `/crp-cpc/export/detailed` can take 2-5 minutes for large exports

2. **Database Queries**
   - PostgreSQL queries should be < 100ms
   - Oracle queries can be 200-500ms per CRP

3. **Batch Job Performance**
   - Should complete in 5-10 minutes for 18,000 CRPs
   - Should run daily at 2:00 AM

4. **Disk Space**
   - PostgreSQL tables will use ~50-100 MB
   - Log files should be rotated regularly

## Support

If you encounter issues:

1. Check logs: `pm2 logs` or `journalctl -u dpdc-ami-backend`
2. Check database connectivity
3. Verify environment variables in `.env`
4. Test API endpoints with curl
5. Contact development team

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________
**Issues Found:** _____________

**Notes:**
