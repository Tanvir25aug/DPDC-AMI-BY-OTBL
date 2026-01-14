# NOCS Balance Summary - PostgreSQL Cache Deployment Guide

## 🎉 **COMPLETE IMPLEMENTATION - PostgreSQL Cache**

Perfect choice! PostgreSQL cache is the **BEST solution** for your use case.

---

## 💰 **Understanding CREDIT vs DUE**

### **CREDIT (Positive Balance) = Customer Paid Extra** ✅
```
Example:
  Monthly bill: ₹1,000
  Customer paid: ₹1,500
  Balance in Oracle (TOT_AMT): +₹500

✅ Customer has ₹500 CREDIT (advance payment)
✅ Shows as POSITIVE_BALANCE_AMT in report
✅ Displayed in GREEN on frontend
```

### **DUE (Negative Balance) = Customer Owes Money** ❌
```
Example:
  Monthly bill: ₹1,000
  Customer paid: ₹500
  Balance in Oracle (TOT_AMT): -₹500

❌ Customer has ₹500 DUE (unpaid)
❌ Shows as NEGATIVE_BALANCE_AMT in report
❌ Displayed in RED on frontend
```

---

## 🎯 **How PostgreSQL Cache Works**

```
┌─────────────────────────────────────────────┐
│  SCHEDULER (Runs Every Hour)                │
│  ↓                                           │
│  Step 1: Query Oracle CC&B Database         │
│          (READ ONLY - 5-10 minutes)          │
│          For 3 lakh+ customers               │
│  ↓                                           │
│  Step 2: Get 17 NOCS area summaries         │
│  ↓                                           │
│  Step 3: DELETE old data from PostgreSQL    │
│  ↓                                           │
│  Step 4: INSERT new data to PostgreSQL      │
│          (Takes <1 second)                   │
│  ↓                                           │
│  Step 5: COMMIT transaction                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  USER VISITS PAGE                           │
│  ↓                                           │
│  Backend: SELECT * FROM nocs_balance_summary│
│  ↓                                           │
│  PostgreSQL returns INSTANTLY                │
│  Duration: <0.05 seconds ⚡                 │
│  ↓                                           │
│  Frontend displays data                     │
└─────────────────────────────────────────────┘
```

---

## ✅ **Why PostgreSQL is Better**

| Feature | Memory Cache | PostgreSQL Cache |
|---------|--------------|------------------|
| **Survives restart** | ❌ No | ✅ Yes |
| **Multiple servers** | ❌ Each has own | ✅ Shared |
| **Easy to monitor** | ❌ Hard | ✅ SQL queries |
| **Transaction safe** | ❌ No | ✅ ACID |
| **Can see data** | ❌ No | ✅ Direct SQL |
| **Speed** | 0.01s | 0.05s (negligible) |

**Winner: PostgreSQL!** 🏆

---

## 📁 **Files Created/Modified**

### **✅ New Files:**
1. `backend/src/models/NocsBalanceSummary.js` - Sequelize model
2. `backend/migrations/20251126000000-create-nocs-balance-summary.js` - Migration
3. `New folder/NOCS_BALANCE_POSTGRESQL_DEPLOYMENT.md` - This guide

### **✅ Updated Files:**
4. `backend/src/models/index.js` - Export new model
5. `backend/src/services/nocs-balance-scheduler.service.js` - Use PostgreSQL
6. `backend/src/controllers/reports.controller.js` - Updated comments
7. `backend/src/server.js` - Already starts scheduler

### **✅ No Changes Needed:**
8. `backend/reports/nocs_balance_summary.sql` - Still queries Oracle (read-only)
9. `frontend/*` - Frontend already complete
10. Oracle database - NO writes, read-only access only

---

## 🚀 **Deployment Steps (15 Minutes)**

### **Step 1: Run Database Migration** ⏱️ 2 minutes

```bash
cd backend

# Run migration to create PostgreSQL table
npm run migrate

# or
npx sequelize-cli db:migrate
```

**Expected Output:**
```
== 20251126000000-create-nocs-balance-summary: migrating =======
✅ NOCS Balance Summary table created successfully
== 20251126000000-create-nocs-balance-summary: migrated (0.123s)
```

