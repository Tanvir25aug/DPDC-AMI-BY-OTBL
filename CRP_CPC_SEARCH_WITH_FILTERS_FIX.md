# CRP-CPC Search with Filters Fix

## Problem Identified

**User Report:** "When I search with CPC customer number, it does not show the result"

### Root Cause Analysis

The search functionality was working correctly when **NO filters** were active, but failing when **filters AND search** were used together.

**Scenario that failed:**
1. User applies filter: "Bill Stop Status = Has Issues"
2. User searches for CPC customer ID: "15406365"
3. **Result:** No results shown (even though the CPC exists)

**Why it failed:**
```javascript
// OLD FLOW (Incorrect)
if (filters are active) {
  1. Query PostgreSQL: Get all CRPs with bill stop issues → 890 CRPs
  2. Query Oracle: Get details for those 890 CRPs
  3. Return results
  // ❌ SEARCH TERM WAS COMPLETELY IGNORED!
}
```

## Solution Implemented

### New Logic Flow

```javascript
// NEW FLOW (Correct)
if (filters are active AND search is active) {
  1. Query PostgreSQL: Get all CRPs matching filters → 890 CRPs
  2. Query Oracle: Filter those 890 CRPs by search term → Only matching CRPs
  3. Return search-filtered results
  // ✅ BOTH FILTERS AND SEARCH ARE APPLIED!
}
```

### Files Created/Modified

#### 1. New SQL Query File

**File:** `backend/reports/crp_cpc_list_filtered_with_search.sql`

**Purpose:** Query Oracle for specific CRP accounts AND apply search filtering

**Query:**
```sql
WITH CRP_LIST AS (
    -- Parse comma-separated CRP accounts (from PostgreSQL filter)
    SELECT DISTINCT
        TRIM(REGEXP_SUBSTR(:crp_accounts, '[^,]+', 1, LEVEL)) AS CPR_CUSTOMER_ID
    FROM DUAL
    CONNECT BY LEVEL <= REGEXP_COUNT(:crp_accounts, ',') + 1
)
SELECT
    crp.CPR_CUSTOMER_ID AS CRP_ID,
    crp.CPR_CUSTOMER_ID AS CRP_ACCOUNT_NO,
    COUNT(DISTINCT cpc_cust.adhoc_char_val) AS TOTAL_CPC_COUNT,
    0 AS BILLED_THIS_MONTH,
    0 AS NOT_BILLED_THIS_MONTH
FROM CRP_LIST crp
LEFT JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
    AND cpr_ref.char_type_cd = 'CM_CPRLA'
LEFT JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
    AND cpc_cust.char_type_cd = 'CM_LEGCY'
WHERE (
    :search IS NULL
    OR UPPER(crp.CPR_CUSTOMER_ID) LIKE UPPER('%' || :search || '%')
    OR EXISTS (
        -- Search by CPC customer ID within this CRP
        SELECT 1
        FROM d1_sp_char cpc_search
        WHERE cpc_search.d1_sp_id = cpr_ref.d1_sp_id
            AND cpc_search.char_type_cd = 'CM_LEGCY'
            AND UPPER(cpc_search.adhoc_char_val) LIKE UPPER('%' || :search || '%')
    )
)
GROUP BY crp.CPR_CUSTOMER_ID
ORDER BY crp.CPR_CUSTOMER_ID
```

**Parameters:**
- `:crp_accounts` - Comma-separated list of CRP account numbers (from PostgreSQL filter)
- `:search` - Search term (CRP account or CPC customer ID)

**How it works:**
1. Takes the list of filtered CRP accounts from PostgreSQL
2. Parses the comma-separated string into rows
3. Joins to get CPC details
4. Applies search filter to both CRP account and CPC customer IDs
5. Returns only CRPs that match BOTH the filter AND the search

#### 2. Updated Controller Logic

**File:** `backend/src/controllers/crp-cpc.controller.js`

**Changes:**

**A. Detect if Filters are Active (Lines 136-137):**
```javascript
// Determine if we have filters that require PostgreSQL filtering
const hasFilters = filterConnectionCount || filterBillStop || filterActiveBilling || (sortBy && sortBy !== 'account-asc');
```

**B. Only Query PostgreSQL if Filters Active (Lines 143-179):**
```javascript
if (hasFilters) {
  // Query PostgreSQL with filters
  const billStopData = await pgPool.query(pgQuery, pgParams);
  // Build filtered CRP accounts list
} else {
  // No filters active, will use Oracle search directly
  filteredCRPAccounts = null;
}
```

