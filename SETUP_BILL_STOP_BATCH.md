# Bill Stop Batch System - Quick Setup Guide

## 🎯 What This Does

Creates a **batch job** that:
1. Runs **daily at 2:00 AM** automatically
2. Fetches **ALL bill stop data** from Oracle (10-30 minutes)
3. Saves to **PostgreSQL** for fast access
4. Makes **bill stop analysis load instantly** (< 1 second)
5. Shows **ALL data** with no limits!

---

## 🚀 Setup Steps (DO THIS NOW)

### Step 1: Install Dependencies

```bash
cd backend
npm install pg node-cron
```

### Step 2: Create PostgreSQL Tables

```bash
# Connect to your PostgreSQL database
psql -U postgres -d dpdc_ami

# Or if using password:
psql -U postgres -d dpdc_ami -W

# Then run the migration:
\i migrations/create_bill_stop_tables.sql

# Verify tables created:
\dt bill_stop*

# You should see:
# - bill_stop_summary
# - bill_stop_details
# - bill_stop_batch_log

# Exit psql:
\q
```

### Step 3: Configure Environment

Edit your `.env` file and add (if not already there):

```env
# PostgreSQL Configuration (update with your values)
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=dpdc_ami
PG_USER=postgres
PG_PASSWORD=your_postgres_password

# Bill Stop Batch Schedule
BILL_STOP_BATCH_SCHEDULE=0 2 * * *  # Daily at 2:00 AM
TZ=Asia/Dhaka
```

### Step 4: Run Initial Batch Job

**IMPORTANT:** This populates the database with initial data

```bash
cd backend
node RUN_BILL_STOP_BATCH.js
```

**What will happen:**
- Starts fetching ALL bill stop data from Oracle
- Shows progress in console
- Takes **10-30 minutes** (be patient!)
- Saves to PostgreSQL when done

**Expected output:**
```
========================================
BILL STOP BATCH JOB STARTED
Start Time: 2026-01-11T...
========================================

Step 1: Fetching bill stop details from Oracle...
✓ Fetched 25,000 bill stop records in 450.5s

Step 2: Calculating summary data...
✓ Calculated summary for 1,200 CRPs in 2.3s

Step 3: Clearing old data from PostgreSQL...
✓ Old data cleared

Step 4: Inserting summary data into PostgreSQL...
✓ Inserted 1,200 summary records in 5.2s

Step 5: Inserting details data into PostgreSQL...
  Progress: 1000/25000 records inserted...
  Progress: 2000/25000 records inserted...
  ...
✓ Inserted 25,000 detail records in 120.3s

========================================
BILL STOP BATCH JOB COMPLETED
End Time: 2026-01-11T...
Duration: 578 seconds (9.63 minutes)
Summary Records: 1,200
Detail Records: 25,000
========================================

✅ SUCCESS!
```

### Step 5: Restart Backend Server

```bash
# Stop current server (Ctrl+C)
# Then start again:
npm run dev
```

**You should see in logs:**
```
✅ Bill Stop Batch Job Scheduler started (runs daily at 2 AM)
```

### Step 6: Test in Browser

1. **Hard refresh browser**: `Ctrl+Shift+R`

2. **Go to CRP-CPC Management page**

3. **Click "Bill Stop Analysis"** (orange button)

4. **Data should load INSTANTLY** (< 1 second!)

5. **Check features:**
   - ✅ Blue info box shows last update time
   - ✅ Statistics cards show totals
   - ✅ Summary table shows CRPs
   - ✅ Details table shows ALL CPC customers
   - ✅ Export to Excel works

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

### 1. Check PostgreSQL Tables

```bash
psql -U postgres -d dpdc_ami -c "\dt bill_stop*"
```

Should show 3 tables.

### 2. Check Data Exists

```sql
psql -U postgres -d dpdc_ami -c "SELECT COUNT(*) FROM bill_stop_summary;"
psql -U postgres -d dpdc_ami -c "SELECT COUNT(*) FROM bill_stop_details;"
```

