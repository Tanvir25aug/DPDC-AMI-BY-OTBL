# NOCS Balance Summary - Complete Deployment Guide

## 📋 Overview

This guide will help you deploy the **NOCS Balance Summary** feature with **hourly cached data** for instant performance with **3 lakh+ customers**.

### **What is Credit vs Due?**

```
💰 CREDIT (Positive Balance):
   - Customer paid MORE than their bill
   - They have advance payment
   - Example: Bill ₹1000, Paid ₹1500 = +₹500 CREDIT
   - ✅ Good for utility (customer has money in advance)

💸 DUE (Negative Balance):
   - Customer OWES money
   - Unpaid or underpaid bills
   - Example: Bill ₹1000, Paid ₹500 = -₹500 DUE
   - ❌ Customer needs to pay this amount
```

---

## 🎯 Implementation Strategy

### **Option 3: Hourly Scheduled Cache (SELECTED)**
- Query runs **every 1 hour** automatically
- Results stored in **NOCS_BALANCE_SUMMARY** table
- Users get **instant results** (<0.1 seconds)
- Perfect for **3 lakh+ customers**

---

## 📁 Files Created

### **Database Files** (in `backend/database/`)
1. ✅ `nocs_balance_summary_table.sql` - Summary table creation
2. ✅ `nocs_balance_summary_procedure.sql` - Stored procedure
3. ✅ `nocs_balance_summary_scheduler.sql` - Hourly scheduler job

### **Backend Files**
4. ✅ `backend/reports/nocs_balance_summary.sql` - Fast fetch query
5. ✅ `backend/src/controllers/reports.controller.js` - Controller method added
6. ✅ `backend/src/routes/reports.routes.js` - Route added

### **Frontend Files** (Already Complete)
7. ✅ `frontend/src/views/NocsBalanceSummaryView.vue` - UI component
8. ✅ Router configured
9. ✅ Sidebar navigation added

---

## 🚀 Deployment Steps

### **Step 1: Create Summary Table** ⏱️ 2 minutes

Connect to Oracle database and run:

```bash
sqlplus your_username/your_password@your_database
```

```sql
@backend/database/nocs_balance_summary_table.sql
```

**Expected Output:**
```
Table created.
Index created.
Index created.
STATUS
-------------------------------------------------
NOCS_BALANCE_SUMMARY table created successfully
```

**Verify:**
```sql
DESC NOCS_BALANCE_SUMMARY;
```

---

### **Step 2: Create Stored Procedure** ⏱️ 2 minutes

```sql
@backend/database/nocs_balance_summary_procedure.sql
```

**Expected Output:**
```
Procedure created.
STATUS
---------------------------------------------------------------
REFRESH_NOCS_BALANCE_SUMMARY procedure created successfully
```

**Verify:**
```sql
SELECT object_name, object_type, status
FROM user_objects
WHERE object_name = 'REFRESH_NOCS_BALANCE_SUMMARY';
```

Should show: `VALID`

---

### **Step 3: Test Procedure Manually** ⏱️ 5-10 minutes (depends on data size)

**IMPORTANT:** Run this ONCE manually to populate initial data:

```sql
SET SERVEROUTPUT ON;
BEGIN
    REFRESH_NOCS_BALANCE_SUMMARY;
END;
/
```

**Expected Output:**
```
========================================
NOCS Balance Summary Refresh Started
Start Time: 2025-11-26 10:00:00
========================================
Existing data cleared. Calculating new summary...
========================================
NOCS Balance Summary Refresh Completed
End Time: 2025-11-26 10:05:32
Duration: 332.45 seconds
NOCS Areas Processed: 17
========================================

PL/SQL procedure successfully completed.
```

**Verify Data:**
```sql
SELECT
    NOCS_NAME,
    TOTAL_CUSTOMERS,
    POSITIVE_BALANCE_AMT,
    NEGATIVE_BALANCE_AMT,
    NET_BALANCE,
    LAST_UPDATED
FROM NOCS_BALANCE_SUMMARY
ORDER BY NOCS_NAME;
```

You should see all your NOCS areas with calculated balances.

---

### **Step 4: Create Scheduler Job** ⏱️ 1 minute

```sql
@backend/database/nocs_balance_summary_scheduler.sql
```

**Expected Output:**
```
Existing job dropped (or "No existing job to drop")
========================================
Scheduler Job Created Successfully
Job Name: NOCS_BALANCE_HOURLY_REFRESH
Schedule: Every 1 hour
Status: ENABLED
========================================

JOB_NAME                    ENABLED STATE     NEXT_RUN_DATE
--------------------------- ------- --------- -------------------
NOCS_BALANCE_HOURLY_REFRESH TRUE    SCHEDULED 26-NOV-25 11:00:00
```

**Verify Job Status:**
```sql
SELECT
    job_name,
    enabled,
    state,
    next_run_date,
    last_start_date
FROM user_scheduler_jobs
WHERE job_name = 'NOCS_BALANCE_HOURLY_REFRESH';
```

