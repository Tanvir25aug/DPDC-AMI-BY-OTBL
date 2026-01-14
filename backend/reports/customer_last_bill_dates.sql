-- Customer Last Bill Dates Report
-- Purpose: Get all customers with their last bill date to analyze billing status
-- Used by: Bill Stop Analysis feature
-- Database: Oracle CC&B

SELECT
    s3.srch_char_val AS customer_id,
    MAX(b.end_dt) AS last_bill_date
FROM ci_bseg b
JOIN ci_sa s1 ON b.sa_id = s1.sa_id
JOIN ci_sa_sp s2 ON s1.sa_id = s2.sa_id
JOIN ci_sp_char s3 ON s2.sp_id = s3.sp_id
WHERE s3.char_type_cd = 'CM_LEGCY'
  AND b.bseg_stat_flg = '50'
GROUP BY s3.srch_char_val
ORDER BY s3.srch_char_val;
