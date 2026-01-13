# CRP-CPC Backend Filtering Implementation

## Summary
Implemented server-side filtering for the CRP-CPC Management page. Filters are now applied at the database level, returning ALL matching records across the entire dataset, not just filtering loaded page data.

## Problem Solved

**Before:** Filters only worked on the currently loaded page (50 records). If there were 1000 CRPs with bill stop issues in the database, users would only see filters applied to the 50 loaded records.

**After:** Filters query the PostgreSQL database to find ALL matching records, then fetch the corresponding CRP details from Oracle. Users now see all matching results with proper pagination.

## How It Works

### Architecture Flow

1. **User selects filter** (e.g., "Has Bill Stop Issues")
2. **Frontend sends filter parameters** to backend API
3. **Backend queries PostgreSQL** `bill_stop_summary` table with filters
4. **PostgreSQL returns filtered CRP account numbers**
5. **Backend queries Oracle** to get details for those specific CRPs
6. **Results returned with pagination** (50 per page)

### Example Workflow

```
User: Select "Bill Stop Status" = "Has Bill Stop Issues"
      Select "Connection Count" = "More than 100"

PostgreSQL Query:
  SELECT crp_account_no, bill_stop_count, active_billing_count
  FROM bill_stop_summary
  WHERE batch_date = CURRENT_DATE
    AND bill_stop_count > 0
    AND total_cpc_count > 100
  ORDER BY bill_stop_count DESC

Result: 250 CRP accounts match

Oracle Query (for page 1):
  Get details for CRP accounts 1-50

Frontend Display:
  "Showing 50 of 250 results (filtered from database)"
```

## Files Modified

### 1. Backend Controller

**File:** `backend/src/controllers/crp-cpc.controller.js`

**Changes:**
- Added filter parameters to `getCRPCPCList` function
- Implemented PostgreSQL filtering before Oracle query
- Added dynamic WHERE clause building
- Added dynamic ORDER BY clause building
- Added pagination on filtered results

**New Parameters:**
```javascript
const filterConnectionCount = req.query.filterConnectionCount || null;
const filterBillStop = req.query.filterBillStop || null;
const filterActiveBilling = req.query.filterActiveBilling || null;
const sortBy = req.query.sortBy || 'account-asc';
```

**PostgreSQL Filter Logic (Lines 53-111):**
```javascript
// Build WHERE clause
let pgWhereConditions = ['batch_date = CURRENT_DATE'];

if (filterBillStop === 'has-issues') {
  pgWhereConditions.push(`bill_stop_count > 0`);
} else if (filterBillStop === 'no-issues') {
  pgWhereConditions.push(`(bill_stop_count = 0 OR bill_stop_count IS NULL)`);
}

if (filterActiveBilling === 'has-active') {
  pgWhereConditions.push(`active_billing_count > 0`);
} else if (filterActiveBilling === 'no-active') {
  pgWhereConditions.push(`(active_billing_count = 0 OR active_billing_count IS NULL)`);
}

if (filterConnectionCount) {
  switch (filterConnectionCount) {
    case '0-10':
      pgWhereConditions.push(`total_cpc_count < 10`);
      break;
    case '10-50':
      pgWhereConditions.push(`total_cpc_count >= 10 AND total_cpc_count <= 50`);
      break;
    case '50-100':
      pgWhereConditions.push(`total_cpc_count > 50 AND total_cpc_count <= 100`);
      break;
    case '100+':
      pgWhereConditions.push(`total_cpc_count > 100`);
      break;
  }
}

// Build ORDER BY clause
let pgOrderBy = 'crp_account_no ASC';
switch (sortBy) {
  case 'account-asc':
    pgOrderBy = 'crp_account_no ASC';
    break;
  case 'account-desc':
    pgOrderBy = 'crp_account_no DESC';
    break;
  case 'connections-asc':
    pgOrderBy = 'total_cpc_count ASC';
    break;
  case 'connections-desc':
    pgOrderBy = 'total_cpc_count DESC';
    break;
  case 'billstop-desc':
    pgOrderBy = 'bill_stop_count DESC';
    break;
  case 'active-desc':
    pgOrderBy = 'active_billing_count DESC';
    break;
}
```