**Verify table created:**
```bash
# Connect to PostgreSQL
psql -U your_user -d your_database

# Check table exists
\dt nocs_balance_summary

# See table structure
\d nocs_balance_summary

# Exit
\q
```

---

### **Step 2: Restart Backend Server** ⏱️ 1 minute

```bash
cd backend
npm start
```

**Watch Console Output:**
```
✅ PostgreSQL connected successfully
✅ Oracle connection pool initialized
✅ NOCS Balance Scheduler started (runs hourly)
🚀 Server running on port 5000
========================================
[NOCS Balance Scheduler] Starting NOCS balance refresh...
[NOCS Balance Scheduler] Start time: 2025-11-26T10:00:00.000Z
========================================
[NOCS Balance Scheduler] Executing Oracle query...
```

**Wait 5-10 minutes for initial load...**

```
[NOCS Balance Scheduler] Oracle query completed. Retrieved 17 NOCS areas
[NOCS Balance Scheduler] Clearing old PostgreSQL data...
[NOCS Balance Scheduler] Old data cleared
[NOCS Balance Scheduler] Inserting fresh data into PostgreSQL...
[NOCS Balance Scheduler] Inserted 17 records
[NOCS Balance Scheduler] Transaction committed successfully
========================================
[NOCS Balance Scheduler] NOCS balance refresh completed successfully
[NOCS Balance Scheduler] End time: 2025-11-26T10:08:32.000Z
[NOCS Balance Scheduler] Duration: 512.45 seconds
[NOCS Balance Scheduler] NOCS areas processed: 17
[NOCS Balance Scheduler] Data saved to PostgreSQL table: nocs_balance_summary
[NOCS Balance Scheduler] Next refresh: 2025-11-26T11:00:00.000Z
========================================
```

---

### **Step 3: Verify Data in PostgreSQL** ⏱️ 2 minutes

```bash
# Connect to PostgreSQL
psql -U your_user -d your_database
```

```sql
-- Check data exists
SELECT COUNT(*) FROM nocs_balance_summary;
-- Should show: 17

-- See all NOCS data
SELECT
    nocs_name,
    total_customers,
    positive_balance_amt,
    negative_balance_amt,
    net_balance,
    updated_at
FROM nocs_balance_summary
ORDER BY nocs_name;

-- Check last update time
SELECT MAX(updated_at) AS last_updated FROM nocs_balance_summary;

-- Get summary across all NOCS
SELECT
    COUNT(*) as total_nocs,
    SUM(total_customers) as total_customers,
    SUM(positive_balance_amt) as total_credit,
    SUM(negative_balance_amt) as total_due,
    SUM(net_balance) as net_balance
FROM nocs_balance_summary;
```

**Example Output:**
```
 nocs_name | total_customers | positive_balance_amt | negative_balance_amt | net_balance  | updated_at
-----------+-----------------+----------------------+----------------------+-------------+---------------------------
 Adabor    |           18500 |          2500000.50  |         -8500000.75  | -6000000.25 | 2025-11-26 10:08:32
 Banasree  |           22000 |          3200000.00  |         -9800000.50  | -6600000.50 | 2025-11-26 10:08:32
 ...
```

---

### **Step 4: Test Backend API** ⏱️ 2 minutes

**Test with curl:**
```bash
curl -X GET http://localhost:5000/api/reports/nocs_balance_summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Or use Postman:**
```
GET http://localhost:5000/api/reports/nocs_balance_summary
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Expected Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nocs_name": "Adabor",
      "nocs_code": "001",
      "total_customers": 18500,
      "positive_qty": 5200,
      "positive_balance_amt": "2500000.50",
      "negative_qty": 13300,
      "negative_balance_amt": "-8500000.75",
      "net_balance": "-6000000.25",
      "refresh_duration": 512450,
      "created_at": "2025-11-26T10:08:32.000Z",
      "updated_at": "2025-11-26T10:08:32.000Z"
    }
  ],
  "count": 17,
  "lastUpdated": "2025-11-26T10:08:32.000Z",
  "ageMinutes": 5,
  "source": "postgresql_cache",
  "cached": true,
  "timestamp": "2025-11-26T10:13:15.000Z"
}
```

**Test Manual Refresh:**
```bash
curl -X GET "http://localhost:5000/api/reports/nocs_balance_summary?refresh=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This triggers immediate refresh (takes 5-10 minutes).

