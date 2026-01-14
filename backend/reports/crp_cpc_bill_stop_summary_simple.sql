-- CRP-CPC Bill Stop Summary - SUPER SIMPLE VERSION
-- Ultra-fast query with minimal complexity
-- Returns top CRPs with bill stop issues

WITH LIMITED_CPC AS (
    SELECT /*+ PARALLEL(8) FIRST_ROWS(10000) */
        cpc_char.sp_id,
        cpc_char.adhoc_char_val AS CPC_CUSTOMER_NO,
        crp_char.adhoc_char_val AS CRP_ACCOUNT_NO
    FROM ci_sp_char cpc_char
    JOIN ci_sp_char crp_char
        ON crp_char.sp_id = cpc_char.sp_id
        AND crp_char.char_type_cd = 'CM_CPRLA'
    WHERE cpc_char.char_type_cd = 'CM_LEGCY'
        AND cpc_char.adhoc_char_val IS NOT NULL
        AND crp_char.adhoc_char_val IS NOT NULL
        AND ROWNUM <= 10000  -- Limit for speed
),
BILLING_STATUS AS (
    SELECT /*+ PARALLEL(8) */
        cpc.CRP_ACCOUNT_NO,
        cpc.CPC_CUSTOMER_NO,
        MAX(CASE WHEN bs.end_dt >= TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) AS BILLED_THIS_MONTH
    FROM LIMITED_CPC cpc
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = cpc.sp_id
    LEFT JOIN ci_bseg bs ON bs.sa_id = sa_sp.sa_id AND bs.bseg_stat_flg <> '60'
    GROUP BY cpc.CRP_ACCOUNT_NO, cpc.CPC_CUSTOMER_NO
)
SELECT
    CRP_ACCOUNT_NO,
    CRP_ACCOUNT_NO AS CRP_ID,
    COUNT(*) AS TOTAL_CPC_COUNT,
    SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) AS BILL_STOP_COUNT,
    SUM(CASE WHEN BILLED_THIS_MONTH = 1 THEN 1 ELSE 0 END) AS ACTIVE_BILLING_COUNT,
    ROUND(SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS BILL_STOP_PERCENTAGE
FROM BILLING_STATUS
GROUP BY CRP_ACCOUNT_NO
HAVING SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) > 0  -- Only CRPs with bill stop issues
ORDER BY BILL_STOP_COUNT DESC
FETCH FIRST 500 ROWS ONLY