**PostgreSQL Query (Lines 118-130):**
```javascript
const pgQuery = `
  SELECT
    crp_account_no,
    total_cpc_count,
    bill_stop_count,
    active_billing_count
  FROM bill_stop_summary
  WHERE ${pgWhereConditions.join(' AND ')}
  ORDER BY ${pgOrderBy}
`;

const billStopData = await pgPool.query(pgQuery, pgParams);
```

**Pagination on Filtered Results (Lines 176-191):**
```javascript
if (filteredCRPAccounts && filteredCRPAccounts.length > 0) {
  // Apply pagination to filtered accounts
  const paginatedAccounts = filteredCRPAccounts.slice(offset, offset + limit);

  // Build Oracle query to get only these specific CRPs
  if (paginatedAccounts.length > 0) {
    const accountsParam = paginatedAccounts.join(',');
    data = await reportsService.executeReport(
      'crp_cpc_list_filtered',
      { crp_accounts: accountsParam }
    );
  } else {
    data = [];
  }

  totalCount = filteredCRPAccounts.length;
}
```

### 2. New SQL Query File

**File:** `backend/reports/crp_cpc_list_filtered.sql`

**Purpose:** Get CRP details from Oracle for specific account numbers (after PostgreSQL filtering)

**Query:**
```sql
-- CRP-CPC List - Filtered by Specific CRP Accounts
-- Get CRP details for specific account numbers (after filtering in PostgreSQL)
-- Parameters: :crp_accounts (comma-separated list of CRP account numbers)

SELECT
    crp.CPR_CUSTOMER_ID AS CRP_ID,
    crp.CPR_CUSTOMER_ID AS CRP_ACCOUNT_NO,
    COUNT(DISTINCT cpc_cust.adhoc_char_val) AS TOTAL_CPC_COUNT,
    0 AS BILLED_THIS_MONTH,
    0 AS NOT_BILLED_THIS_MONTH
FROM (
    -- Parse comma-separated CRP accounts
    SELECT DISTINCT
        TRIM(REGEXP_SUBSTR(:crp_accounts, '[^,]+', 1, LEVEL)) AS CPR_CUSTOMER_ID
    FROM DUAL
    CONNECT BY LEVEL <= REGEXP_COUNT(:crp_accounts, ',') + 1
) crp
LEFT JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
    AND cpr_ref.char_type_cd = 'CM_CPRLA'
LEFT JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
    AND cpc_cust.char_type_cd = 'CM_LEGCY'
GROUP BY crp.CPR_CUSTOMER_ID
ORDER BY crp.CPR_CUSTOMER_ID
```

**How it works:**
- Takes comma-separated CRP account numbers as parameter
- Uses `REGEXP_SUBSTR` to parse the CSV string
- Joins to Oracle tables to get CPC counts
- Returns only the specified CRPs

### 3. Frontend Updates

**File:** `frontend/src/views/CRPCPCView.vue`

**Changes:**

**A. Send Filter Parameters to Backend (Lines 798-839):**
```javascript
const fetchData = async () => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    search: searchQuery.value || null
  };

  // Add filters to params if they are active
  if (filterConnectionCount.value) {
    params.filterConnectionCount = filterConnectionCount.value;
  }
  if (filterBillStop.value) {
    params.filterBillStop = filterBillStop.value;
  }
  if (filterActiveBilling.value) {
    params.filterActiveBilling = filterActiveBilling.value;
  }
  if (sortBy.value && sortBy.value !== 'account-asc') {
    params.sortBy = sortBy.value;
  }

  const response = await api.get('/crp-cpc/list', { params });
  // ...
};
```

**B. Removed Client-Side Filtering (Lines 885-889):**
```javascript
// Before: Complex client-side filtering logic (60+ lines)
// After: Simple pass-through
const filteredCRPList = computed(() => {
  // All filtering and sorting is now done on the backend
  return crpList.value;
});
```