---

### **Step 5: Test Frontend** ⏱️ 2 minutes

```bash
cd frontend
npm run dev
```

**Open browser:**
```
http://localhost:5173/nocs-balance-summary
```

**Verify:**
- ✅ Summary cards show totals
- ✅ Table displays all 17 NOCS areas
- ✅ Color coding works (green=credit, red=due)
- ✅ "Last Updated" shows timestamp
- ✅ Export to Excel works
- ✅ Refresh button triggers reload
- ✅ Data loads instantly (<0.5 seconds)

---

## 🔧 **Configuration**

### **Change Refresh Interval:**

Edit `backend/src/services/nocs-balance-scheduler.service.js` line 23:

```javascript
// Current: Every 1 hour
const REFRESH_INTERVAL = 60 * 60 * 1000;

// Examples:
const REFRESH_INTERVAL = 30 * 60 * 1000;      // 30 minutes
const REFRESH_INTERVAL = 2 * 60 * 60 * 1000;  // 2 hours
const REFRESH_INTERVAL = 6 * 60 * 60 * 1000;  // 6 hours
```

Restart server after changing.

---

## 📊 **Monitoring**

### **Check PostgreSQL Data:**

```sql
-- See all cached data
SELECT * FROM nocs_balance_summary ORDER BY nocs_name;

-- Check data age
SELECT
    nocs_name,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 AS age_minutes
FROM nocs_balance_summary
LIMIT 1;

-- Find NOCS with most due
SELECT nocs_name, negative_balance_amt
FROM nocs_balance_summary
ORDER BY negative_balance_amt ASC
LIMIT 5;

-- Find NOCS with most credit
SELECT nocs_name, positive_balance_amt
FROM nocs_balance_summary
ORDER BY positive_balance_amt DESC
LIMIT 5;

-- Get totals
SELECT
    SUM(total_customers) as total_customers,
    SUM(positive_balance_amt) as total_credit,
    SUM(ABS(negative_balance_amt)) as total_due,
    SUM(net_balance) as net_balance
FROM nocs_balance_summary;
```

### **Check Backend Logs:**

```bash
cd backend

# Watch live logs
tail -f logs/combined.log | grep "NOCS Balance"

# Check for errors
grep "ERROR" logs/error.log | grep "NOCS Balance"

# Check last refresh
grep "refresh completed successfully" logs/combined.log | tail -1
```

---

## 🐛 **Troubleshooting**

### **Problem: Migration fails**

**Error:** `relation "nocs_balance_summary" already exists`

**Solution:**
```bash
# Rollback migration
npx sequelize-cli db:migrate:undo

# Run again
npx sequelize-cli db:migrate
```

---

### **Problem: No data in PostgreSQL after 10 minutes**

**Check:**
```bash
# Check server logs
tail -f backend/logs/combined.log | grep "NOCS Balance"

# Check for errors
grep "ERROR" backend/logs/error.log
```

**Possible causes:**
1. Oracle query failed - check Oracle connection
2. Scheduler not started - check server.js
3. Permission issue - check PostgreSQL user permissions

**Manual trigger:**
```javascript
// In Node.js console or create test script
const { refreshNocsBalanceData } = require('./src/services/nocs-balance-scheduler.service');
refreshNocsBalanceData();
```

---

### **Problem: Data is old (not updating hourly)**

**Check scheduler status:**
```sql
-- Check last update time
SELECT MAX(updated_at) FROM nocs_balance_summary;
```

**Check server uptime:**
```bash
# Server must be running for scheduler to work
ps aux | grep node
```

**Restart server if needed:**
```bash
cd backend
npm start
```

---

### **Problem: Frontend shows "Data is being calculated"**

**Cause:** PostgreSQL table is empty

**Solution:**
1. Wait 5-10 minutes after server starts
2. Check PostgreSQL: `SELECT COUNT(*) FROM nocs_balance_summary;`
3. If still 0, check server logs for errors

---

## 🎯 **Performance Expectations**

### **For 3 Lakh (300,000) Customers:**

