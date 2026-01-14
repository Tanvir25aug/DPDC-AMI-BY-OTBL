# Oracle Partition Update - January 2026

## Summary
All backend report SQL queries have been updated to use the current month partition **p2026JAN** for optimal query performance on the `d1_activity` table.

## Update Details
- **Date Updated**: January 13, 2026
- **Current Partition**: p2026JAN (January 2026)
- **Previous Partition**: p2025DEC (found in 1 file)
- **Total Files Updated**: 1 file
- **Total Files Verified**: 11 files with partition references

## Why Partitions Matter
Oracle database tables like `d1_activity` use monthly partitions to improve query performance:
- **Partition Pruning**: Queries only scan the current month's data instead of all historical data
- **Faster Execution**: Reduces query time from minutes to seconds
- **Resource Efficiency**: Uses less memory and CPU

## Files Updated

### Updated from p2025DEC to p2026JAN:
1. ✅ `dc_in_progress_detailed.sql` - Line 46

### Already Using p2026JAN (Verified):
1. ✅ `auto_connect_disconnect_details.sql` - Line 42
2. ✅ `meter_wise_commands.sql` - Line 11
3. ✅ `meter_wise_commands_by_nocs.sql` - Line 27
4. ✅ `meter_wise_commands_count.sql` - Line 6
5. ✅ `meter_wise_commands_paginated.sql` - Line 38
6. ✅ `rc_dc_analytics_summary.sql` - Line 33
7. ✅ `rc_dc_nocs_aggregated.sql` - Line 32
8. ✅ `rc_in_progress_by_nocs.sql` - Line 30
9. ✅ `rc_in_progress_detailed.sql` - Line 46
10. ✅ `rc_in_progress_summary.sql` - Line 42

## Query Pattern
All queries use the partition clause in the d1_activity table join:
```sql
INNER JOIN d1_activity PARTITION(p2026JAN) l ON l.D1_ACTIVITY_ID = k.D1_ACTIVITY_ID
```

## Files Without Partitions
The remaining 41 SQL files in the reports directory don't query the `d1_activity` table, so they don't need partition references.

## Monthly Maintenance Required
⚠️ **IMPORTANT**: These partition references must be updated at the beginning of each month:

| Month | Partition Name | Update Date |
|-------|---------------|-------------|
| January 2026 | p2026JAN | ✅ Updated |
| February 2026 | p2026FEB | February 1, 2026 |
| March 2026 | p2026MAR | March 1, 2026 |
| April 2026 | p2026APR | April 1, 2026 |
| And so on... | | |

## How to Update for Next Month

### Step 1: Identify Files
Run this command to find all files with partitions:
```bash
cd "D:\DPDC AMI By OTBL\backend\reports"
grep -il "partition(p2026" *.sql
```

### Step 2: Update Partition Names
Replace the partition name in all identified files. For example, for February 2026:
```sql
-- OLD (January)
INNER JOIN d1_activity PARTITION(p2026JAN) l ON...

-- NEW (February)
INNER JOIN d1_activity PARTITION(p2026FEB) l ON...
```

### Step 3: Verify Updates
Run this command to verify all partitions are updated:
```bash
cd "D:\DPDC AMI By OTBL\backend\reports"
grep -i "partition(p2026" *.sql | grep -v "p2026FEB"
```
(Should return nothing if all files are updated to p2026FEB)

### Step 4: Test Queries
After updating, test a few queries to ensure they return data correctly:
- Test `meter_wise_commands.sql`
- Test `rc_in_progress_detailed.sql`
- Test `dc_in_progress_detailed.sql`

## Automation Recommendation
Consider implementing one of these solutions to avoid manual monthly updates:

### Option 1: Dynamic Partition in Node.js
Modify the reports service to dynamically inject the current month partition:
```javascript
const currentPartition = `p${new Date().getFullYear()}${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}`;
const query = sqlTemplate.replace('{{PARTITION}}', currentPartition);
```

### Option 2: Database View
Create an Oracle view that automatically uses the current partition:
```sql
CREATE OR REPLACE VIEW d1_activity_current AS
SELECT * FROM d1_activity PARTITION(p2026JAN);
-- Update view monthly or use dynamic SQL
```

### Option 3: Scheduled Task
Create a monthly scheduled task to automatically update partition references on the 1st of each month.

## Impact Analysis
✅ **Performance**: All queries will continue to perform optimally
✅ **Data Accuracy**: All queries will fetch current month's data correctly
✅ **System Stability**: No downtime or restart required
✅ **Backward Compatibility**: Queries work seamlessly with updated partitions

## Testing Recommendations
After partition updates, verify:
1. ✅ All meter-wise commands queries return today's data
2. ✅ RC/DC in-progress reports show active commands
3. ✅ NOCS aggregation reports match expected counts
4. ✅ No query errors in application logs
5. ✅ Query execution times remain under 5 seconds

## Contact
For questions about partition updates, contact the database administrator or review Oracle partition management documentation.

---
**Last Updated**: January 13, 2026
**Next Update Due**: February 1, 2026 (Update to p2026FEB)
