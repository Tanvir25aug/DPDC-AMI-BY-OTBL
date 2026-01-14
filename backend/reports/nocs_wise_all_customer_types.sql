-- NOCS-Wise Summary: CRP, CPC, and Regular Customers
-- Shows count of all customer types grouped by NOCS
-- CRP = Parent customers
-- CPC = Child customers under CRP
-- Regular = Standalone customers (not in CRP/CPC structure)

WITH CRP_CUSTOMERS AS (
    -- Get all unique CRP customers
    SELECT DISTINCT
        cpr_ref.adhoc_char_val AS CUSTOMER_NO,
        cpr_ref.d1_sp_id
    FROM d1_sp_char cpr_ref
    WHERE cpr_ref.char_type_cd = 'CM_CPRLA'
),
CPC_CUSTOMERS AS (
    -- Get all CPC customers (those under CRP)
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CUSTOMER_NO,
        cpc_cust.d1_sp_id
    FROM d1_sp_char cpc_cust
    JOIN d1_sp_char cpr_ref ON cpr_ref.d1_sp_id = cpc_cust.d1_sp_id
        AND cpr_ref.char_type_cd = 'CM_CPRLA'
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
),
REGULAR_CUSTOMERS AS (
    -- Get Regular customers (service points NOT in CRP/CPC structure)
    SELECT DISTINCT
        sp_char.adhoc_char_val AS CUSTOMER_NO,
        sp.sp_id AS ci_sp_id
    FROM ci_sp_char sp_char
    JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    WHERE sp_char.char_type_cd = 'CM_LEGCY'
        -- Exclude CPC customers (those that are under CRP)
        AND NOT EXISTS (
            SELECT 1
            FROM d1_sp_char cpc
            JOIN d1_sp_char cpr ON cpr.d1_sp_id = cpc.d1_sp_id
                AND cpr.char_type_cd = 'CM_CPRLA'
            WHERE cpc.adhoc_char_val = sp_char.adhoc_char_val
                AND cpc.char_type_cd = 'CM_LEGCY'
        )
        -- Exclude standalone CRP customers
        AND NOT EXISTS (
            SELECT 1
            FROM d1_sp_char crp
            WHERE crp.adhoc_char_val = sp_char.adhoc_char_val
                AND crp.char_type_cd = 'CM_CPRLA'
        )
),
-- Get NOCS for CRP customers
CRP_WITH_NOCS AS (
    SELECT
        crp.CUSTOMER_NO,
        'CRP' AS CUSTOMER_TYPE,
        COALESCE(d1_nocs.adhoc_char_val, prem_nocs.char_val) AS NOCS_CODE
    FROM CRP_CUSTOMERS crp
    -- Try Path 1: D1 tables
    LEFT JOIN d1_sp_char d1_nocs ON d1_nocs.d1_sp_id = crp.d1_sp_id
        AND d1_nocs.char_type_cd = 'CM_NOCS'
    -- Try Path 2: CI tables
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = crp.CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
    LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
    LEFT JOIN ci_prem_char prem_nocs ON prem_nocs.prem_id = prem.prem_id
        AND prem_nocs.char_type_cd = 'CM_NOCS'
),
-- Get NOCS for CPC customers
CPC_WITH_NOCS AS (
    SELECT
        cpc.CUSTOMER_NO,
        'CPC' AS CUSTOMER_TYPE,
        COALESCE(d1_nocs.adhoc_char_val, prem_nocs.char_val) AS NOCS_CODE
    FROM CPC_CUSTOMERS cpc
    -- Try Path 1: D1 tables
    LEFT JOIN d1_sp_char d1_nocs ON d1_nocs.d1_sp_id = cpc.d1_sp_id
        AND d1_nocs.char_type_cd = 'CM_NOCS'
    -- Try Path 2: CI tables
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc.CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
    LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
    LEFT JOIN ci_prem_char prem_nocs ON prem_nocs.prem_id = prem.prem_id
        AND prem_nocs.char_type_cd = 'CM_NOCS'
),
-- Get NOCS for Regular customers
REGULAR_WITH_NOCS AS (
    SELECT
        reg.CUSTOMER_NO,
        'REGULAR' AS CUSTOMER_TYPE,
        COALESCE(ci_sp_nocs.char_val, prem_nocs.char_val) AS NOCS_CODE
    FROM REGULAR_CUSTOMERS reg
    LEFT JOIN ci_sp sp ON sp.sp_id = reg.ci_sp_id
    -- Try getting NOCS from service point characteristics
    LEFT JOIN ci_sp_char ci_sp_nocs ON ci_sp_nocs.sp_id = sp.sp_id
        AND ci_sp_nocs.char_type_cd = 'CM_NOCS'
    -- Try getting NOCS from premise
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
    LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
    LEFT JOIN ci_prem_char prem_nocs ON prem_nocs.prem_id = prem.prem_id
        AND prem_nocs.char_type_cd = 'CM_NOCS'
),
-- Combine all customer types
ALL_CUSTOMERS AS (
    SELECT * FROM CRP_WITH_NOCS
    UNION ALL
    SELECT * FROM CPC_WITH_NOCS
    UNION ALL
    SELECT * FROM REGULAR_WITH_NOCS
)
SELECT
    COALESCE(nocs_desc.descr, 'Unknown/No NOCS') AS NOCS_NAME,
    COALESCE(all_cust.NOCS_CODE, 'N/A') AS NOCS_CODE,
    COUNT(DISTINCT CASE WHEN CUSTOMER_TYPE = 'CRP' THEN CUSTOMER_NO END) AS CRP_COUNT,
    COUNT(DISTINCT CASE WHEN CUSTOMER_TYPE = 'CPC' THEN CUSTOMER_NO END) AS CPC_COUNT,
    COUNT(DISTINCT CASE WHEN CUSTOMER_TYPE = 'REGULAR' THEN CUSTOMER_NO END) AS REGULAR_COUNT,
    COUNT(DISTINCT CUSTOMER_NO) AS TOTAL_CUSTOMERS
FROM ALL_CUSTOMERS all_cust
LEFT JOIN ci_char_val_l nocs_desc ON nocs_desc.char_val = all_cust.NOCS_CODE
    AND nocs_desc.char_type_cd = 'CM_NOCS'
GROUP BY nocs_desc.descr, all_cust.NOCS_CODE
ORDER BY TOTAL_CUSTOMERS DESC, NOCS_NAME
