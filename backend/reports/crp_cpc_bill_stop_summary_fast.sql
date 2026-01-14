-- CRP-CPC Bill Stop Summary - FAST VERSION
-- Optimized for performance
-- Shows CRPs with bill stop issues

WITH CRP_CPC_BILLING AS (
    SELECT /*+ PARALLEL(4) */
        crp_char.adhoc_char_val AS CRP_ACCOUNT_NO,
        cpc_char.adhoc_char_val AS CPC_CUSTOMER_NO,
        MAX(CASE WHEN bs.end_dt >= TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) AS BILLED_THIS_MONTH
    FROM ci_sp_char cpc_char
    JOIN ci_sp_char crp_char
        ON crp_char.sp_id = cpc_char.sp_id
        AND crp_char.char_type_cd = 'CM_CPRLA'
    JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = cpc_char.sp_id
    JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_bseg bs ON bs.sa_id = sa.sa_id AND bs.bseg_stat_flg <> '60'
    WHERE cpc_char.char_type_cd = 'CM_LEGCY'
        AND cpc_char.adhoc_char_val IS NOT NULL
        AND crp_char.adhoc_char_val IS NOT NULL
    GROUP BY crp_char.adhoc_char_val, cpc_char.adhoc_char_val
)
SELECT
    CRP_ACCOUNT_NO,
    CRP_ACCOUNT_NO AS CRP_ID,
    COUNT(*) AS TOTAL_CPC_COUNT,
    SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) AS BILL_STOP_COUNT,
    SUM(CASE WHEN BILLED_THIS_MONTH = 1 THEN 1 ELSE 0 END) AS ACTIVE_BILLING_COUNT,
    ROUND(SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS BILL_STOP_PERCENTAGE
FROM CRP_CPC_BILLING
GROUP BY CRP_ACCOUNT_NO
HAVING SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) > 0  -- Only CRPs with bill stop issues
ORDER BY BILL_STOP_COUNT DESC
FETCH FIRST 1000 ROWS ONLY  -- Limit to top 1000 CRPs
