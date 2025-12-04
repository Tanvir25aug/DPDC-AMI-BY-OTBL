-- CRP-CPC List with Pagination - With Billing Status
-- Get list of CRP customers with their CPC count and billing status for current month
-- Parameters: :search (optional), :limit, :offset

WITH DISTINCT_CRP AS (
    SELECT DISTINCT
        cpr_ref.adhoc_char_val AS CPR_CUSTOMER_ID
    FROM d1_sp_char cpr_ref
    WHERE cpr_ref.char_type_cd = 'CM_CPRLA'
        AND (:search IS NULL OR UPPER(cpr_ref.adhoc_char_val) LIKE UPPER('%' || :search || '%'))
    ORDER BY cpr_ref.adhoc_char_val
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
),
CPC_BILLING_STATUS AS (
    SELECT
        cpr_ref.adhoc_char_val AS CPR_CUSTOMER_ID,
        COUNT(DISTINCT cpc_cust.adhoc_char_val) AS TOTAL_CPC_COUNT,
        COUNT(DISTINCT CASE
            WHEN bs.end_dt >= TRUNC(SYSDATE, 'MM') THEN cpc_cust.adhoc_char_val
        END) AS BILLED_THIS_MONTH,
        COUNT(DISTINCT CASE
            WHEN bs.end_dt IS NULL OR bs.end_dt < TRUNC(SYSDATE, 'MM') THEN cpc_cust.adhoc_char_val
        END) AS NOT_BILLED_THIS_MONTH
    FROM DISTINCT_CRP crp
    JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
        AND cpr_ref.char_type_cd = 'CM_CPRLA'
    JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
        AND cpc_cust.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc_cust.adhoc_char_val
        AND sp_char.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    LEFT JOIN (
        SELECT sa_id, MAX(end_dt) as end_dt
        FROM ci_bseg
        WHERE bseg_stat_flg <> '60'
        GROUP BY sa_id
    ) bs ON bs.sa_id = sa.sa_id
    GROUP BY cpr_ref.adhoc_char_val
)
SELECT
    crp.CPR_CUSTOMER_ID AS CRP_ID,
    crp.CPR_CUSTOMER_ID AS CRP_ACCOUNT_NO,
    COALESCE(cnt.TOTAL_CPC_COUNT, 0) AS TOTAL_CPC_COUNT,
    COALESCE(cnt.BILLED_THIS_MONTH, 0) AS BILLED_THIS_MONTH,
    COALESCE(cnt.NOT_BILLED_THIS_MONTH, 0) AS NOT_BILLED_THIS_MONTH
FROM DISTINCT_CRP crp
LEFT JOIN CPC_BILLING_STATUS cnt ON cnt.CPR_CUSTOMER_ID = crp.CPR_CUSTOMER_ID
ORDER BY crp.CPR_CUSTOMER_ID
