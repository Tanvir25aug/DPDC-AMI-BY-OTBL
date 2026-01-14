# Customer Billing Details - Debugging 500 Error

## Changes Made (2025-11-25)

### 1. Fixed `maxRows: 0` Bug in Oracle Config
**File:** `backend/src/config/oracle.js:94`

**Problem:** When passing `{ maxRows: 0 }` to fetch all data, JavaScript treated `0` as falsy and defaulted to 1000 rows.

**Fix:**
```javascript
// BEFORE (WRONG):
maxRows: options.maxRows || 1000

// AFTER (FIXED):
maxRows: options.maxRows !== undefined ? options.maxRows : 1000
```

### 2. Enhanced Error Logging
**File:** `backend/src/controllers/reports.controller.js:568-586`

**Added:**
- Detailed console logging with Oracle error code and offset
- Error details passed to frontend response
- Parameter logging (custId, startDate, endDate)

### 3. Improved Frontend Error Display
**File:** `frontend/src/views/CustomerBillingDetailsView.vue:453-467`

**Added:**
- Display full Oracle error message
- Show error code if available
- Better error formatting

### 4. Simplified SQL Query
**File:** `backend/reports/customer_billing_details.sql:6`

**Changed:**
```sql
-- BEFORE:
(SELECT ADHOC_CHAR_VAL FROM CI_SP_CHAR WHERE CHAR_TYPE_CD='CM_LEGCY' AND ADHOC_CHAR_VAL=:custId AND ROWNUM=1) AS CUSTID

-- AFTER:
:custId AS CUSTID
```

This removes an unnecessary subquery that might cause GROUP BY issues.

---

## How to Apply Fixes

### Step 1: Restart Backend Server

**Option A: Terminal Running Backend**
1. Find the terminal window running `npm start` or `node src/server.js`
2. Press `Ctrl + C` to stop
3. Run: `npm start`

**Option B: Kill and Restart**
```bash
# Find Node processes
tasklist | findstr node.exe

# Kill backend process (look for one using ~80-170MB memory)
taskkill /F /PID <process_id>

# Start backend
cd backend
npm start
```

### Step 2: Refresh Frontend
- Hard refresh browser: `Ctrl + Shift + R`
- Or clear cache and reload

### Step 3: Test Again
1. Customer ID: `29112653`
2. Start Date: `2025-11-01`
3. End Date: `2025-11-25`
4. Click "Search"

---

## What to Check

### If Still Getting 500 Error:

**Check Backend Console for:**
```
[Reports Controller] Error in getCustomerBillingDetails: ...
[Reports Controller] Error details: {
  message: "...",
  code: "ORA-XXXXX",
  offset: XX,
  custId: "29112653",
  startDate: "01-NOV-2025",
  endDate: "25-NOV-2025"
}
```

**Check Frontend Error Display:**
- Should now show detailed Oracle error message
- Should show error code if available

### Common Oracle Errors:

**ORA-00979: not a GROUP BY expression**
- Means a column in SELECT isn't in GROUP BY
- Already fixed by simplifying CUSTID

**ORA-00904: invalid identifier**
- Means a table/column doesn't exist
- Check if `ci_sa`, `ci_bseg`, etc. tables are accessible

**ORA-01489: result of string concatenation is too long**
- Means a string result exceeds 4000 bytes
- Unlikely in this query

**ORA-01722: invalid number**
- Means trying to convert non-numeric string to number
- Check if data contains unexpected values

---

## Next Steps After Restart

1. **Test the query** with the enhanced error logging
2. **Check backend console** for detailed Oracle error
3. **Check frontend error display** for Oracle message
4. **Report back** with:
   - Exact Oracle error code (ORA-XXXXX)
   - Error message from backend console
   - Parameters used (custId, startDate, endDate)

This will help identify the exact issue!

---

## Files Modified

1. ✅ `backend/src/config/oracle.js` - Fixed maxRows bug
2. ✅ `backend/src/controllers/reports.controller.js` - Enhanced error logging
3. ✅ `backend/reports/customer_billing_details.sql` - Simplified CUSTID
4. ✅ `frontend/src/views/CustomerBillingDetailsView.vue` - Better error display

**Status:** Ready for testing after backend restart