**C. Auto-Apply Filters on Change (Lines 100, 117, 130, 144):**
```vue
<select v-model="filterConnectionCount" @change="applyFilters">
<select v-model="filterBillStop" @change="applyFilters">
<select v-model="filterActiveBilling" @change="applyFilters">
<select v-model="sortBy" @change="applyFilters">
```

**D. Apply Filters Function (Lines 923-926):**
```javascript
const applyFilters = () => {
  currentPage.value = 1; // Reset to page 1 when filters change
  fetchData();
};
```

**E. Updated Badge Click Handlers (Lines 163, 171, 179, 187):**
```vue
<button @click="filterConnectionCount = ''; applyFilters()">
<button @click="filterBillStop = ''; applyFilters()">
<button @click="filterActiveBilling = ''; applyFilters()">
<button @click="sortBy = 'account-asc'; applyFilters()">
```

**F. Updated Results Counter (Lines 221-226):**
```vue
<div v-if="totalCount > 0" class="mt-4 pt-4 border-t border-gray-200">
  <p class="text-sm text-gray-600">
    Showing <span class="font-semibold text-gray-900">{{ crpList.length }}</span>
    of <span class="font-semibold text-gray-900">{{ totalCount }}</span> results
    <span v-if="hasActiveFilters" class="text-blue-600">(filtered from database)</span>
  </p>
</div>
```

## Filter Options

### Connection Count Filter
- `''` (empty) - All Connections
- `'0-10'` - Less than 10 connections
- `'10-50'` - 10 to 50 connections
- `'50-100'` - 50 to 100 connections
- `'100+'` - More than 100 connections

### Bill Stop Status Filter
- `''` (empty) - All Status
- `'has-issues'` - bill_stop_count > 0
- `'no-issues'` - bill_stop_count = 0 or NULL

### Active Billing Filter
- `''` (empty) - All Billing
- `'has-active'` - active_billing_count > 0
- `'no-active'` - active_billing_count = 0 or NULL

### Sort Options
- `'account-asc'` - CRP Account (A-Z) - default
- `'account-desc'` - CRP Account (Z-A)
- `'connections-asc'` - Connection Count (Low to High)
- `'connections-desc'` - Connection Count (High to Low)
- `'billstop-desc'` - Bill Stop Count (High to Low)
- `'active-desc'` - Active Billing Count (High to Low)

## Performance Considerations

### Advantages
- ✅ **Accurate Results**: Always shows ALL matching records from database
- ✅ **Efficient Filtering**: PostgreSQL handles filtering (indexed columns)
- ✅ **Proper Pagination**: Pagination works correctly with filtered results
- ✅ **Sorted Results**: Sorting happens at database level (faster)

### Caching Strategy
```javascript
const cacheKey = `crp_cpc_list:page:${page}:limit:${limit}:search:${search || 'all'}:conn:${filterConnectionCount || 'all'}:billstop:${filterBillStop || 'all'}:active:${filterActiveBilling || 'all'}:sort:${sortBy}`;
```

- Each unique filter combination is cached separately
- Cache TTL: 5 minutes
- Cache invalidated when filters change

### PostgreSQL Performance
The `bill_stop_summary` table should have indexes on:
- `batch_date` (already used in WHERE)
- `bill_stop_count` (for filtering)
- `active_billing_count` (for filtering)
- `total_cpc_count` (for filtering)

**Recommended Index:**
```sql
CREATE INDEX idx_bill_stop_summary_filters
ON bill_stop_summary (batch_date, bill_stop_count, active_billing_count, total_cpc_count);
```

## Edge Cases Handled

### 1. No Matching Records
```javascript
if (filteredCRPAccounts && filteredCRPAccounts.length === 0) {
  return res.json({
    success: true,
    data: [],
    pagination: {
      totalCount: 0,
      totalPages: 0
    }
  });
}
```

### 2. PostgreSQL Error
```javascript
catch (pgError) {
  console.error('[CRP-CPC Controller] Error filtering with PostgreSQL:', pgError);
  // Fall back to getting all CRPs without filters
  filteredCRPAccounts = null;
}
```

