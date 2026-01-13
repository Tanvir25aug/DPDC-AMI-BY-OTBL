# Reports Page - Query Validation & Row Limit Fix

## Problems Fixed

### Problem 1: False Positive Keyword Detection
**Error**: `Query contains forbidden keyword: UPDATE`

**User Query**:
```sql
WITH meter_install_dates AS (
  SELECT '41522613' AS customer_id, '90031018' AS meter_no, ...
)
SELECT
  customer_id,
  meter_no,
  LAST_UPDATE_DTTM,  -- THIS was triggering the error!
  ...
FROM ...
```

**Root Cause**:
- Query validation was using `includes()` substring matching
- Column name `LAST_UPDATE_DTTM` contains the word "UPDATE"
- Validation incorrectly blocked the query

**Impact**: Users couldn't run valid SELECT queries with column names containing forbidden keywords

---

### Problem 2: 1000 Row Limit
**User Request**: *"Set max rows limit (default 1000) also removed this limit"*

**Issue**:
- Default max rows was hardcoded to 1000
- Users couldn't fetch more than 1000 rows
- Large result sets were truncated

---

## The Fixes

### Fix 1: Word Boundary Validation

**File**: `backend/src/services/oracle.service.js`

**Before** (WRONG):
```javascript
for (const keyword of dangerousKeywords) {
  if (upperQuery.includes(keyword)) {
    throw new Error(`Query contains forbidden keyword: ${keyword}`);
  }
}
```
**Problem**: Checks for substring anywhere, including column names

**After** (CORRECT):
```javascript
for (const keyword of dangerousKeywords) {
  // Use regex with word boundaries (\b) to match whole words only
  const regex = new RegExp(`\\b${keyword}\\b`, 'i');
  if (regex.test(upperQuery)) {
    throw new Error(`Query contains forbidden keyword: ${keyword}`);
  }
}
```
**Solution**: Uses regex word boundaries `\b` to match only complete words

**Examples**:
| Query | Before | After |
|-------|--------|-------|
| `SELECT LAST_UPDATE_DTTM ...` | ❌ Blocked | ✅ Allowed |
| `UPDATE customers SET ...` | ✅ Blocked | ✅ Blocked |
| `SELECT * FROM account_updates` | ❌ Blocked | ✅ Allowed |
| `DELETE FROM table` | ✅ Blocked | ✅ Blocked |

**Also Added**: Support for CTE queries starting with `WITH`
```javascript
// Must start with SELECT or WITH (for CTEs)
if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
  throw new Error('Only SELECT queries (including CTEs with WITH) are allowed');
}
```

---

### Fix 2: Removed Row Limit

#### Backend Changes
**File**: `backend/src/services/oracle.service.js`

**Before**:
```javascript
const maxRows = options.maxRows || parseInt(process.env.DEFAULT_PAGE_SIZE) || 1000;
```
**Result**: Always limited to 1000 rows

**After**:
```javascript
// FIXED: Allow unlimited rows (maxRows: 0 means no limit)
// If maxRows not specified, use 0 (no limit) instead of 1000
const maxRows = options.maxRows !== undefined ? options.maxRows : 0;
```
**Result**: No limit by default (`maxRows: 0` = unlimited in Oracle)

#### Frontend Changes
**File**: `frontend/src/views/ReportView.vue`

**UI Update**:
```vue
<label for="maxRows" class="block text-sm font-semibold text-gray-700 mb-2">
  Max Rows <span class="text-xs font-normal text-gray-500">(0 = unlimited)</span>
</label>
<input
  id="maxRows"
  v-model.number="maxRows"
  type="number"
  class="..."
  min="0"
  placeholder="0 = unlimited"
/>
```

**Default Changed**:
```javascript
// Before
const maxRows = ref(1000);

// After
const maxRows = ref(0); // Default to unlimited
```

---

## How It Works Now

### Query Validation (Word Boundaries)

**Forbidden Keywords**:
- DROP, DELETE, INSERT, UPDATE, TRUNCATE
- ALTER, CREATE, GRANT, REVOKE
- EXECUTE, EXEC

**Validation Logic**:
```javascript
const regex = new RegExp(`\\b${keyword}\\b`, 'i');
```

**Regex Explanation**:
- `\b` = Word boundary (start or end of a word)
- `${keyword}` = The forbidden keyword
- `\b` = Word boundary (end of word)
- `i` = Case insensitive