Should show row counts > 0.

### 3. Check Batch Log

```sql
psql -U postgres -d dpdc_ami -c "SELECT batch_date, status, summary_count, details_count FROM bill_stop_batch_log ORDER BY batch_date DESC LIMIT 1;"
```

Should show status='completed'.

### 4. Test API

```bash
# Get batch status
curl http://localhost:3000/api/crp-cpc/bill-stop-batch/status

# Should return JSON with isRunning=false and latestBatch info
```

### 5. Test UI

- Click "Bill Stop Analysis" → Loads instantly
- Click "Refresh Data" → Shows alert about batch starting
- Export to Excel → Downloads CSV file

---

## 📅 Daily Schedule

The batch job will now run **automatically every day at 2:00 AM**.

You don't need to do anything - it just works!

### To Change Schedule

Edit `.env`:

```env
# Every 6 hours
BILL_STOP_BATCH_SCHEDULE=0 */6 * * *

# Every Sunday at midnight
BILL_STOP_BATCH_SCHEDULE=0 0 * * 0

# Daily at 3:00 AM
BILL_STOP_BATCH_SCHEDULE=0 3 * * *
```

Then restart server.

---

## 🔄 Manual Refresh

If you need to update data before 2:00 AM:

### Option 1: Click Button in UI

1. Go to CRP-CPC page
2. Click purple **"Refresh Data"** button
3. Wait 10-30 minutes
4. Data will auto-update

### Option 2: Run Command

```bash
cd backend
node RUN_BILL_STOP_BATCH.js
```

### Option 3: Use API

```bash
curl -X POST http://localhost:3000/api/crp-cpc/bill-stop-batch/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### "Tables don't exist" Error

**Fix:**
```bash
cd backend
psql -U postgres -d dpdc_ami -f migrations/create_bill_stop_tables.sql
```

### Batch Job Fails

**Check logs:**
```bash
tail -f logs/combined.log | grep "Bill Stop"
```

**Check database:**
```sql
SELECT * FROM bill_stop_batch_log WHERE status = 'failed' ORDER BY batch_date DESC LIMIT 1;
```

### No Data in UI

**Run initial batch:**
```bash
node RUN_BILL_STOP_BATCH.js
```

### "Connection refused" PostgreSQL Error

**Check PostgreSQL is running:**
```bash
# Windows
net start postgresql-x64-14

# Linux
sudo systemctl start postgresql
```

**Check credentials in `.env`** match your PostgreSQL setup.

---

## 📊 What Changed

### Old System ❌
- Direct Oracle queries
- Timeout after 2 minutes
- Limited to 5,000-10,000 rows
- Slow and unreliable

### New System ✅
- Daily batch job to PostgreSQL
- Load data in < 1 second
- ALL data (no limits)
- Fast and reliable

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `migrations/create_bill_stop_tables.sql` | Creates PostgreSQL tables |
| `RUN_BILL_STOP_BATCH.js` | Manual batch run script |
| `src/jobs/billStopBatchJob.js` | Batch job logic |
| `src/jobs/scheduler.js` | Daily scheduler |
| `BILL_STOP_BATCH_SYSTEM.md` | Complete documentation |

---

## 🎯 Next Steps

1. ✅ Setup complete? Great!
2. 📊 Test the analysis - it should be lightning fast
3. 📅 Wait for tomorrow's 2:00 AM run
4. 🔍 Monitor logs to ensure batch succeeds
5. 🎉 Enjoy unlimited, fast bill stop analysis!

---

## 🆘 Need Help?

1. Read: `BILL_STOP_BATCH_SYSTEM.md` (detailed docs)
2. Check: Backend logs (`logs/combined.log`)
3. Verify: PostgreSQL tables and data
4. Test: Manual batch run

**Still stuck?** Contact system administrator.

---

**You're ready to go!** 🚀

The bill stop analysis will now:
- ✅ Show ALL data instantly
- ✅ Auto-update daily
- ✅ Never timeout
- ✅ Work reliably

Enjoy! 🎉