---

### **Step 5: Test Backend API** ⏱️ 5 minutes

**Start Backend Server:**
```bash
cd backend
npm start
```

**Test API Endpoint:**

Using curl:
```bash
curl -X GET http://localhost:5000/api/reports/nocs_balance_summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Using Postman:
```
GET http://localhost:5000/api/reports/nocs_balance_summary
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "NOCS_NAME": "Adabor",
      "NOCS_CODE": "001",
      "TOTAL_CUSTOMERS": 18500,
      "POSITIVE_QTY": 5200,
      "POSITIVE_BALANCE_AMT": 2500000.50,
      "NEGATIVE_QTY": 13300,
      "NEGATIVE_BALANCE_AMT": -8500000.75,
      "NET_BALANCE": -6000000.25,
      "LAST_UPDATED": "2025-11-26T10:05:32.000Z"
    }
  ],
  "count": 17,
  "timestamp": "2025-11-26T10:30:00.000Z",
  "note": "Data is refreshed hourly. Last update time shown in LAST_UPDATED field."
}
```

---

### **Step 6: Test Frontend** ⏱️ 2 minutes

**Start Frontend:**
```bash
cd frontend
npm run dev
```

**Open in Browser:**
```
http://localhost:5173/nocs-balance-summary
```

**Verify:**
- ✅ Summary cards show totals
- ✅ Table displays all NOCS areas
- ✅ Color coding works (green=credit, red=due)
- ✅ Export to Excel works
- ✅ Refresh button works
- ✅ "Last Updated" timestamp shows

---

## 🔧 Configuration & Maintenance

### **Change Refresh Schedule**

**Every 30 minutes:**
```sql
BEGIN
    DBMS_SCHEDULER.SET_ATTRIBUTE(
        name => 'NOCS_BALANCE_HOURLY_REFRESH',
        attribute => 'repeat_interval',
        value => 'FREQ=MINUTELY; INTERVAL=30'
    );
END;
/
```

**Every 2 hours:**
```sql
BEGIN
    DBMS_SCHEDULER.SET_ATTRIBUTE(
        name => 'NOCS_BALANCE_HOURLY_REFRESH',
        attribute => 'repeat_interval',
        value => 'FREQ=HOURLY; INTERVAL=2'
    );
END;
/
```

**Daily at 2 AM:**
```sql
BEGIN
    DBMS_SCHEDULER.SET_ATTRIBUTE(
        name => 'NOCS_BALANCE_HOURLY_REFRESH',
        attribute => 'repeat_interval',
        value => 'FREQ=DAILY; BYHOUR=2; BYMINUTE=0'
    );
END;
/
```

---

### **Manual Refresh**

If you need fresh data immediately:

```sql
BEGIN
    DBMS_SCHEDULER.RUN_JOB('NOCS_BALANCE_HOURLY_REFRESH');
END;
/
```

Or call procedure directly:
```sql
BEGIN
    REFRESH_NOCS_BALANCE_SUMMARY;
END;
/
```

---

### **Disable/Enable Job**

**Disable (Stop automatic refresh):**
```sql
BEGIN
    DBMS_SCHEDULER.DISABLE('NOCS_BALANCE_HOURLY_REFRESH');
END;
/
```

**Enable (Resume automatic refresh):**
```sql
BEGIN
    DBMS_SCHEDULER.ENABLE('NOCS_BALANCE_HOURLY_REFRESH');
END;
/
```

---

### **Monitor Job Performance**

**Check last 10 job runs:**
```sql
SELECT
    log_date,
    status,
    error#,
    EXTRACT(SECOND FROM (run_duration)) AS duration_seconds
FROM user_scheduler_job_run_details
WHERE job_name = 'NOCS_BALANCE_HOURLY_REFRESH'
ORDER BY log_date DESC
FETCH FIRST 10 ROWS ONLY;
```

**Check current data freshness:**
```sql
SELECT
    NOCS_NAME,
    LAST_UPDATED,
    ROUND((SYSDATE - LAST_UPDATED) * 24 * 60, 2) AS minutes_old
FROM NOCS_BALANCE_SUMMARY
FETCH FIRST 1 ROW ONLY;
```

---

## 📊 Performance Expectations

### **For 3 Lakh (300,000) Customers:**

| Metric | Value |
|--------|-------|
| **Initial Calculation** | 5-10 minutes (one time) |
| **Hourly Refresh** | 5-10 minutes (automatic) |
| **User Query Time** | <0.1 seconds ⚡ |
| **API Response Time** | <0.2 seconds |
| **Frontend Load Time** | <0.5 seconds |

### **Database Storage:**
- Summary table size: ~5-10 KB (17 rows)
- Negligible storage impact

---

## 🐛 Troubleshooting

### **Problem: Job Not Running**

**Check job status:**
```sql
SELECT job_name, enabled, state, failure_count
FROM user_scheduler_jobs
WHERE job_name = 'NOCS_BALANCE_HOURLY_REFRESH';
```

**Check errors:**
```sql
SELECT log_date, status, error#, additional_info
FROM user_scheduler_job_run_details
WHERE job_name = 'NOCS_BALANCE_HOURLY_REFRESH'
AND status = 'FAILED'
ORDER BY log_date DESC;
```

**Fix:** Re-enable job
```sql
BEGIN
    DBMS_SCHEDULER.ENABLE('NOCS_BALANCE_HOURLY_REFRESH');
