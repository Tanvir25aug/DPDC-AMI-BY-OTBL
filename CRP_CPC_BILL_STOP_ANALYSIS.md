# CRP-CPC Bill Stop Analysis Feature

## Overview
A batch operation feature that identifies CPC customers with bill stop issues (customers who have not been billed in the current month).

## What Was Implemented

### Backend Components

#### 1. SQL Queries
- **`crp_cpc_bill_stop_analysis.sql`** - Detailed analysis of all CPC customers with billing status
- **`crp_cpc_bill_stop_summary.sql`** - Summary statistics grouped by CRP

#### 2. API Endpoint
- **Route**: `GET /api/crp-cpc/bill-stop-analysis`
- **Authentication**: Required
- **Caching**: 10 minutes
- **Response Structure**:
  ```json
  {
    "success": true,
    "summary": [
      {
        "CRP_ACCOUNT_NO": "123456",
        "CRP_ID": "789",
        "TOTAL_CPC_COUNT": 50,
        "BILL_STOP_COUNT": 10,
        "ACTIVE_BILLING_COUNT": 40,
        "BILL_STOP_PERCENTAGE": 20.00
      }
    ],
    "details": [
      {
        "CRP_ACCOUNT_NO": "123456",
        "CPC_CUSTOMER_NO": "987654",
        "METER_NO": "12345678",
        "CUSTOMER_NAME": "John Doe",
        "ADDRESS": "...",
        "NOCS_NAME": "...",
        "PHONE_NO": "...",
        "SA_STATUS_DESC": "Active",
        "LAST_BILL_DATE": "15-DEC-2025",
        "BILLING_STATUS": "Bill Stop Issue",
        "CURRENT_BALANCE": 5000.00
      }
    ],
    "statistics": {
      "totalCRPs": 100,
      "totalCPCs": 5000,
      "totalBillStopIssues": 500,
      "totalActiveBilling": 4500,
      "billStopPercentage": "10.00"
    }
  }
  ```

### Frontend Components

#### 1. Bill Stop Analysis Button
- Located in the top navigation bar (orange button)
- Shows loading spinner while analyzing
- Opens modal with results when complete

#### 2. Bill Stop Analysis Modal
Features:
- **Statistics Dashboard**: Shows total CRPs, CPCs, bill stop issues, and active billing counts
- **Summary Table**: Groups results by CRP showing:
  - CRP Account Number
  - Total CPC Count
  - Bill Stop Count
  - Active Billing Count
  - Bill Stop Percentage
- **Detailed Table**: Shows all CPC customers with bill stop issues:
  - CRP Account
  - CPC Customer Number
  - Meter Number
  - Customer Name
  - Last Bill Date
  - Billing Status (color-coded badges)
  - Current Balance

#### 3. Excel Export
- Green "Export to Excel" button in modal header
- Downloads CSV file with UTF-8 encoding
- Filename format: `Bill_Stop_Analysis_YYYY-MM-DD.csv`
- Includes all CPC customers with bill stop issues
- Columns:
  - CRP Account
  - CPC Customer No
  - Meter No
  - Customer Name
  - Address
  - NOCS
  - Phone
  - SA Status
  - Last Bill Date
  - Billing Status
  - Current Balance

## How Bill Stop Detection Works

A CPC customer has a "Bill Stop Issue" if:
- Their `LAST_BILL_DATE` is NOT in the current month
- This is determined by checking: `bs.end_dt >= TRUNC(SYSDATE, 'MM')`

A CPC customer has "Active Billing" if:
- Their `LAST_BILL_DATE` IS in the current month

## How to Use

1. **Navigate to CRP-CPC Page**
   - Go to the CRP-CPC Management page in your application

2. **Run Bill Stop Analysis**
   - Click the orange "Bill Stop Analysis" button in the top navigation
   - Wait for the analysis to complete (usually takes a few seconds)

3. **Review Results**
   - View the statistics dashboard for overall metrics
   - Check the summary table to see which CRPs have the most bill stop issues
   - Review the detailed table to see individual CPC customers with problems

4. **Export Data**
   - Click "Export to Excel" to download the data
   - Open the CSV file in Excel or any spreadsheet application
   - Use the data for further analysis or reporting

## Performance Optimizations

- **Caching**: Results are cached for 10 minutes to improve performance
- **Optimized SQL**: Uses CTEs (Common Table Expressions) for efficient querying
- **Backend Processing**: All data aggregation happens in the backend
- **Lazy Loading**: Modal only loads when button is clicked

## Files Modified

### Backend
- `backend/reports/crp_cpc_bill_stop_analysis.sql` (new)
- `backend/reports/crp_cpc_bill_stop_summary.sql` (new)
- `backend/src/controllers/crp-cpc.controller.js` (modified)
- `backend/src/routes/crp-cpc.routes.js` (modified)

### Frontend
- `frontend/src/views/CRPCPCView.vue` (modified)

## API Testing

You can test the API endpoint using:

```bash
curl -X GET "http://localhost:3000/api/crp-cpc/bill-stop-analysis" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

Potential improvements:
1. Add filtering by NOCS area
2. Add date range selection for custom bill stop detection
3. Add bulk actions to fix bill stop issues
4. Add email/notification alerts for bill stop issues
5. Add historical trend analysis
6. Add export to PDF format

## Technical Notes

- The analysis uses the `ci_bseg` table to check billing segments
- Excludes bill segments with status '60' (canceled/voided)
- Uses `TRUNC(SYSDATE, 'MM')` to get the first day of current month
- All currency values are displayed in Bangladeshi Taka (৳)
- CSV export uses UTF-8 BOM for proper Excel compatibility
