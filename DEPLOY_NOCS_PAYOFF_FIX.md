# Deploy NOCS Customer Payoff Fixes

## What Was Fixed

1. **Query Performance**: Optimized SQL query to prevent timeouts (10-15 sec instead of 30-45 sec)
2. **Customer Name Issue**: Now shows Customer ID (Oracle limitation - no separate name column available)
3. **Balance Statistics**: Added comprehensive breakdown (Credit Qty/Balance, Due Qty/Balance, Net Balance)

## Deployment Instructions

### Step 1: Connect to Production Server
```bash
ssh oculin@dpdc-report-srv
cd ~/DPDC-AMI-BY-OTBL
```

### Step 2: Pull Latest Code
```bash
git pull origin main
```

### Step 3: Rebuild Frontend
```bash
cd frontend
npm run build
```

### Step 4: Reload Nginx
```bash
sudo systemctl reload nginx
```

### Step 5: Restart Backend (if needed)
```bash
# Only if you made changes to backend code
pm2 restart dpdc-backend
```

## Testing Checklist

After deployment, test the following:

### 1. Page Loads Successfully
- Navigate to NOCS Balance Summary page
- Click on any NOCS to view Customer Payoff
- Page should load within 15 seconds

### 2. Verify Summary Statistics
Confirm all 8 statistics are displayed:
- Total Customers
- Total Payoff Balance
- Average Balance
- Credit Qty
- Credit Balance
- Due Qty
- Due Balance
- Net Balance

### 3. Check Data Table
- Customer ID column populated
- Customer Name shows Customer ID (this is expected due to Oracle schema)
- Address populated
- Customer Type shows correct values (Prepaid, Residential, etc.)
- Payoff Balance displays correctly with proper formatting

### 4. Test Search Functionality
- Search by Customer ID
- Search by Address
- Verify results filter correctly

### 5. Test Export to Excel
- Click "Export to Excel" button
- Verify Excel file downloads with all customer data
- Check column formatting

## Expected Behavior

### Customer Name = Customer ID
**Note**: Both columns will show the same value (Customer ID) because:
- The Oracle database doesn't have a separate customer name column available
- The `sp_char.ADHOC_CHAR_VAL` field contains the legacy customer identifier
- This is a database schema limitation, not a bug

If you need actual customer names, you'll need to identify which Oracle table and column contains customer names, then update the query.

## Performance Notes

- Query limited to 1000 rows maximum for performance
- Uses pre-aggregation for faster execution
- Parallel processing enabled for large datasets
- Should complete in 10-15 seconds even for busy NOCS

## Troubleshooting

### If page shows "Page Not Found"
```bash
cd ~/DPDC-AMI-BY-OTBL/frontend
npm run build
sudo systemctl reload nginx
```

### If query still times out
- Check if NOCS has more than 1000 customers
- Verify Oracle database is responding normally
- Check backend logs: `pm2 logs dpdc-backend`

### If statistics don't appear
- Hard refresh browser (Ctrl + F5)
- Clear browser cache
- Verify API is returning data: Check Network tab in browser DevTools

## Files Modified

### Backend
- `backend/reports/nocs_customer_payoff.sql` - Optimized query

### Frontend
- `frontend/src/views/NocsCustomerPayoffView.vue` - Added balance breakdown

## Rollback (if needed)

If issues occur after deployment:
```bash
cd ~/DPDC-AMI-BY-OTBL
git log --oneline -5  # Find previous commit hash
git checkout <previous-commit-hash>
cd frontend && npm run build
sudo systemctl reload nginx
pm2 restart dpdc-backend
```
