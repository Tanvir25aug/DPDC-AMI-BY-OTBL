# Monthly Billing History Calculation - Telegram Bot

## Overview
The Telegram bot displays **Monthly Billing History** by fetching **daily billing records** from Oracle and then **aggregating** them into monthly totals.

## Step 1: Fetch Daily Billing Data

**SQL Query:** `backend/reports/customer_billing_details.sql`

### Query Returns (Daily Records):
```sql
SELECT
    T11.ID_VALUE AS MSN,                    -- Meter Serial Number
    :custId AS CUSTID,                      -- Customer ID
    T1.START_DT,                            -- Billing period start date
    T1.END_DT,                              -- Billing period end date
    MAX(T2.AUDIT_CALC_AMT) AS DAILY_CHARGES,-- Daily charges (৳)
    (MAX(T13.end_msrmt) - MIN(T13.start_msrmt)) AS QUANTITY, -- Consumption (kWh)
    MAX(BAL.PAYOFF_BAL) AS PAYOFF_BAL,     -- Current balance
    MAX(NOCS.NOCS_NAME) AS NOCS_NAME       -- NOCS name
FROM ci_bseg T1
-- ... (many joins to get all data)
WHERE T1.BSEG_STAT_FLG<>'60'
    AND T1.SA_ID = (SELECT SA_ID FROM ... WHERE CUSTOMER_ID = :custId)
    AND T2.CALC_RULE_CD = 'CM_TOTALCHRGE'
ORDER BY T1.END_DT ASC
```

### Example Daily Data Output:
| START_DT   | END_DT     | DAILY_CHARGES | QUANTITY |
|------------|------------|---------------|----------|
| 2025-08-01 | 2025-08-01 | 50.25         | 5.2      |
| 2025-08-02 | 2025-08-02 | 48.30         | 4.8      |
| 2025-08-03 | 2025-08-03 | 52.10         | 5.5      |
| ... (one row per day) ...          |
| 2025-08-31 | 2025-08-31 | 49.80         | 5.0      |

---

## Step 2: Aggregate Daily Data to Monthly Totals

**Function:** `aggregateMonthlyBilling()` in `telegram-bot.service.js`

### Aggregation Logic:

```javascript
aggregateMonthlyBilling(dailyData) {
  const monthlyMap = new Map();

  dailyData.forEach((record) => {
    // Group by START_DT month (NOT END_DT!)
    const startDate = new Date(record.START_DT);
    const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        MONTH: monthKey,                    // e.g., "2025-08"
        YEAR: startDate.getFullYear(),      // e.g., 2025
        MONTH_NAME: startDate.toLocaleString('en-US', { month: 'long' }), // "August"
        TOTAL_CHARGES: 0,
        TOTAL_CONSUMPTION: 0,
        BILLING_DAYS: 0
      });
    }

    const monthData = monthlyMap.get(monthKey);

    // Sum up charges, consumption, and count days
    monthData.TOTAL_CHARGES += parseFloat(record.DAILY_CHARGES || 0);
    monthData.TOTAL_CONSUMPTION += parseFloat(record.QUANTITY || 0);
    monthData.BILLING_DAYS += 1;
  });

  return Array.from(monthlyMap.values()).sort((a, b) => a.MONTH.localeCompare(b.MONTH));
}
```

### Example Monthly Output:
| MONTH_NAME | YEAR | TOTAL_CHARGES | TOTAL_CONSUMPTION | BILLING_DAYS |
|------------|------|---------------|-------------------|--------------|
| August     | 2025 | 1,550.50      | 155.0             | 31           |
| September  | 2025 | 1,480.25      | 148.5             | 30           |
| October    | 2025 | 1,620.75      | 162.3             | 31           |

---

## 🔴 Potential Issues / Mismatches

### Issue 1: Grouping by START_DT Instead of END_DT
**Problem:** The code groups by `START_DT` month, which might not match the billing cycle.

**Example:**
- If a billing period is: `START_DT = 2025-08-25` to `END_DT = 2025-09-05`
- Current code puts this in **August** (based on START_DT)
- But it might belong to **September** billing cycle (based on END_DT)

**Fix:** Consider changing line 647 to use `END_DT` instead:
```javascript
const startDate = new Date(record.END_DT); // Use END_DT instead of START_DT
```

### Issue 2: Daily vs. Monthly Records
**Problem:** The query returns **daily records**, but some billing systems might have:
- One record per month (not per day)
- Multiple records for the same day

**Check:** Verify the actual structure of your billing data by running:
```sql
SELECT
    TO_CHAR(START_DT, 'YYYY-MM') AS MONTH,
    COUNT(*) AS RECORDS_PER_MONTH,
    SUM(DAILY_CHARGES) AS MONTHLY_TOTAL
FROM (
    -- Your customer_billing_details.sql query here
)
GROUP BY TO_CHAR(START_DT, 'YYYY-MM')
ORDER BY MONTH;
```

### Issue 3: Missing Data for Some Months
**Problem:** If there's no billing data for a month, that month won't appear in the history.

**Expected:** Monthly billing should show all months, even if zero consumption.

---

## 🔍 How to Debug Mismatches

### 1. Check Raw Daily Data
Send this test message to yourself to see the raw data:

```javascript
// Add this temporarily in fetchCustomerData after line 256:
console.log('=== RAW BILLING DATA ===');
console.log('Total records:', billingData.length);
console.log('First 5 records:', JSON.stringify(billingData.slice(0, 5), null, 2));
```

### 2. Verify Monthly Aggregation
Add logging in aggregateMonthlyBilling:

```javascript
// After line 665:
console.log(`Month ${monthKey}: ${monthData.BILLING_DAYS} days, ৳${monthData.TOTAL_CHARGES}`);
```

### 3. Compare with Database
Run this query directly in Oracle:

```sql
SELECT
    TO_CHAR(T1.START_DT, 'YYYY-MM') AS MONTH,
    TO_CHAR(T1.START_DT, 'Month YYYY') AS MONTH_NAME,
    COUNT(*) AS BILLING_DAYS,
    SUM(T2.AUDIT_CALC_AMT) AS TOTAL_CHARGES,
    SUM(T13.end_msrmt - T13.start_msrmt) AS TOTAL_CONSUMPTION
FROM ci_bseg T1
-- ... (same joins as customer_billing_details.sql)
WHERE -- ... (same conditions)
GROUP BY TO_CHAR(T1.START_DT, 'YYYY-MM'), TO_CHAR(T1.START_DT, 'Month YYYY')
ORDER BY TO_CHAR(T1.START_DT, 'YYYY-MM');
```

---

## 💡 Recommendation: Use END_DT for Grouping

To match standard billing cycles, I recommend changing the aggregation to use `END_DT`:

**File:** `backend/src/services/telegram-bot.service.js`

**Change line 647 from:**
```javascript
const startDate = new Date(record.START_DT);
```

**To:**
```javascript
const startDate = new Date(record.END_DT); // Use END_DT to match billing cycle
```

This will group billing records by the month they were **billed** (END_DT) rather than when they **started** (START_DT).

---

## Summary

| Aspect | Current Implementation |
|--------|------------------------|
| **Data Source** | Oracle database (customer_billing_details.sql) |
| **Granularity** | Daily records |
| **Grouping** | By START_DT month |
| **Aggregation** | Sum of DAILY_CHARGES and QUANTITY |
| **Sorting** | Chronological (oldest to newest) |

The mismatch likely comes from **grouping by START_DT instead of END_DT**. Change to END_DT to align with billing cycles.