**C. Apply Search to Filtered Results (Lines 213-244):**
```javascript
if (filteredCRPAccounts && filteredCRPAccounts.length > 0) {
  // If search is also active, filter the CRP list by search term
  if (search) {
    console.log(`[CRP-CPC Controller] Applying search "${search}" to ${filteredCRPAccounts.length} filtered CRPs`);

    // Build comma-separated list of all filtered CRPs
    const accountsParam = filteredCRPAccounts.join(',');

    // Query Oracle with both CRP list AND search term
    const searchFilteredData = await reportsService.executeReport(
      'crp_cpc_list_filtered_with_search',
      { crp_accounts: accountsParam, search }
    );

    console.log(`[CRP-CPC Controller] Search filtered ${filteredCRPAccounts.length} CRPs down to ${searchFilteredData.length} CRPs`);

    // Update filtered accounts list to only include search matches
    const searchMatchedAccounts = searchFilteredData.map(crp => crp.CRP_ACCOUNT_NO);
    filteredCRPAccounts = searchMatchedAccounts;
    totalCount = filteredCRPAccounts.length;

    // Apply pagination to search-filtered results
    const paginatedAccounts = filteredCRPAccounts.slice(offset, offset + limit);

    if (paginatedAccounts.length > 0) {
      const paginatedParam = paginatedAccounts.join(',');
      data = await reportsService.executeReport(
        'crp_cpc_list_filtered_with_search',
        { crp_accounts: paginatedParam, search }
      );
    }
  }
}
```

**D. Updated Cache Key (Lines 39-41):**
```javascript
// Create cache key based on all params (normalized search for consistent caching)
const normalizedSearch = search ? search.trim().toLowerCase() : 'all';
const cacheKey = `crp_cpc_list:page:${page}:limit:${limit}:search:${normalizedSearch}:conn:${filterConnectionCount || 'all'}:billstop:${filterBillStop || 'all'}:active:${filterActiveBilling || 'all'}:sort:${sortBy}`;
```

## Complete Flow Diagrams

### Scenario 1: Search Only (No Filters)

```
User searches for CPC ID: "15406365"
  ↓
Backend: hasFilters = false
  ↓
Query Oracle directly with search:
  SELECT ... WHERE (
    UPPER(cpr_ref.adhoc_char_val) LIKE '%15406365%'
    OR EXISTS (
      SELECT 1 FROM d1_sp_char cpc_search
      WHERE UPPER(cpc_search.adhoc_char_val) LIKE '%15406365%'
    )
  )
  ↓
Returns: CRP "35209760" (which contains CPC "15406365")
  ↓
✅ SUCCESS
```

### Scenario 2: Filter Only (No Search)

```
User filters: "Bill Stop = Has Issues"
  ↓
Backend: hasFilters = true, search = null
  ↓
Query PostgreSQL:
  SELECT crp_account_no FROM bill_stop_summary
  WHERE batch_date = latest_date
    AND bill_stop_count > 0
  ↓
Returns: 890 CRP accounts
  ↓
Query Oracle for those 890 CRPs (paginated)
  ↓
✅ SUCCESS: Shows 890 CRPs with bill stop issues
```

### Scenario 3: Filter + Search (FIXED)

```
User filters: "Bill Stop = Has Issues"
User searches: "15406365"
  ↓
Backend: hasFilters = true, search = "15406365"
  ↓
Step 1: Query PostgreSQL with filter
  SELECT crp_account_no FROM bill_stop_summary
  WHERE batch_date = latest_date
    AND bill_stop_count > 0
  ↓
Returns: 890 CRP accounts
  ↓
Step 2: Query Oracle with BOTH filter and search
  SELECT ... FROM (890 CRP accounts)
  WHERE (
    UPPER(crp_account_no) LIKE '%15406365%'
    OR EXISTS (
      SELECT 1 FROM d1_sp_char cpc_search
      WHERE UPPER(cpc_search.adhoc_char_val) LIKE '%15406365%'
    )
  )
  ↓
Returns: CRP "35209760" (if it has bill stop issues AND contains CPC "15406365")
  ↓
✅ SUCCESS: Shows only matching CRP
```

## Console Output Examples

### Before Fix (Search Ignored)

```
[CRP-CPC Controller] Using batch date: 2026-01-11T18:00:00.000Z
[CRP-CPC Controller] PostgreSQL Query: SELECT ... WHERE bill_stop_count > 0
[CRP-CPC Controller] Found 890 CRPs matching filters
[CRP-CPC Controller] Loaded 50 CRPs, total: 890
❌ Search term "15406365" was ignored!
```

### After Fix (Search Applied)