END;
/
```

---

### **Problem: Procedure Takes Too Long**

**Check execution time:**
```sql
SELECT
    ROUND(EXTRACT(SECOND FROM run_duration), 2) AS duration_seconds
FROM user_scheduler_job_run_details
WHERE job_name = 'NOCS_BALANCE_HOURLY_REFRESH'
ORDER BY log_date DESC
FETCH FIRST 1 ROW ONLY;
```

**If >15 minutes:**
1. Add database indexes (see below)
2. Consider running every 2-3 hours instead
3. Contact DBA for query optimization

---

### **Problem: No Data in Summary Table**

**Check if procedure ran:**
```sql
SELECT * FROM NOCS_BALANCE_SUMMARY;
```

**If empty, run manually:**
```sql
BEGIN
    REFRESH_NOCS_BALANCE_SUMMARY;
END;
/
```

---

### **Problem: Frontend Shows Old Data**

**Check data age:**
```sql
SELECT
    NOCS_NAME,
    LAST_UPDATED,
    ROUND((SYSDATE - LAST_UPDATED) * 24, 2) AS hours_old
FROM NOCS_BALANCE_SUMMARY
FETCH FIRST 1 ROW ONLY;
```

**If >2 hours old, manually refresh:**
```sql
BEGIN
    DBMS_SCHEDULER.RUN_JOB('NOCS_BALANCE_HOURLY_REFRESH');
END;
/
```

---

## 🎯 Optional: Performance Indexes

If procedure is slow, create these indexes:

```sql
-- Index on account character (meter distributed)
CREATE INDEX idx_acct_char_mtdis
ON ci_acct_char(acct_id, char_type_cd, char_val);

-- Index on service agreement
CREATE INDEX idx_sa_type_status
ON ci_sa(acct_id, sa_type_cd, sa_status_flg);

-- Index on financial transactions
CREATE INDEX idx_ft_sa_freeze
ON ci_ft(sa_id, freeze_sw);

-- Index on premise character (NOCS)
CREATE INDEX idx_prem_char_nocs
ON ci_prem_char(prem_id, char_type_cd, char_val);
```

**Note:** Consult your DBA before creating indexes in production.

---

## ✅ Deployment Checklist

- [ ] Step 1: Create summary table
- [ ] Step 2: Create stored procedure
- [ ] Step 3: Test procedure manually (populate initial data)
- [ ] Step 4: Create scheduler job
- [ ] Step 5: Verify job is enabled and scheduled
- [ ] Step 6: Test backend API endpoint
- [ ] Step 7: Test frontend page
- [ ] Step 8: Verify data updates hourly
- [ ] Step 9: Test Excel export
- [ ] Step 10: Monitor job performance for 24 hours

---

## 📞 API Documentation

### **Endpoint**
```
GET /api/reports/nocs_balance_summary
```

### **Authentication**
Required: Bearer token

### **Response**
```json
{
  "success": true,
  "data": [
    {
      "NOCS_NAME": "string",
      "NOCS_CODE": "string",
      "TOTAL_CUSTOMERS": number,
      "POSITIVE_QTY": number,
      "POSITIVE_BALANCE_AMT": number,
      "NEGATIVE_QTY": number,
      "NEGATIVE_BALANCE_AMT": number,
      "NET_BALANCE": number,
      "LAST_UPDATED": "ISO 8601 timestamp"
    }
  ],
  "count": number,
  "timestamp": "ISO 8601 string",
  "note": "Data is refreshed hourly. Last update time shown in LAST_UPDATED field."
}
```

---

## 📝 Summary

**What You Get:**
- ✅ **Instant Performance** - <0.1 seconds for 3 lakh+ customers
- ✅ **Automatic Updates** - Refreshes every hour
- ✅ **No User Wait** - Pre-calculated data ready to use
- ✅ **Easy Maintenance** - Simple SQL job management
- ✅ **Complete UI** - Professional frontend already built

**Maintenance Required:**
- 🔄 Monitor job runs weekly
- 📊 Check data freshness daily
- 🔧 Adjust schedule as needed

---

**Deployment Time:** ~20-30 minutes total
**Status:** Ready for Production ✅

---

**Created:** 2025-11-26
**Version:** 1.0
**For:** DPDC AMI System
