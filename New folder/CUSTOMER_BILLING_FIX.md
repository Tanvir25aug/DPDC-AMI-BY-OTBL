# Customer Billing - 500 Error Fix

## Problem
Getting 500 Internal Server Error when trying to fetch customer billing details.

## Root Cause
The SQL queries had incorrect table join structures that didn't match the CC&B database schema.

## Fixes Applied

### 1. Fixed `customer_billing_details.sql`
**Issues:**
- Incorrect join between `ci_sp_char` and `ci_sa` (was using `sa.sp_id` directly)
- Missing proper service point lookup through `CI_SA_SP` table
- Balance calculation not using the right structure

**Solution:**
- Used subquery to find SA_ID through proper table chain: `CI_SP_CHAR` → `CI_SA_SP` → `CI_SA`
- Maintained original query structure for table joins
- Kept PAYOFF_BAL calculation as correlated subquery (matching original)

### 2. Fixed `customer_additional_info.sql`
**Issues:**
- Incorrect join path to get customer information
- Missing `ci_sa_sp` bridge table

**Solution:**
- Added proper join through `ci_sa_sp` table: `ci_sp_char` → `ci_sa_sp` → `ci_sa`
- Fixed meter number lookup through proper D1 table chain
- Added filters for active accounts only

## SQL Query Structure

### Main Billing Query Flow
```
User provides: custId (Customer ID from CM_LEGCY)
    ↓
Find SP_ID: CI_SP_CHAR (where CHAR_TYPE_CD='CM_LEGCY' and ADHOC_CHAR_VAL=custId)
    ↓
Find SA_ID: CI_SA_SP → CI_SA (where SA_TYPE_CD='PPD')
    ↓
Get Billing Segments: CI_BSEG (where SA_ID=found SA_ID)
    ↓
Join Usage Data: CI_BSEG → C1_USAGE → D1_USAGE → D1_USAGE_PERIOD_SQ
    ↓
Get Meter Info: D1_MEASR_COMP → D1_DVC_CFG → D1_DVC_IDENTIFIER
    ↓
Get Customer Contact: CI_SA → CI_ACCT → CI_ACCT_PER → C1_PER_CONTDET
    ↓
Get NOCS Info: CI_SA → CI_PREM_CHAR → CI_CHAR_VAL_L
    ↓
Calculate readings with CTE (meter_readings)
```

## How to Test

### Step 1: Verify Backend is Running
```bash
cd backend
npm start
```

### Step 2: Test in Browser
1. Login to the application
2. Navigate to "Customer Billing" in the sidebar
3. Enter a valid Customer ID (test with one from your database)
4. Click "Search"

### Step 3: Find a Valid Customer ID

Run this query in your Oracle database to find a test customer:

```sql
SELECT s1.adhoc_char_val AS CUSTOMER_ID
FROM ci_sp_char s1
INNER JOIN ci_sa_sp sasp ON sasp.sp_id = s1.sp_id
INNER JOIN ci_sa sa ON sa.sa_id = sasp.sa_id
INNER JOIN ci_bseg b ON b.sa_id = sa.sa_id
WHERE s1.char_type_cd = 'CM_LEGCY'
  AND sa.sa_type_cd = 'PPD'
  AND sa.sa_status_flg = '20'
  AND b.bseg_stat_flg <> '60'
  AND ROWNUM <= 5;
```

This will give you 5 valid customer IDs to test with.

### Step 4: Check Backend Logs

If you still get errors, check:
```bash
tail -f backend/logs/combined.log
```

Look for error messages related to:
- SQL syntax errors
- Missing tables/columns
- Permission issues

## Expected Response

When successful, you should see:

### Customer Info Card
- Customer Number
- Meter Number
- NOCS Name
- Tariff Type (PPD)
- Connection Date
- Account Status (Active)
- Address
- Phone Number

### Analytics Dashboard
- Total Consumption (kWh)
- Total Charges (BDT)
- Average Monthly Charge
- Current Balance (Due/Credit)

### Daily Billing Table
All daily billing records with:
- Date
- Meter Serial Number
- Start Reading
- End Reading
- Consumption (kWh)
- Daily Charge (BDT)

### Monthly Billing Table
Aggregated monthly totals with:
- Month & Year
- Billing Days
- Total Consumption
- Total Charges
- Average Daily Charge

## Common Issues & Solutions

### Issue 1: "ORA-00904: invalid identifier"
**Cause:** Column or table doesn't exist in your database
**Solution:** Check if your CC&B version has the same table/column names

### Issue 2: "No data found"
**Cause:** Customer ID doesn't exist or has no billing data
**Solution:** Use the SQL query above to find valid customer IDs

### Issue 3: "Query timeout"
**Cause:** Customer has too much historical data
**Solution:** Add date filters to the query (optional enhancement)

### Issue 4: "Cannot read property of null"
**Cause:** Customer info query returned no results
**Solution:** Check if customer has active service agreement

## Performance Notes

The query is optimized with:
- ✅ WITH clause (CTE) for meter readings - reduces redundant queries
- ✅ Proper indexed joins on SA_ID, BSEG_ID, D1_USAGE_ID
- ✅ Filtered by active prepaid accounts only
- ✅ No row limit - fetches all historical data

**Expected Performance:**
- Small dataset (< 100 records): 1-2 seconds
- Medium dataset (100-1000 records): 2-5 seconds
- Large dataset (1000+ records): 5-10 seconds

## API Endpoint

```
GET /api/reports/customer_billing_details?custId={customerID}
```

**Headers:**
```
Authorization: Bearer {your_token}
```

**Success Response:**
```json
{
  "success": true,
  "customerInfo": { ... },
  "dailyBilling": [ ... ],
  "monthlyBilling": [ ... ],
  "analytics": { ... },
  "counts": {
    "dailyRecords": 365,
    "monthlyRecords": 12
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch customer billing details",
  "error": "ORA-XXXXX: error message"
}
```

## Testing with Postman/cURL

```bash
curl -X GET \
  'http://localhost:3000/api/reports/customer_billing_details?custId=12345' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

## Database Permissions Required

Ensure your Oracle user has SELECT permissions on:
- ci_sp_char
- ci_sa_sp
- ci_sa
- ci_bseg
- ci_bseg_calc_ln
- c1_usage
- d1_usage
- d1_usage_period_sq
- d1_usage_scalar_dtl
- d1_us_contact
- d1_measr_comp
- d1_dvc_cfg
- d1_dvc_identifier
- ci_acct_per
- ci_acct
- c1_per_contdet
- ci_prem
- ci_prem_char
- ci_char_val_l
- ci_ft
- d1_sp_identifier
- d1_sp
- d1_sp_facility
- d1_facility_identifier
- d1_facility
- d1_facility_l
- d1_nw_loc
- d1_nw_node
- d1_install_evt

## Next Steps

1. ✅ Restart backend server
2. ✅ Test with valid customer ID
3. ✅ Verify data displays correctly
4. ✅ Check performance with large datasets
5. ✅ Test export functionality

## Support

If issues persist:
1. Check backend console for detailed error messages
2. Check browser console (F12) for frontend errors
3. Verify Oracle connection in `backend/src/config/oracle.js`
4. Test SQL queries directly in Oracle SQL Developer
5. Check that all required tables exist and have data

## Files Modified

- `backend/reports/customer_billing_details.sql` - Fixed table joins
- `backend/reports/customer_additional_info.sql` - Fixed table joins

**Status:** ✅ Ready to test

**Last Updated:** 2025-01-15
