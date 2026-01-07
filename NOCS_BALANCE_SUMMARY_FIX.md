# NOCS Balance Summary - Balance Calculation Fix

## Problem

**NOCS Balance Summary** page showing **incorrect/wrong balance**, while **NOCS Customer Payoff** page shows **correct balance** for the same NOCS.

## Root Cause Analysis

### Incorrect Query (nocs_balance_summary.sql - BEFORE):
```sql
-- Used LEFT JOIN - includes ALL accounts (active, inactive, prepaid, postpaid)
LEFT JOIN ci_sa b ON a.acct_id = b.acct_id

-- NO filters for:
-- - Account status (active vs inactive)
-- - Account type (prepaid vs postpaid)
```

**Result:** Included inactive accounts, postpaid accounts, and all other account types → **WRONG BALANCE**

### Correct Query (nocs_customer_payoff.sql):
```sql
-- Uses INNER JOIN with strict filters
INNER JOIN ci_sa sa ON sa.acct_id = acc.acct_id
    AND sa.sa_status_flg = '20'  -- ACTIVE accounts only
    AND sa.sa_type_cd = 'PPD'    -- PREPAID accounts only
```

**Result:** Only includes ACTIVE PREPAID customers → **CORRECT BALANCE**

---

## The Fix

### File Modified:
`backend/reports/nocs_balance_summary.sql`

### Changes Made:

#### 1. Changed JOIN Type
```sql
-- BEFORE (wrong):
LEFT JOIN ci_sa b ON a.acct_id = b.acct_id

-- AFTER (fixed):
INNER JOIN ci_sa b ON a.acct_id = b.acct_id
    AND b.sa_status_flg = '20'  -- ACTIVE accounts only
    AND b.sa_type_cd = 'PPD'    -- PREPAID accounts only
```

#### 2. Added Filters

**sa_status_flg = '20':**
- Only includes ACTIVE accounts
- Excludes: Pending, Stopped, Pending Stop accounts

**sa_type_cd = 'PPD':**
- Only includes PREPAID accounts
- Excludes: Residential, Commercial, Industrial, Government (postpaid) accounts

---

## How the System Works

### 1. Hourly Background Refresh
- System runs `nocs_balance_summary.sql` query every hour
- Query takes 5-10 minutes for 3 lakh+ customers
- Results cached in PostgreSQL database

### 2. User Access
- User opens NOCS Balance Summary page
- Page reads from PostgreSQL cache (instant - <0.1 seconds)
- Data refreshed automatically every hour

### 3. After This Fix
- Next hourly refresh will use corrected query
- Balance will match NOCS Customer Payoff page
- All NOCS will show correct balances

---

## Deployment Instructions

### Step 1: Pull Latest Code

```bash
cd /home/oculin/DPDC-AMI-BY-OTBL
sudo -u oculin git pull origin main
```

### Step 2: Restart Backend

```bash
pm2 restart backend
# or
pm2 restart all
```

### Step 3: Force Manual Refresh (Optional - to update immediately)

The system refreshes automatically every hour. To update immediately:

**Option A: Wait for next hourly refresh** (automatic)

**Option B: Restart backend to trigger immediate refresh**
```bash
pm2 restart backend
```

The scheduler runs immediately on backend startup.

**Option C: Check when last refresh occurred**
```bash
pm2 logs backend | grep "NOCS balance refresh"
```

### Step 4: Verify Fix

1. Wait for next hourly refresh (or restart backend)
2. Open NOCS Balance Summary page
3. Click on any NOCS to view Customer Payoff
4. Compare balances - they should now match!

---

## Verification

### Check Last Refresh Time

View backend logs:
```bash
pm2 logs backend --lines 100 | grep "NOCS balance"
```

Look for:
```
[NOCS Balance Scheduler] NOCS balance refresh completed successfully
[NOCS Balance Scheduler] NOCS areas processed: 85
```

### Compare Balances

For a specific NOCS (e.g., NOCS 0101):

1. **NOCS Balance Summary page:**
   - Shows: Total Customers, Credit Balance, Due Balance

2. **NOCS Customer Payoff page:**
   - Shows detailed customer list with balances
   - Summary at top should match NOCS Balance Summary

**After fix:** Both should show IDENTICAL balances ✅

---

## Impact

### Before Fix:
- ❌ NOCS Balance Summary: Incorrect balance (included inactive/postpaid)
- ✅ NOCS Customer Payoff: Correct balance (active prepaid only)
- ❌ Mismatch between two pages

### After Fix:
- ✅ NOCS Balance Summary: Correct balance (active prepaid only)
- ✅ NOCS Customer Payoff: Correct balance (active prepaid only)
- ✅ Both pages show IDENTICAL balances

---

## Technical Details

### Query Filters Applied:

| Filter | Value | Meaning |
|--------|-------|---------|
| `sa_status_flg` | '20' | Active accounts only |
| `sa_type_cd` | 'PPD' | Prepaid accounts only |
| `freeze_sw` | 'Y' | Frozen (finalized) transactions only |

### Accounts Excluded After Fix:

- ❌ Inactive accounts (sa_status_flg != '20')
- ❌ Pending accounts (sa_status_flg = '10')
- ❌ Stopped accounts (sa_status_flg = '40')
- ❌ Postpaid accounts (sa_type_cd != 'PPD')
  - Residential (RES)
  - Commercial (COM)
  - Industrial (IND)
  - Government (GOV)

### Accounts Included After Fix:

- ✅ Active accounts only (sa_status_flg = '20')
- ✅ Prepaid accounts only (sa_type_cd = 'PPD')
- ✅ Accounts with or without transactions (LEFT JOIN on ci_ft)

---

## Testing Checklist

After deployment, verify:

- [ ] Backend restarted successfully
- [ ] Hourly refresh job is running
- [ ] NOCS Balance Summary loads without errors
- [ ] NOCS Customer Payoff loads without errors
- [ ] Balances match between both pages
- [ ] Total customers count matches
- [ ] Credit/Due breakdown matches

---

## Rollback (If Needed)

If issues occur after deployment:

### 1. Revert the SQL file
```bash
cd /home/oculin/DPDC-AMI-BY-OTBL
git checkout HEAD~1 backend/reports/nocs_balance_summary.sql
```

### 2. Restart backend
```bash
pm2 restart backend
```

### 3. Wait for next hourly refresh or restart again

---

## Summary

**Problem:** NOCS Balance Summary showing incorrect balance

**Root Cause:** Query included ALL account types (inactive, postpaid, etc.)

**Solution:** Added filters to match NOCS Customer Payoff logic
- Only ACTIVE accounts (`sa_status_flg = '20'`)
- Only PREPAID accounts (`sa_type_cd = 'PPD'`)

**Impact:** Both pages now show IDENTICAL, CORRECT balances ✅

**File Changed:** `backend/reports/nocs_balance_summary.sql`

**Deployment:** Simple git pull + backend restart

**Next Refresh:** Automatic (hourly) or immediate (restart backend)

---

**Status:** ✅ Fixed and Ready for Deployment
**Date:** 2026-01-07
**Priority:** HIGH - Fixes incorrect balance display