```
[CRP-CPC Controller] Using batch date: 2026-01-11T18:00:00.000Z
[CRP-CPC Controller] PostgreSQL Query: SELECT ... WHERE bill_stop_count > 0
[CRP-CPC Controller] Found 890 CRPs matching filters
[CRP-CPC Controller] Applying search "15406365" to 890 filtered CRPs
[CRP-CPC Controller] Search filtered 890 CRPs down to 1 CRPs
[CRP-CPC Controller] Loaded 1 CRPs, total: 1
✅ Shows CRP "35209760" which contains CPC "15406365" AND has bill stop issues
```

## Testing Guide

### Test Case 1: Search with CPC ID Only

**Steps:**
1. Clear all filters
2. Search for CPC customer ID: "15406365"

**Expected Result:**
- ✅ Shows CRP "35209760"
- ✅ Console: "Found matching CRPs"

### Test Case 2: Filter Only

**Steps:**
1. Clear search
2. Select "Bill Stop Status" = "Has Issues"

**Expected Result:**
- ✅ Shows 890 CRPs
- ✅ All have BILL_STOP_COUNT > 0

### Test Case 3: Filter + Search (Main Fix)

**Steps:**
1. Select "Bill Stop Status" = "Has Issues"
2. Search for CPC customer ID: "15406365"

**Expected Result:**
- ✅ Shows CRP "35209760" (only if it has bill stop issues)
- ✅ Console shows: "Applying search to 890 filtered CRPs"
- ✅ Console shows: "Search filtered 890 CRPs down to 1 CRPs"

### Test Case 4: Search with CRP ID

**Steps:**
1. Clear all filters
2. Search for CRP account: "35209760"

**Expected Result:**
- ✅ Shows CRP "35209760"
- ✅ Works with both full and partial match

### Test Case 5: Multiple Filters + Search

**Steps:**
1. Select "Connection Count" = "More than 100"
2. Select "Bill Stop Status" = "Has Issues"
3. Search for a CPC customer ID

**Expected Result:**
- ✅ Shows only CRPs that match ALL THREE conditions:
  - Has more than 100 connections
  - Has bill stop issues
  - Contains the searched CPC customer ID

## Performance Impact

### Before Fix
- **Query Count**: 2 (PostgreSQL + Oracle)
- **Oracle Load**: Low (only filtered CRPs)
- **Issue**: Search didn't work ❌

### After Fix
- **Query Count**: 3 when search + filters (PostgreSQL + Oracle filter + Oracle search)
- **Oracle Load**: Medium (search on filtered subset)
- **Benefit**: Search works correctly ✅

### Optimization Notes
- Search is only applied to the filtered subset, not all 18,000 CRPs
- Results are cached based on unique combination of search + filters
- Cache TTL: 15 minutes

## Edge Cases Handled

### 1. Search Only (No Filters)
```javascript
if (!hasFilters) {
  // Use original Oracle search query
  data = await reportsService.executeReport('crp_cpc_list', { search, limit, offset });
}
```

### 2. Filters Only (No Search)
```javascript
if (hasFilters && !search) {
  // Use filtered CRP list without search
  data = await reportsService.executeReport('crp_cpc_list_filtered', { crp_accounts });
}
```

### 3. Both Filters and Search
```javascript
if (hasFilters && search) {
  // Use filtered CRP list WITH search
  data = await reportsService.executeReport('crp_cpc_list_filtered_with_search', { crp_accounts, search });
}
```

### 4. Empty Search String
```javascript
const normalizedSearch = search ? search.trim().toLowerCase() : 'all';
// Empty strings are treated as 'all' (no search)
```

### 5. No Results After Search
```javascript
if (searchFilteredData.length === 0) {
  // Returns empty array with proper pagination info
  data = [];
  totalCount = 0;
}
```

## Cache Key Strategy

**Old Cache Key** (Search sometimes ignored):
```
crp_cpc_list:page:1:limit:50:search:all:conn:all:billstop:has-issues:active:all:sort:account-asc
```

**New Cache Key** (Normalized search):
```
crp_cpc_list:page:1:limit:50:search:15406365:conn:all:billstop:has-issues:active:all:sort:account-asc
```

**Benefits:**
- Different searches with same filters are cached separately
- Case-insensitive caching (normalized to lowercase)
- Trimmed whitespace for consistency

## Related Files

### New Files
- ✅ `backend/reports/crp_cpc_list_filtered_with_search.sql`

### Modified Files
- ✅ `backend/src/controllers/crp-cpc.controller.js`

### Existing Files (Not Modified)
- `backend/reports/crp_cpc_list.sql` - Search without filters
- `backend/reports/crp_cpc_list_filtered.sql` - Filters without search

---
**Created:** January 13, 2026
**Status:** ✅ Complete and Ready for Testing
**Impact:** High - Fixed critical search functionality when filters are active
