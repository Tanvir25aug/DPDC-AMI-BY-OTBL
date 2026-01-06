-- Get Customer Wise Payoff Balance by NOCS (ULTRA OPTIMIZED - ALL CUSTOMERS)
-- Parameter: :nocs_code (required)
-- Orders by payoff balance (highest to lowest)
-- Performance: Optimized query with proper customer name retrieval, no row limit
-- Returns ALL customers for the specified NOCS

WITH nocs_customers AS (
    -- Start with NOCS filtering for early dataset reduction
    SELECT /*+ INDEX(prem_nocs CI_PREM_CHAR_PK) */
        sp_char.ADHOC_CHAR_VAL AS CUSTOMER_ID,
        sa.sa_id AS SA_ID,
        sa.acct_id AS ACCT_ID,
        TRIM(prem.ADDRESS1 || ' ' || prem.ADDRESS2 || ' ' || prem.ADDRESS3 || ' ' || prem.ADDRESS4) AS ADDRESS,
        CASE sa.sa_type_cd
            WHEN 'PPD' THEN 'Prepaid'
            WHEN 'RES' THEN 'Residential'
            WHEN 'COM' THEN 'Commercial'
            WHEN 'IND' THEN 'Industrial'
            WHEN 'GOV' THEN 'Government'
            ELSE sa.sa_type_cd
        END AS CUSTOMER_TYPE
    FROM ci_prem_char prem_nocs
    INNER JOIN ci_prem prem ON prem.prem_id = prem_nocs.prem_id
    INNER JOIN ci_acct acc ON acc.mailing_prem_id = prem.prem_id
    INNER JOIN ci_sa sa ON sa.acct_id = acc.acct_id
        AND sa.sa_status_flg = '20'
        AND sa.sa_type_cd = 'PPD'
    INNER JOIN ci_sa_sp sa_sp ON sa_sp.sa_id = sa.sa_id
    INNER JOIN ci_sp sp ON sp.sp_id = sa_sp.sp_id
    INNER JOIN ci_sp_char sp_char ON sp_char.sp_id = sp.sp_id
        AND sp_char.char_type_cd = 'CM_LEGCY'
    WHERE prem_nocs.char_type_cd = 'CM_NOCS'
        AND TRIM(prem_nocs.char_val) = TRIM(:nocs_code)
),
-- Pre-aggregate financial transactions for better performance
customer_balances AS (
    SELECT
        nc.CUSTOMER_ID,
        nc.SA_ID,
        nc.ACCT_ID,
        nc.ADDRESS,
        nc.CUSTOMER_TYPE,
        ROUND(COALESCE(SUM(ft.TOT_AMT), 0), 2) AS PAYOFF_BALANCE
    FROM nocs_customers nc
    LEFT JOIN ci_ft ft ON ft.sa_id = nc.SA_ID
        AND ft.FREEZE_SW = 'Y'
    GROUP BY
        nc.CUSTOMER_ID,
        nc.SA_ID,
        nc.ACCT_ID,
        nc.ADDRESS,
        nc.CUSTOMER_TYPE
)
-- Get customer names and final output
SELECT
    cb.CUSTOMER_ID,
    COALESCE(per_name.entity_name, cb.CUSTOMER_ID) AS CUSTOMER_NAME,
    cb.ADDRESS,
    cb.CUSTOMER_TYPE,
    cb.PAYOFF_BALANCE
FROM customer_balances cb
LEFT JOIN ci_acct_per ap ON ap.acct_id = cb.ACCT_ID
    AND ap.main_cust_sw = 'Y'
LEFT JOIN ci_per_name per_name ON per_name.per_id = ap.per_id
    AND per_name.prim_name_sw = 'Y'
ORDER BY cb.PAYOFF_BALANCE DESC