| Metric | Time |
|--------|------|
| **Oracle query** | 5-10 minutes |
| **PostgreSQL insert** | <1 second |
| **Total refresh time** | 5-10 minutes |
| **User query (PostgreSQL)** | <0.05 seconds ⚡ |
| **API response** | <0.1 seconds |
| **Frontend load** | <0.5 seconds |

### **Database Size:**
- **17 rows** (one per NOCS)
- **Storage:** ~10-20 KB
- **Negligible impact** on PostgreSQL

---

## 📦 **PostgreSQL Table Structure**

```sql
nocs_balance_summary
├── id                    (serial, primary key)
├── nocs_name            (varchar(200))
├── nocs_code            (varchar(50), unique)
├── total_customers      (integer)
├── positive_qty         (integer)
├── positive_balance_amt (decimal(15,2))
├── negative_qty         (integer)
├── negative_balance_amt (decimal(15,2))
├── net_balance          (decimal(15,2))
├── refresh_duration     (integer) - milliseconds
├── created_at           (timestamp)
└── updated_at           (timestamp)

Indexes:
- idx_nocs_code (unique)
- idx_updated_at
- idx_nocs_name
```

---

## 🔄 **Data Flow Summary**

```
Oracle CC&B (Read-Only)
        ↓
    Complex Query (5-10 min)
        ↓
    17 NOCS Summaries
        ↓
PostgreSQL Transaction:
  - DELETE old data
  - INSERT new data
  - COMMIT
        ↓
PostgreSQL Table (Instant Access)
        ↓
    Users (<0.1 seconds)
```

---

## ✅ **Deployment Checklist**

- [ ] Run database migration
- [ ] Verify table created in PostgreSQL
- [ ] Restart backend server
- [ ] Wait 5-10 minutes for initial load
- [ ] Verify data in PostgreSQL (17 rows)
- [ ] Test API endpoint
- [ ] Test manual refresh
- [ ] Test frontend page
- [ ] Verify Excel export works
- [ ] Monitor hourly refresh for 24 hours
- [ ] Check PostgreSQL table growth

---

## 🎉 **What You Get**

### **✅ PostgreSQL Benefits:**
- Data survives server restarts
- Multiple servers can share cache
- Easy to monitor with SQL
- Transaction safety (ACID)
- Can query data directly
- Professional solution

### **✅ User Experience:**
- Instant page load (<0.5 seconds)
- Always fresh data (hourly refresh)
- No waiting time
- Excel export works
- Manual refresh available

### **✅ System Benefits:**
- No Oracle database writes
- Read-only Oracle access
- Automatic hourly updates
- Error handling with rollback
- Detailed logging
- Production-ready

---

## 📞 **API Documentation**

### **Endpoint:**
```
GET /api/reports/nocs_balance_summary
```

### **Parameters:**
```
?refresh=true - Force immediate refresh (optional)
```

### **Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 17,
  "lastUpdated": "2025-11-26T10:08:32.000Z",
  "ageMinutes": 5,
  "source": "postgresql_cache",
  "cached": true,
  "timestamp": "2025-11-26T10:13:15.000Z"
}
```

---

## 💡 **Pro Tips**

1. **Monitor disk space:** PostgreSQL table is tiny but check weekly
2. **Backup strategy:** Include `nocs_balance_summary` in PostgreSQL backups
3. **Index maintenance:** Run VACUUM ANALYZE weekly
4. **Log rotation:** Archive old scheduler logs monthly
5. **Performance:** If slow, add PostgreSQL indexes
6. **Scaling:** Works with multiple backend servers (shared cache)

---

## 🚀 **Quick Start (TL;DR)**

```bash
# 1. Run migration
cd backend
npm run migrate

# 2. Restart server
npm start

# 3. Wait 10 minutes

# 4. Test
curl http://localhost:5000/api/reports/nocs_balance_summary

# Done! ✅
```

---

**Deployment Time:** 15 minutes
**Initial Load:** 5-10 minutes
**User Experience:** Instant forever! ⚡
**Cache Type:** PostgreSQL (Best Choice!) 🏆

---

**Created:** 2025-11-26
**Version:** 1.0
**For:** DPDC AMI System (3 Lakh+ Customers)
**Approach:** PostgreSQL Cache (Production Ready)
