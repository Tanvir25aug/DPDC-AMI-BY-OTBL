# Monthly Billing Solution - Based on Your Query

## Problem Summary
Your Telegram bot is showing **mismatched monthly billing totals** because it:
1. Fetches **daily billing data** from Oracle
2. Aggregates it to **monthly totals** in JavaScript (line 643-667 in telegram-bot.service.js)
3. Groups by `START_DT` month instead of `END_DT` month

## Solution Options

### Option 1: Use Direct Monthly Query (RECOMMENDED)
Get monthly totals **directly from Oracle** instead of aggregating in JavaScript.

**File Created:** `backend/reports/customer_monthly_billing.sql`

**Features:**
- ✅ Groups by `END_DT` (billing month)
- ✅ Aggregates in Oracle (faster)
- ✅ Returns monthly totals directly
- ✅ Includes customer info (MSN, Mobile)

**Sample Output:**
| MONTH_KEY | MONTH_NAME | YEAR | BILLING_DAYS | TOTAL_CHARGES | TOTAL_CONSUMPTION |
|-----------|------------|------|--------------|---------------|-------------------|
| 2025-08   | August     | 2025 | 31           | 1,550.50      | 155.0            |
| 2025-09   | September  | 2025 | 30           | 1,480.25      | 148.5            |
| 2025-10   | October    | 2025 | 31           | 1,620.75      | 162.3            |

---

### Option 2: Fix Current Aggregation (Quick Fix)
Change JavaScript aggregation to use `END_DT` instead of `START_DT`.

**File:** `backend/src/services/telegram-bot.service.js`

**Change Line 647:**
```javascript
// FROM:
const startDate = new Date(record.START_DT);

// TO:
const startDate = new Date(record.END_DT);
```

This will make the bot group by billing month (END_DT) instead of period start (START_DT).

---

## Compare Methods

I created a comparison query: `backend/reports/COMPARE_MONTHLY_BILLING.sql`

Run this to see the difference between grouping by START_DT vs END_DT:

```sql
-- Replace :custId with actual customer ID
SELECT * FROM COMPARE_MONTHLY_BILLING WHERE custId = '13110518';
```

**Example Output:**
```
METHOD              MONTH_KEY  TOTAL_CHARGES  TOTAL_CONSUMPTION
------------------  ---------  -------------  -----------------
METHOD 1 (START_DT) 2025-08    1,550.50       155.0
METHOD 2 (END_DT)   2025-08    1,480.25       148.5
                             ↑ Different! ↑
```

---

## Implementation Steps

### Step 1: Test the Queries

**Test Daily Billing (Current):**
```sql
-- Run customer_billing_details.sql
SELECT * FROM customer_billing_details WHERE custId = '13110518';
-- Count daily records
SELECT COUNT(*) FROM customer_billing_details WHERE custId = '13110518';
```

**Test Monthly Billing (New):**
```sql
-- Run customer_monthly_billing.sql
SELECT * FROM customer_monthly_billing WHERE custId = '13110518';
-- Should return 1 row per month
```

**Compare Results:**
```sql
-- Run COMPARE_MONTHLY_BILLING.sql
SELECT * FROM COMPARE_MONTHLY_BILLING WHERE custId = '13110518';
-- Shows both methods side by side
```

### Step 2: Update Telegram Bot (Choose One)

#### Option A: Use New Monthly Query (Recommended)

**1. Update `telegram-bot.service.js` (line 256-260):**
```javascript
// FROM:
const [billingData, rechargeHistory] = await Promise.all([
  reportsService.executeReport('customer_billing_details', {
    custId,
    startDate: null,
    endDate: null
  }, { maxRows: 0 }),
  reportsService.executeReport('customer_recharge_history', { saId }, { maxRows: 0 })
]);

// TO:
const [monthlyBilling, rechargeHistory] = await Promise.all([
  reportsService.executeReport('customer_monthly_billing', {
    custId,
    startDate: null,
    endDate: null
  }, { maxRows: 0 }),
  reportsService.executeReport('customer_recharge_history', { saId }, { maxRows: 0 })
]);
```

**2. Remove aggregation (line 252):**
```javascript
// FROM:
const monthlyBilling = this.aggregateMonthlyBilling(billingData || []);

// TO:
// Remove this line - monthlyBilling already comes from SQL query
```

**3. Update return statement (line 259-265):**
```javascript
// FROM:
return {
  customer,
  dailyBilling: billingData || [],
  monthlyBilling: monthlyBilling || [],
  rechargeHistory: rechargeHistory || [],
  analytics
};

// TO:
return {
  customer,
  dailyBilling: [], // No daily data needed anymore
  monthlyBilling: monthlyBilling || [],
  rechargeHistory: rechargeHistory || [],
  analytics
};
```

#### Option B: Quick Fix (Just change START_DT to END_DT)

**Update line 647 in `telegram-bot.service.js`:**
```javascript
const startDate = new Date(record.END_DT); // Changed from START_DT
```

---

## Benefits of Each Approach

### Option A (Use Monthly Query):
✅ **Faster** - Oracle does aggregation (faster than JavaScript)
✅ **Less data transfer** - 12 monthly rows vs. 365 daily rows
✅ **More accurate** - Groups by END_DT (billing month)
✅ **Cleaner code** - No JavaScript aggregation needed

❌ Requires more code changes
❌ Lose daily billing details (unless you keep both queries)

### Option B (Fix Aggregation):
✅ **Quick fix** - One line change
✅ **Keep daily data** - Still have access to daily records

❌ Slower - JavaScript aggregation on 365 records
❌ More data transfer from Oracle

---

## Recommended Approach

**For Production: Use Option A (Monthly Query)**

1. Add the new query file: `customer_monthly_billing.sql`
2. Update Telegram bot to use it
3. Remove JavaScript aggregation logic
4. Test thoroughly before deploying

**For Quick Fix: Use Option B**

1. Change line 647 from `START_DT` to `END_DT`
2. Test and deploy
3. Plan to move to Option A later

---

## Testing After Changes

### Test Script:
```javascript
// Send to bot: Customer ID or Meter Number
// Click "📊 Billing History"
// Select "📅 Last 1 Year"

// Compare output with direct Oracle query:
SELECT
    MONTH_NAME,
    BILLING_DAYS,
    TOTAL_CHARGES,
    TOTAL_CONSUMPTION
FROM customer_monthly_billing
WHERE custId = '13110518'
ORDER BY MONTH_KEY DESC
FETCH FIRST 12 ROWS ONLY;
```

### Expected Match:
Bot output should **exactly match** Oracle query results.

---

## Files Created

| File | Purpose |
|------|---------|
| `customer_monthly_billing.sql` | Direct monthly aggregation query |
| `COMPARE_MONTHLY_BILLING.sql` | Compare START_DT vs END_DT grouping |
| `monthly_billing_debug.sql` | Debug daily billing data |
| `MONTHLY_BILLING_EXPLANATION.md` | Full technical documentation |
| `MONTHLY_BILLING_SOLUTION.md` | This file - solution summary |

---

## Need Help?

1. **Test all queries** in Oracle SQL Developer first
2. **Compare outputs** with current bot behavior
3. **Choose option** based on your requirements
4. **Test thoroughly** with multiple customer IDs
5. **Deploy** to production after verification

**Questions to Answer:**
- Do you need daily billing details in the bot? → Use Option B
- Do you only need monthly totals? → Use Option A
- Is speed important? → Use Option A
- Want quick fix? → Use Option B
