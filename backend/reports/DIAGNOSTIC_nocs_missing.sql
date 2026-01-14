-- DIAGNOSTIC: Find where NOCS lookup is failing
-- This will help identify why customers show as "Unknown/No NOCS"

WITH CPC_SAMPLE AS (
    -- Get sample of CPC customers
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO
    FROM d1_sp_char cpc_cust
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
        AND ROWNUM <= 100  -- Sample first 100
),
DIAGNOSTIC_CHAIN AS (
    SELECT
        cpc.CPC_CUSTOMER_NO,
        -- Check each join step
        CASE WHEN sp_char.sp_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_SP_CHAR,
        CASE WHEN sp.sp_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_SP,
        CASE WHEN sa_sp.sa_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_SA_SP,
        CASE WHEN sa.sa_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_SA_PPD,
        CASE WHEN acc.acct_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_ACCOUNT,
        CASE WHEN prem.prem_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_PREMISE,
        CASE WHEN nocs.char_val IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_NOCS_CHAR,
        CASE WHEN nocs_desc.descr IS NOT NULL THEN 'YES' ELSE 'NO' END AS HAS_NOCS_DESC,
        nocs.char_val AS NOCS_CODE,
        nocs_desc.descr AS NOCS_NAME
    FROM CPC_SAMPLE cpc
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
    'STEP ANALYSIS' AS ANALYSIS_TYPE,
    HAS_SP_CHAR,
    HAS_SP,
    HAS_SA_SP,
    HAS_SA_PPD,
    HAS_ACCOUNT,
    HAS_PREMISE,
    HAS_NOCS_CHAR,
    HAS_NOCS_DESC,
    COUNT(*) AS COUNT
FROM DIAGNOSTIC_CHAIN
GROUP BY HAS_SP_CHAR, HAS_SP, HAS_SA_SP, HAS_SA_PPD, HAS_ACCOUNT, HAS_PREMISE, HAS_NOCS_CHAR, HAS_NOCS_DESC
ORDER BY COUNT DESC
