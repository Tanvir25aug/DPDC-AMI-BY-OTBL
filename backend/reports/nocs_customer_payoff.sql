-- Get Customer Wise Payoff Balance by NOCS (OPTIMIZED)
-- Parameter: :nocs_code (required)
-- Orders by payoff balance (highest to lowest)

SELECT /*+ PARALLEL(4) */
    sp_char.ADHOC_CHAR_VAL AS CUSTOMER_ID,
    sp_char.ADHOC_CHAR_VAL AS CUSTOMER_NAME,
    (prem.ADDRESS1 || ', ' || prem.ADDRESS2 || ', ' || prem.ADDRESS3 || ', ' || prem.ADDRESS4) AS ADDRESS,
    CASE sa.sa_type_cd
        WHEN 'PPD' THEN 'Prepaid'
        WHEN 'RES' THEN 'Residential'
        WHEN 'COM' THEN 'Commercial'
        WHEN 'IND' THEN 'Industrial'
        WHEN 'GOV' THEN 'Government'
        ELSE sa.sa_type_cd
    END AS CUSTOMER_TYPE,
    COALESCE(SUM(ft.TOT_AMT), 0) AS PAYOFF_BALANCE
FROM ci_prem_char prem_nocs
-- Start from NOCS to filter early
INNER JOIN ci_prem prem ON prem.prem_id = prem_nocs.prem_id
INNER JOIN ci_acct acc ON acc.mailing_prem_id = prem.prem_id
INNER JOIN ci_sa sa ON sa.acct_id = acc.acct_id
    AND sa.sa_status_flg = '20'
    AND sa.sa_type_cd = 'PPD'
INNER JOIN ci_sa_sp sa_sp ON sa_sp.sa_id = sa.sa_id
INNER JOIN ci_sp sp ON sp.sp_id = sa_sp.sp_id
INNER JOIN ci_sp_char sp_char ON sp_char.sp_id = sp.sp_id
    AND sp_char.char_type_cd = 'CM_LEGCY'
LEFT JOIN ci_ft ft ON ft.sa_id = sa.sa_id
    AND ft.FREEZE_SW = 'Y'
WHERE prem_nocs.char_type_cd = 'CM_NOCS'
    AND TRIM(prem_nocs.char_val) = TRIM(:nocs_code)
GROUP BY
    sp_char.ADHOC_CHAR_VAL,
    prem.ADDRESS1,
    prem.ADDRESS2,
    prem.ADDRESS3,
    prem.ADDRESS4,
    sa.sa_type_cd
ORDER BY PAYOFF_BALANCE DESC
