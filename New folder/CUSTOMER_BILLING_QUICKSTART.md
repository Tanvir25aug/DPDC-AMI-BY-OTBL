# Customer Billing Details - Quick Start Guide

## 🚀 Quick Access

### URL
```
http://your-domain/customer-billing-details
```

### From Sidebar
1. Login to the application
2. Look for **"Customer Billing"** in the left sidebar
3. Click to open the page

---

## 📋 How to Use

### Step 1: Search for Customer
1. Enter **Customer ID** in the search box (e.g., `12345`)
2. Click **"Search"** button or press **Enter**
3. Wait for data to load

### Step 2: View Customer Information
Once loaded, you'll see:
- **Customer Number**
- **Meter Number**
- **NOCS** (Network Operating Control System location)
- **Tariff Type** (PPD = Prepaid)
- **Connection Date**
- **Account Status** (Active/Inactive)
- **Address**
- **Phone Number**

### Step 3: Review Analytics
Four key metrics displayed:
1. **Total Consumption** - Total kWh consumed
2. **Total Charges** - Total BDT charged
3. **Avg Monthly Charge** - Average monthly bill
4. **Current Balance** - Outstanding due or credit

### Step 4: View Billing Data

#### Daily View (Default)
- Shows **ALL** daily billing records (no pagination)
- Columns:
  - Date
  - Meter Serial Number
  - Start Reading
  - End Reading
  - Consumption (kWh)
  - Daily Charge (BDT)
- **Search**: Type in search box to filter records
- **Export**: Click "Export CSV" to download

#### Monthly View
- Shows aggregated monthly totals
- Columns:
  - Month & Year
  - Billing Days
  - Total Consumption (kWh)
  - Total Charges (BDT)
  - Average Daily Charge
- **Search**: Type in search box to filter records
- **Export**: Click "Export CSV" to download

---

## 🔍 Key Features

### ✅ Complete Data
- Fetches **ALL** billing records (no row limit)
- Historical data from connection date to present

### ✅ Smart Aggregation
- Daily data automatically aggregated into monthly totals
- Accurate calculations for consumption and charges

### ✅ Real-time Search
- Instant filtering as you type
- Searches across all columns
- No server calls needed

### ✅ Export Functionality
- Export daily data to CSV
- Export monthly data to CSV
- File named: `billing_daily_CUSTID_timestamp.csv`

### ✅ Responsive Design
- Works on desktop, tablet, and mobile
- Smooth animations and transitions
- Sticky table headers for easy scrolling

---

## 💡 Tips

1. **Large Datasets**: If customer has years of data, use search to quickly find specific periods

2. **Monthly View**: Best for high-level overview and trends

3. **Daily View**: Best for detailed analysis and meter reading verification

4. **Export Before Analysis**: Export to CSV for further analysis in Excel or other tools

5. **Balance Indicator**:
   - **Red** = Customer has due (owes money)
   - **Green** = Customer has credit (advance payment)

---

## 📊 Understanding the Data

### Daily Charges
- Calculated based on consumption and tariff rate
- Includes all applicable charges per billing rules

### Monthly Totals
- Sum of all daily charges in that month
- Total consumption = Sum of daily consumption
- Billing days = Number of days with billing records

### Current Balance
- **Negative value** = Customer owes money (DUE)
- **Positive value** = Customer has advance payment (CREDIT)
- **Zero** = Account is settled

---

## ⚠️ Troubleshooting

### No Data Found
- Verify Customer ID is correct
- Check if customer has billing records in the system
- Ensure customer is a Prepaid (PPD) customer

### Slow Loading
- Customer may have extensive billing history
- Data fetching all records (no limit)
- Wait for complete load or check network connection

### Missing Customer Info
- Some fields may be optional (Phone, Address)
- "N/A" displayed for missing data
- Contact admin if critical data is missing

---

## 🎯 Best Practices

1. **Regular Monitoring**: Check billing details monthly for accuracy

2. **Verify Readings**: Compare start/end readings with physical meter

3. **Track Consumption**: Use monthly view to identify consumption patterns

4. **Export Records**: Keep CSV backups for audit purposes

5. **Report Issues**: If you see discrepancies, note the date and usage ID for support

---

## 📞 Support

For technical issues or questions:
- Check logs in browser console (F12)
- Contact system administrator
- Refer to `CUSTOMER_BILLING_IMPLEMENTATION.md` for technical details

---

## 🔐 Security

- ✅ Requires authentication
- ✅ Secure API endpoints
- ✅ Data encrypted in transit
- ✅ Access logged for audit

---

## 🎨 UI Elements

### Color Coding
- **Blue/Indigo**: Primary actions and headers
- **Green**: Positive values (credit, active status)
- **Red**: Negative values (due, inactive status)
- **Gray**: Neutral information

### Icons
- 🔍 Search
- 📊 Analytics
- 📥 Export
- 👤 Customer Info
- ⚡ Consumption
- 💰 Charges

---

## ⏱️ Performance

- **Initial Load**: 2-5 seconds (depending on data volume)
- **Search/Filter**: Instant (client-side)
- **Tab Switch**: Instant (data cached)
- **Export**: 1-2 seconds

---

## 🔄 Updates

This feature automatically:
- Fetches latest billing data from Oracle database
- Calculates real-time analytics
- Aggregates monthly totals dynamically
- Reflects current account balance

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Status**: Production Ready ✅