**Examples**:
```javascript
// ✅ ALLOWED (keyword is part of identifier)
"LAST_UPDATE_DTTM"     // \b matches: [LAST_][UPDATE][_DTTM]
"account_updates"       // \b matches: [account_][updates]
"customer_id_delete"    // \b matches: [customer_id_][delete]

// ❌ BLOCKED (keyword is standalone)
"UPDATE customers"      // \b matches: [UPDATE][ customers]
"DELETE FROM table"     // \b matches: [DELETE][ FROM table]
"DROP TABLE users"      // \b matches: [DROP][ TABLE users]
```

### Row Limit Behavior

**MaxRows Values**:
| Value | Behavior |
|-------|----------|
| `0` | Unlimited (fetch all rows) |
| `1000` | Fetch max 1000 rows |
| `10000` | Fetch max 10,000 rows |
| `undefined` | Defaults to 0 (unlimited) |

**Performance Considerations**:
- Large result sets (50,000+ rows) may take time
- 5-minute timeout already configured (from previous fix)
- Users can still set a limit if needed

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
```

### Step 3: Clear Browser Cache (Optional)

Frontend changes may need cache clear:
```
CTRL + F5 (Windows/Linux)
CMD + SHIFT + R (Mac)
```

### Step 4: Verify Fix

1. Open Reports page: `http://172.18.42.200/reports`
2. Test the CTE query (with `LAST_UPDATE_DTTM`)
3. **Expected**:
   - Query executes successfully ✅
   - No "forbidden keyword" error ✅
   - Returns all rows (not just 1000) ✅

---

## Testing

### Test Case 1: CTE Query with "UPDATE" in Column Name

```sql
WITH meter_install_dates AS (
  SELECT '41522613' AS customer_id, '90031018' AS meter_no,
         TO_DATE('10/9/2024', 'MM/DD/YYYY') AS install_date
  FROM dual
)
SELECT
  customer_id,
  meter_no,
  LAST_UPDATE_DTTM,
  READING_VAL
FROM meter_install_dates m
JOIN d1_msrmt ms ON ...
```

**Expected**: ✅ Executes successfully

### Test Case 2: Actual UPDATE Command (Should Still Block)

```sql
UPDATE customers SET balance = 0 WHERE id = 123
```

**Expected**: ❌ Blocked with "Query contains forbidden keyword: UPDATE"

### Test Case 3: Large Result Set

```sql
SELECT * FROM d1_msrmt WHERE TRUNC(msrmt_dttm) >= TRUNC(SYSDATE - 30)
```

**Expected**: ✅ Returns ALL rows (not limited to 1000)

### Test Case 4: Manual Row Limit

Set "Max Rows" to 100 in UI

**Expected**: ✅ Returns only 100 rows

---

## Troubleshooting

### Issue: Still getting "forbidden keyword" error

**Check**:
1. Backend restarted after code pull?
2. Query actually contains forbidden SQL command?

**Solution**:
```bash
pm2 restart backend
pm2 logs backend --lines 50
```

### Issue: Still limited to 1000 rows

**Check**:
1. Frontend cache cleared?
2. Max Rows field set to 0?

**Solution**:
```
1. Clear browser cache (CTRL + F5)
2. Set Max Rows to 0 or leave blank
3. Execute query
```

### Issue: Query timeout for large results

**Note**: 5-minute timeout already configured

**If still timing out**:
1. Check total rows: `SELECT COUNT(*) FROM ...`
2. Add WHERE clause to filter data
3. Or use smaller Max Rows value

---

## Summary

**Problem 1**: False positive keyword detection blocking valid queries

**Solution 1**: Use regex word boundaries for accurate validation

**Problem 2**: 1000 row limit restricting large result sets

**Solution 2**: Default to unlimited rows (maxRows: 0)

**Benefits**:
- ✅ CTE queries with `WITH` clause now work
- ✅ Column names with forbidden keywords work (e.g., LAST_UPDATE_DTTM)
- ✅ Table names with forbidden keywords work (e.g., account_updates)
- ✅ No more 1000 row limit
- ✅ Users have full control over result size
- ✅ Security still maintained (actual SQL commands still blocked)

**Files Changed**:
1. `backend/src/services/oracle.service.js` - Fixed validation and row limit
2. `frontend/src/views/ReportView.vue` - Updated UI and default value

**Commits**:
- `b32448f` - Optimize Meter-Wise Report SQL Query
- `4e10927` - Fix Reports Page - Query Validation and Row Limit Issues

---

**Status**: ✅ Fixed and Deployed
**Date**: 2026-01-08
**Priority**: HIGH - Fixes critical query execution issue
**User Impact**: Immediate - Users can now run CTE queries and fetch unlimited rows
