-- CRP-CPC List OPTIMIZED - Faster version with better performance
-- Parameters: :search (optional), :limit, :offset

WITH DISTINCT_CRP AS (
    SELECT /*+ INDEX(cpr_ref) */ DISTINCT
        cpr_ref.adhoc_char_val AS CPR_CUSTOMER_ID
    FROM d1_sp_char cpr_ref
    WHERE cpr_ref.char_type_cd = 'CM_CPRLA'
        AND (:search IS NULL OR UPPER(cpr_ref.adhoc_char_val) LIKE UPPER('%' || :search || '%'))
    ORDER BY cpr_ref.adhoc_char_val
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
),
CPC_COUNT AS (
    -- Get CPC counts first without billing status (fast)
    SELECT
        cpr_ref.adhoc_char_val AS CPR_CUSTOMER_ID,
        COUNT(DISTINCT cpc_cust.adhoc_char_val) AS TOTAL_CPC_COUNT
    FROM DISTINCT_CRP crp
    JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
        AND cpr_ref.char_type_cd = 'CM_CPRLA'
    JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
        AND cpc_cust.char_type_cd = 'CM_LEGCY'
    GROUP BY cpr_ref.adhoc_char_val
),
LATEST_BILLING AS (
    -- Pre-filter billing segments for current month only
    SELECT /*+ INDEX(bs) */
        bs.sa_id,
        MAX(bs.end_dt) as end_dt
    FROM ci_bseg bs
    WHERE bs.bseg_stat_flg <> '60'
        AND bs.end_dt >= ADD_MONTHS(TRUNC(SYSDATE, 'YEAR'), -12) -- Only last 12 months
    GROUP BY bs.sa_id
),
BILLED_CPC AS (
    -- Count only billed CPCs (more efficient than CASE in main query)
    SELECT
        cpr_ref.adhoc_char_val AS CPR_CUSTOMER_ID,
        COUNT(DISTINCT cpc_cust.adhoc_char_val) AS BILLED_THIS_MONTH
    FROM DISTINCT_CRP crp
    JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
        AND cpr_ref.char_type_cd = 'CM_CPRLA'
    JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
        AND cpc_cust.char_type_cd = 'CM_LEGCY'
    JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc_cust.adhoc_char_val
        AND sp_char.char_type_cd = 'CM_LEGCY'
    JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    JOIN LATEST_BILLING lb ON lb.sa_id = sa.sa_id
        AND lb.end_dt >= TRUNC(SYSDATE, 'MM') -- Billed this month
    GROUP BY cpr_ref.adhoc_char_val
)
SELECT
    crp.CPR_CUSTOMER_ID AS CRP_ID,
    crp.CPR_CUSTOMER_ID AS CRP_ACCOUNT_NO,
    COALESCE(cnt.TOTAL_CPC_COUNT, 0) AS TOTAL_CPC_COUNT,
    COALESCE(billed.BILLED_THIS_MONTH, 0) AS BILLED_THIS_MONTH,
    COALESCE(cnt.TOTAL_CPC_COUNT, 0) - COALESCE(billed.BILLED_THIS_MONTH, 0) AS NOT_BILLED_THIS_MONTH
FROM DISTINCT_CRP crp
LEFT JOIN CPC_COUNT cnt ON cnt.CPR_CUSTOMER_ID = crp.CPR_CUSTOMER_ID
LEFT JOIN BILLED_CPC billed ON billed.CPR_CUSTOMER_ID = crp.CPR_CUSTOMER_ID
ORDER BY crp.CPR_CUSTOMER_ID