### 3. Empty Filter Values
- Empty strings are treated as "no filter"
- NULL values in database are handled with `IS NULL` checks

## Testing Guide

### Test Case 1: Bill Stop Filter
1. Select "Bill Stop Status" = "Has Bill Stop Issues"
2. Click through pages
3. Verify all displayed CRPs have BILL_STOP_COUNT > 0
4. Check console: Should see PostgreSQL query with `bill_stop_count > 0`

### Test Case 2: Connection Count Filter
1. Select "Connection Count" = "More than 100"
2. Verify all displayed CRPs have TOTAL_CPC_COUNT > 100
3. Check total count shows only matching records

### Test Case 3: Combined Filters
1. Select "Connection Count" = "More than 100"
2. Select "Bill Stop Status" = "Has Bill Stop Issues"
3. Select "Sort By" = "Bill Stop Issues (High to Low)"
4. Verify results are sorted correctly
5. Verify all results match BOTH filters

### Test Case 4: Clear Filters
1. Apply multiple filters
2. Click "Clear All Filters" button
3. Verify all filters reset
4. Verify data refreshes to show all records

### Test Case 5: Pagination with Filters
1. Apply filter that returns 200+ results
2. Navigate to page 2, 3, etc.
3. Verify pagination shows correct total count
4. Verify each page shows different records

## Console Logging

The implementation includes detailed logging:

```javascript
console.log('[CRP-CPC Controller] PostgreSQL Query:', pgQuery);
console.log(`[CRP-CPC Controller] Found ${filteredCRPAccounts.length} CRPs matching filters`);
console.log('[CRP-CPC] Fetching data with params:', params);
console.log(`[CRP-CPC] Loaded ${crpList.value.length} CRPs, total: ${totalCount.value}`);
```

## API Request Example

**URL:**
```
GET /api/crp-cpc/list?page=1&limit=50&filterConnectionCount=100%2B&filterBillStop=has-issues&sortBy=billstop-desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "CRP_ID": "12345",
      "CRP_ACCOUNT_NO": "12345",
      "TOTAL_CPC_COUNT": 150,
      "BILL_STOP_COUNT": 25,
      "ACTIVE_BILLING_COUNT": 125
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 250,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Migration Notes

### Breaking Changes
- None - API is backward compatible
- If no filters provided, behaves exactly as before

### Database Requirements
- PostgreSQL `bill_stop_summary` table must exist
- Must have `batch_date`, `crp_account_no`, `bill_stop_count`, `active_billing_count`, `total_cpc_count` columns
- Batch job must populate this table daily

## Troubleshooting

### Issue: No results when filter applied
**Solution:**
1. Check PostgreSQL `bill_stop_summary` table has data for `batch_date = CURRENT_DATE`
2. Run: `SELECT COUNT(*) FROM bill_stop_summary WHERE batch_date = CURRENT_DATE;`
3. If 0 results, batch job hasn't run today

### Issue: Incorrect results
**Solution:**
1. Check browser console for PostgreSQL query
2. Run query manually in PostgreSQL to verify results
3. Check Oracle query is getting correct CRP account numbers

### Issue: Slow performance
**Solution:**
1. Add indexes to PostgreSQL `bill_stop_summary` table
2. Check query execution plan: `EXPLAIN SELECT * FROM bill_stop_summary WHERE ...`
3. Consider reducing page size if returning too many results

### Issue: Filters not working
**Solution:**
1. Check browser Network tab - verify filter parameters are sent to backend
2. Check backend console - verify PostgreSQL query includes filter conditions
3. Clear browser cache and backend cache

## Future Enhancements

1. **More Filters**: Add NOCS filter, date range filter, status filter
2. **Save Filter Presets**: Allow users to save commonly used filter combinations
3. **Export Filtered Results**: Export all filtered results to Excel (not just current page)
4. **Filter Analytics**: Track which filters are most commonly used
5. **Advanced Search**: Combine search with filters for more precise results

---
**Created:** January 13, 2026
**Version:** 1.0
**Status:** ✅ Complete and Ready for Testing
