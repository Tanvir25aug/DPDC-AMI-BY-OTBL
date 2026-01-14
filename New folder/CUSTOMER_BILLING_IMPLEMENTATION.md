# Customer Billing Details Implementation

## Overview
Complete implementation of Customer Billing Details feature with optimized performance, daily/monthly views, and comprehensive analytics.

## Features Implemented

### 1. **Optimized SQL Queries**
- **Location**: `backend/reports/customer_billing_details.sql`
- **Optimizations**:
  - Used WITH clause (CTE) to eliminate correlated subqueries
  - Pre-calculated meter readings in a single pass
  - Pre-calculated customer balance separately
  - Added PARALLEL hints for parallel execution
  - Removed N+1 query pattern
  - Fetches ALL data with no row limit (maxRows: 0)

- **Location**: `backend/reports/customer_additional_info.sql`
- **Purpose**: Fetch customer information including:
  - NOCS Name
  - Tariff Type (SA_TYPE_CD)
  - Connection Date (START_DT)
  - Account Status
  - Address, Phone, Meter Number
  - Feeder information

### 2. **Backend API Implementation**

#### New Controller Functions
**Location**: `backend/src/controllers/reports.controller.js`

- `getCustomerBillingDetails()` - Main endpoint handler
- `aggregateMonthlyBilling()` - Helper to aggregate daily data into monthly totals
- `calculateBillingAnalytics()` - Helper to compute billing statistics

#### API Endpoint
```
GET /api/reports/customer_billing_details?custId={customerId}
```

**Response Structure**:
```json
{
  "success": true,
  "customerInfo": {
    "CUSTOMER_NO": "12345",
    "METER_NO": "MTR001",
    "NOCS_NAME": "Gulshan NOCS",
    "TARIFF_TYPE": "PPD",
    "CONNECTION_DATE": "2023-01-15",
    "ACCOUNT_STATUS": "20",
    "STATUS_DESCRIPTION": "Active",
    "ADDRESS": "House 12, Road 5, Gulshan, Dhaka",
    "PHONE_NO": "01712345678"
  },
  "dailyBilling": [
    {
      "CUSTID": "12345",
      "MSN": "MTR001",
      "USAGEID": "USG001",
      "START_DT": "2024-01-01",
      "END_DT": "2024-01-01",
      "DAILY_CHARGES": 25.50,
      "START_READ": 1000,
      "END_READ": 1010,
      "QUANTITY": 10,
      "PAYOFF_BAL": -500.00,
      "NOCS_NAME": "Gulshan NOCS"
    }
  ],
  "monthlyBilling": [
    {
      "MONTH": "2024-01",
      "YEAR": 2024,
      "MONTH_NAME": "January",
      "TOTAL_CHARGES": 765.00,
      "TOTAL_CONSUMPTION": 300,
      "BILLING_DAYS": 30,
      "START_DATE": "2024-01-01",
      "END_DATE": "2024-01-30",
      "RECORDS_COUNT": 30
    }
  ],
  "analytics": {
    "totalConsumption": 3600,
    "totalCharges": 9180.00,
    "averageDailyConsumption": 10.00,
    "averageDailyCharges": 25.50,
    "averageMonthlyConsumption": 300.00,
    "averageMonthlyCharges": 765.00,
    "highestDailyCharge": 35.00,
    "lowestDailyCharge": 18.00,
    "currentBalance": -500.00
  },
  "counts": {
    "dailyRecords": 360,
    "monthlyRecords": 12
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 3. **Frontend Implementation**

#### New Vue Component
**Location**: `frontend/src/views/CustomerBillingDetailsView.vue`

**Features**:
- Customer search by Customer ID
- Customer information card with:
  - Customer No, Meter No, NOCS
  - Tariff Type, Connection Date, Account Status
  - Address, Phone Number
- Analytics dashboard with 4 key metrics:
  - Total Consumption (kWh)
  - Total Charges (BDT)
  - Average Monthly Charge (BDT/month)
  - Current Balance (Due/Credit)
- Tabbed view for Daily and Monthly data
- Search functionality for both views
- Export to CSV functionality
- Responsive design with smooth animations
- Loading states and error handling

#### Daily View Features
- Shows all daily billing records
- Columns: Date, Meter, Start Read, End Read, Consumption, Daily Charge
- Real-time search filtering
- Scrollable table with sticky headers
- CSV export

#### Monthly View Features
- Aggregated monthly totals
- Columns: Month, Billing Days, Total Consumption, Total Charges, Avg Daily Charge
- Real-time search filtering
- Scrollable table with sticky headers
- CSV export

### 4. **Routing & Navigation**

#### Router Configuration
**Location**: `frontend/src/router/index.js`
- Added route: `/customer-billing-details`
- Component: `CustomerBillingDetailsView.vue`
- Requires authentication

#### Sidebar Navigation
**Location**: `frontend/src/components/layout/Sidebar.vue`
- Added menu item: "Customer Billing"
- Icon: DocumentTextIcon
- Positioned after "NOCS Balance"

## Performance Optimizations

### SQL Level
1. **WITH Clause (CTE)**: Eliminates correlated subqueries
2. **PARALLEL Hints**: Enables parallel query execution
3. **Indexed Joins**: Leverages existing database indexes
4. **Single Pass Aggregation**: Pre-calculates readings and balances
5. **No Row Limit**: Fetches all data (maxRows: 0)

### Backend Level
1. **Server-side Aggregation**: Monthly totals calculated in Node.js
2. **Single API Call**: Returns all data in one request
3. **Efficient Data Processing**: Uses Map for O(1) lookups

### Frontend Level
1. **Computed Properties**: Reactive filtering without re-fetching
2. **Client-side Search**: Instant filtering on large datasets
3. **Virtual Scrolling**: Handles thousands of rows smoothly
4. **Lazy Loading**: Component loaded on-demand via router

## Data Flow

```
User Input (Customer ID)
    ↓
