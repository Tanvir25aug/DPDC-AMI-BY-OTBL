-- CRP-CPC NOCS Summary - FAST VERSION
-- Get count of CPC customers grouped by NOCS for a specific CRP
-- Parameters: :crpId (required)

WITH CPC_LIST AS (
    -- Get all unique CPC customers for this CRP
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO
    FROM d1_sp_char cpc_cust
    JOIN d1_sp_char cpr_ref ON cpr_ref.d1_sp_id = cpc_cust.d1_sp_id
        AND cpr_ref.char_type_cd = 'CM_CPRLA'
        AND cpr_ref.adhoc_char_val = :crpId
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
),
CPC_NOCS AS (
    -- Get NOCS for each CPC customer (one per customer)
    SELECT
        cpc.CPC_CUSTOMER_NO,
        MIN(nocs.char_val) AS NOCS_CODE,
        MIN(nocs_desc.descr) AS NOCS_NAME
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
    GROUP BY cpc.CPC_CUSTOMER_NO
)
SELECT
    COALESCE(NOCS_NAME, 'Unknown/No NOCS') AS NOCS_NAME,
    COALESCE(NOCS_CODE, 'N/A') AS NOCS_CODE,
    COUNT(*) AS CPC_COUNT,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS PERCENTAGE
FROM CPC_NOCS
GROUP BY NOCS_NAME, NOCS_CODE
ORDER BY CPC_COUNT DESC, NOCS_NAME
