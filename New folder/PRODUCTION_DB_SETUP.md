# Production Database Setup Guide - NOCS Balance Summary

## Overview
This guide covers setting up the NOCS Balance Summary feature in production, including PostgreSQL migrations and scheduler configuration.

---

## Prerequisites

1. ✅ Production server with Node.js installed
2. ✅ PostgreSQL database access
3. ✅ Oracle CC&B database read access
4. ✅ Environment variables configured

---

## Step 1: Backup Production Database (CRITICAL!)

```bash
# SSH into production server
ssh user@your-production-server

# Backup PostgreSQL database
pg_dump -U dpdc_user -d dpdc_ami_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Or if using Docker:
docker exec dpdc-postgres pg_dump -U dpdc_user dpdc_ami_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Step 2: Pull Latest Code

```bash
# Navigate to project directory
cd /path/to/DPDC-AMI-BY-OTBL

# Pull latest changes from GitHub
git pull origin main

# Install any new dependencies
cd backend
npm install
```

---

## Step 3: Run Database Migrations

### Option A: Using Sequelize CLI (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run migrations
npx sequelize-cli db:migrate

# Expected output:
# ✓ 20250201000003-create-nocs-balance-summary.js migrated
# ✓ 20250201000004-rename-balance-columns.js migrated
```

### Option B: Manual SQL Execution (If Sequelize fails)

If you encounter issues with Sequelize, run migrations manually:

#### Migration 1: Create Table

```sql
-- Connect to PostgreSQL
psql -U dpdc_user -d dpdc_ami_db

-- Run this SQL:
CREATE TABLE IF NOT EXISTS nocs_balance_summary (
  id SERIAL PRIMARY KEY,
  nocs_name VARCHAR(200) NOT NULL,
  nocs_code VARCHAR(50) NOT NULL UNIQUE,
  total_customers INTEGER NOT NULL DEFAULT 0,
  positive_qty INTEGER NOT NULL DEFAULT 0,
  positive_balance_amt DECIMAL(15, 2) NOT NULL DEFAULT 0,
  negative_qty INTEGER NOT NULL DEFAULT 0,
  negative_balance_amt DECIMAL(15, 2) NOT NULL DEFAULT 0,
  net_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  refresh_duration INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE UNIQUE INDEX idx_nocs_code ON nocs_balance_summary(nocs_code);
CREATE INDEX idx_updated_at ON nocs_balance_summary(updated_at);
CREATE INDEX idx_nocs_name ON nocs_balance_summary(nocs_name);

-- Verify table creation
\dt nocs_balance_summary
\d nocs_balance_summary
```

#### Migration 2: Rename Columns

```sql
-- Connect to PostgreSQL
psql -U dpdc_user -d dpdc_ami_db

-- Rename columns
ALTER TABLE nocs_balance_summary RENAME COLUMN positive_qty TO credit_qty;
ALTER TABLE nocs_balance_summary RENAME COLUMN positive_balance_amt TO credit_balance_amt;
ALTER TABLE nocs_balance_summary RENAME COLUMN negative_qty TO due_qty;
ALTER TABLE nocs_balance_summary RENAME COLUMN negative_balance_amt TO due_balance_amt;

-- Verify column renaming
\d nocs_balance_summary
```

---

## Step 4: Verify Database Schema

```sql
-- Connect to PostgreSQL
psql -U dpdc_user -d dpdc_ami_db

-- Check table structure
\d nocs_balance_summary

-- Expected columns:
-- id, nocs_name, nocs_code, total_customers
-- credit_qty, credit_balance_amt
-- due_qty, due_balance_amt
-- net_balance, refresh_duration
-- created_at, updated_at

-- Check indexes
\di nocs_balance_summary*
```

---

## Step 5: Configure Environment Variables

Ensure these are set in production `.env` file:

```bash
# Oracle Connection (Read-only)
ORACLE_USER=CISREAD
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=your_oracle_host:1521/SERVICE_NAME

# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dpdc_ami_db
DB_USER=dpdc_user
DB_PASSWORD=your_postgres_password
DB_DIALECT=postgres
```

---

## Step 6: Test Migration Success

```bash
# Start Node.js backend
cd backend
npm run dev

# Check logs for scheduler startup:
# [NOCS Balance Scheduler] Starting NOCS Balance Scheduler
# [NOCS Balance Scheduler] Scheduler started successfully
# [NOCS Balance Scheduler] Starting NOCS balance refresh...
```

---

## Step 7: Manual Test Query

```bash
# Test if scheduler populated data
psql -U dpdc_user -d dpdc_ami_db

SELECT
  nocs_name,
  nocs_code,
  total_customers,
  credit_qty,
  credit_balance_amt,
  due_qty,
  due_balance_amt,
  net_balance,
  updated_at
FROM nocs_balance_summary
ORDER BY nocs_name
LIMIT 5;

-- Should return 17 NOCS areas with data
-- If empty, scheduler is still running (takes 5-10 min)
```

---

## Step 8: Production Deployment

### Using PM2 (Recommended)