Frontend: CustomerBillingDetailsView.vue
    ↓
API: GET /api/reports/customer_billing_details?custId=12345
    ↓
Backend: reports.controller.js → getCustomerBillingDetails()
    ↓
Service: reports.service.js → executeReport()
    ↓
Oracle: Execute customer_billing_details.sql (NO LIMIT)
    ↓
Oracle: Execute customer_additional_info.sql
    ↓
Backend: Aggregate monthly data, calculate analytics
    ↓
Response: JSON with customerInfo, dailyBilling, monthlyBilling, analytics
    ↓
Frontend: Display in cards, tables, and analytics
```

## Usage

### Access the Feature
1. Login to the application
2. Navigate to "Customer Billing" from the sidebar
3. Enter a Customer ID (e.g., "12345")
4. Click "Search" or press Enter
5. View customer info, analytics, and billing data
6. Switch between Daily and Monthly tabs
7. Use search to filter records
8. Export data to CSV as needed

### Example Customer IDs
You can test with any valid Customer ID from the `ci_sp_char` table where `char_type_cd = 'CM_LEGCY'`.

## Files Modified/Created

### Backend
- ✅ `backend/reports/customer_billing_details.sql` (NEW)
- ✅ `backend/reports/customer_additional_info.sql` (NEW)
- ✅ `backend/src/controllers/reports.controller.js` (MODIFIED)
- ✅ `backend/src/routes/reports.routes.js` (MODIFIED)
- ✅ `backend/src/services/reports.service.js` (MODIFIED)

### Frontend
- ✅ `frontend/src/views/CustomerBillingDetailsView.vue` (NEW)
- ✅ `frontend/src/router/index.js` (MODIFIED)
- ✅ `frontend/src/components/layout/Sidebar.vue` (MODIFIED)

## Testing Checklist

- [ ] Test with valid customer ID
- [ ] Test with invalid customer ID
- [ ] Test with customer having no billing data
- [ ] Verify all customer info fields display correctly
- [ ] Verify daily billing data loads completely (no row limit)
- [ ] Verify monthly aggregation is accurate
- [ ] Verify analytics calculations are correct
- [ ] Test daily view search functionality
- [ ] Test monthly view search functionality
- [ ] Test CSV export for daily data
- [ ] Test CSV export for monthly data
- [ ] Test responsive design on mobile/tablet
- [ ] Test performance with large datasets (1000+ records)
- [ ] Verify navigation from sidebar works
- [ ] Verify authentication is required

## Analytics Calculated

1. **Total Consumption**: Sum of all QUANTITY values (kWh)
2. **Total Charges**: Sum of all DAILY_CHARGES values (BDT)
3. **Average Daily Consumption**: Total consumption / number of daily records
4. **Average Daily Charges**: Total charges / number of daily records
5. **Average Monthly Consumption**: Total consumption / number of months
6. **Average Monthly Charges**: Total charges / number of months
7. **Highest Daily Charge**: Maximum daily charge value
8. **Lowest Daily Charge**: Minimum daily charge value (excluding zero)
9. **Current Balance**: Latest PAYOFF_BAL (negative = due, positive = credit)

## Benefits

### For Users
- ✅ Comprehensive view of customer billing history
- ✅ Easy access to customer information
- ✅ Clear visualization of daily and monthly consumption
- ✅ Quick insights with analytics dashboard
- ✅ Export functionality for reporting
- ✅ Fast search and filtering

### For System
- ✅ Optimized SQL queries reduce database load
- ✅ Single API call minimizes network overhead
- ✅ Server-side aggregation reduces frontend processing
- ✅ Scalable architecture handles large datasets
- ✅ No row limits - fetches all historical data

## Future Enhancements

1. **Charts & Graphs**
   - Line chart for daily consumption trends
   - Bar chart for monthly comparison
   - Pie chart for charge breakdown

2. **Date Range Filtering**
   - Add date pickers for custom range
   - Quick filters (last 30 days, last 3 months, etc.)

3. **Advanced Export**
   - PDF export with formatted report
   - Excel export with multiple sheets
   - Email report functionality

4. **Pagination**
   - Optional pagination for extremely large datasets
   - Infinite scroll for better UX

5. **Comparison**
   - Compare multiple months
   - Compare with NOCS average
   - Year-over-year comparison

## Maintenance Notes

- SQL queries are optimized for Oracle CC&B database
- Queries assume standard CC&B table structure
- All dates are in Oracle DATE format
- Currency is assumed to be BDT (Bangladesh Taka)
- Tariff type 'PPD' indicates Prepaid customers

## Support

For issues or questions, refer to:
- Backend logs: `backend/logs/`
- Frontend console: Browser Developer Tools
- Database: Check Oracle connection in `backend/src/config/oracle.js`
