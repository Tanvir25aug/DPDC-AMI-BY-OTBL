-- NOCS-Wise CRP and CPC Summary - FAST VERSION
-- Shows total CRP customers and total CPC customers grouped by NOCS
-- No parameters required - shows global summary

WITH CRP_LIST AS (
    -- Get all unique CRP customers
    SELECT DISTINCT
        cpr_ref.adhoc_char_val AS CRP_CUSTOMER_NO,
        cpc_cust.d1_sp_id
    FROM d1_sp_char cpr_ref
    JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
        AND cpc_cust.char_type_cd = 'CM_LEGCY'
    WHERE cpr_ref.char_type_cd = 'CM_CPRLA'
),
CRP_NOCS AS (
    -- Get NOCS for each CRP (one per CRP)
    SELECT DISTINCT
        crp.CRP_CUSTOMER_NO,
        nocs.char_val AS NOCS_CODE,
        nocs_desc.descr AS NOCS_NAME
    FROM CRP_LIST crp
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = crp.CRP_CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id
        AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
    LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
    LEFT JOIN ci_prem_char nocs ON nocs.prem_id = prem.prem_id
        AND nocs.char_type_cd = 'CM_NOCS'
    LEFT JOIN ci_char_val_l nocs_desc ON nocs_desc.char_val = nocs.char_val
        AND nocs_desc.char_type_cd = 'CM_NOCS'
),
CPC_LIST AS (
    -- Get all unique CPC customers
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO
    FROM d1_sp_char cpc_cust
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
),
CPC_NOCS AS (
    -- Get NOCS for each CPC (one per CPC)
    SELECT DISTINCT
        cpc.CPC_CUSTOMER_NO,
        nocs.char_val AS NOCS_CODE,
        nocs_desc.descr AS NOCS_NAME
    FROM CPC_LIST cpc
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc.CPC_CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id
        AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
    LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
    LEFT JOIN ci_prem_char nocs ON nocs.prem_id = prem.prem_id
        AND nocs.char_type_cd = 'CM_NOCS'
    LEFT JOIN ci_char_val_l nocs_desc ON nocs_desc.char_val = nocs.char_val
        AND nocs_desc.char_type_cd = 'CM_NOCS'
)
SELECT
    COALESCE(NOCS_NAME, 'Unknown/No NOCS') AS NOCS_NAME,
    COALESCE(NOCS_CODE, 'N/A') AS NOCS_CODE,
    COUNT(DISTINCT CRP_CUSTOMER_NO) AS TOTAL_CRP_COUNT,
    COUNT(DISTINCT CPC_CUSTOMER_NO) AS TOTAL_CPC_COUNT,
    ROUND(COUNT(DISTINCT CPC_CUSTOMER_NO) * 1.0 / NULLIF(COUNT(DISTINCT CRP_CUSTOMER_NO), 0), 2) AS AVG_CPC_PER_CRP
FROM (
    SELECT NOCS_CODE, NOCS_NAME, CRP_CUSTOMER_NO, NULL AS CPC_CUSTOMER_NO
    FROM CRP_NOCS
    UNION ALL
    SELECT NOCS_CODE, NOCS_NAME, NULL AS CRP_CUSTOMER_NO, CPC_CUSTOMER_NO
    FROM CPC_NOCS
)
GROUP BY NOCS_NAME, NOCS_CODE
ORDER BY TOTAL_CPC_COUNT DESC, NOCS_NAME