```bash
# Navigate to backend
cd backend

# Stop existing process
pm2 stop dpdc-ami-backend

# Start with latest code
pm2 start src/server.js --name dpdc-ami-backend

# Monitor logs
pm2 logs dpdc-ami-backend

# Save PM2 configuration
pm2 save
```

### Using systemd

```bash
# Restart service
sudo systemctl restart dpdc-ami-backend

# Check status
sudo systemctl status dpdc-ami-backend

# View logs
sudo journalctl -u dpdc-ami-backend -f
```

### Using Docker

```bash
# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
```

---

## Step 9: Verify Production Deployment

### Check Backend Health

```bash
# Test API endpoint
curl http://your-production-server:3000/api/reports/nocs_balance_summary

# Should return JSON with NOCS data
```

### Check Frontend

1. Navigate to: `http://your-production-server/nocs-balance-summary`
2. Verify data loads correctly
3. Check that Credit/Due labels are correct
4. Verify bar chart displays

---

## Monitoring & Maintenance

### Check Scheduler Status

```bash
# Via API (create endpoint if needed)
curl http://localhost:3000/api/reports/nocs_balance_status

# Via Database
psql -U dpdc_user -d dpdc_ami_db -c "
SELECT
  COUNT(*) as total_nocs,
  MAX(updated_at) as last_refresh,
  EXTRACT(EPOCH FROM (NOW() - MAX(updated_at)))/60 as minutes_since_refresh
FROM nocs_balance_summary;"
```

### Expected Behavior

- **Initial startup**: Scheduler runs immediately (takes 5-10 min)
- **Hourly refresh**: Every 60 minutes automatically
- **Data age**: Should never be more than 65 minutes old
- **Total NOCS**: Should show 17 areas
- **Total customers**: Around 230,000+

---

## Troubleshooting

### Issue: Migrations Fail

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Run specific migration
npx sequelize-cli db:migrate --to 20250201000003-create-nocs-balance-summary.js
```

### Issue: No Data After 10 Minutes

```bash
# Check backend logs
pm2 logs dpdc-ami-backend --lines 100

# Look for errors:
# - Oracle connection issues
# - SQL query errors
# - PostgreSQL write errors

# Manual trigger (if needed)
# Add this to reports.controller.js temporarily:
# await nocsBalanceScheduler.forceRefresh();
```

### Issue: Scheduler Not Starting

```bash
# Check server.js logs
# Ensure this line exists:
# nocsBalanceScheduler.startScheduler();

# Restart backend
pm2 restart dpdc-ami-backend

# Check logs immediately
pm2 logs dpdc-ami-backend --lines 50
```

### Issue: Permission Denied on PostgreSQL

```sql
-- Grant permissions to dpdc_user
GRANT ALL PRIVILEGES ON TABLE nocs_balance_summary TO dpdc_user;
GRANT USAGE, SELECT ON SEQUENCE nocs_balance_summary_id_seq TO dpdc_user;
```

---

## Rollback Procedure (Emergency)

If something goes wrong:

```bash
# 1. Stop backend
pm2 stop dpdc-ami-backend

# 2. Rollback migrations
cd backend
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate:undo

# 3. Restore backup
psql -U dpdc_user -d dpdc_ami_db < backup_YYYYMMDD_HHMMSS.sql

# 4. Checkout previous git commit
git checkout c6f2fc8

# 5. Restart backend
pm2 restart dpdc-ami-backend
```

---

## Performance Tuning

### If Oracle Query Takes Too Long

Edit `backend/reports/nocs_balance_summary.sql`:

```sql
-- Add PARALLEL hint (already included)
SELECT /*+ PARALLEL(4) */ ...

-- Or increase parallel workers
SELECT /*+ PARALLEL(8) */ ...
```

### If PostgreSQL Writes Are Slow

```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('nocs_balance_summary'));

-- Rebuild indexes (run during off-hours)
REINDEX TABLE nocs_balance_summary;

-- Vacuum table
VACUUM ANALYZE nocs_balance_summary;
```

---

## Post-Deployment Checklist

- [ ] Migrations completed successfully
- [ ] Table `nocs_balance_summary` exists with correct columns
- [ ] Scheduler started and running
- [ ] Initial data populated (17 NOCS areas)
- [ ] Frontend displays data correctly
- [ ] Credit/Due labels are accurate
- [ ] Bar chart renders properly
- [ ] API endpoint responds quickly (<100ms)
- [ ] Logs show hourly refresh cycles
- [ ] PM2/systemd service is stable
- [ ] Monitoring alerts configured

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files
- Use read-only Oracle credentials
- Ensure PostgreSQL user has minimal required permissions
- Keep database backups for 30 days
- Monitor for unusual query patterns

---

## Support

If you encounter issues:

1. Check backend logs: `pm2 logs dpdc-ami-backend`
2. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/*.log`
3. Verify Oracle connection: Test with SQL Developer
4. Review migration files for syntax errors

---

## Summary

**Time Required:** 15-30 minutes
**Downtime:** ~2 minutes (for backend restart)
**Risk Level:** Low (migrations are additive, no data loss)
**Reversibility:** High (easy rollback available)

The NOCS Balance Summary feature is production-ready and tested with 230K+ customers across 17 NOCS areas! 🚀
