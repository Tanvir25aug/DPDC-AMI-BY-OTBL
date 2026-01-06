-- Get total count of customers for a NOCS (for pagination)
-- Parameter: :nocs_code (required)
-- Returns: TOTAL_COUNT

SELECT COUNT(*) AS TOTAL_COUNT
FROM ci_prem_char prem_nocs
INNER JOIN ci_prem prem ON prem.prem_id = prem_nocs.prem_id
INNER JOIN ci_acct acc ON acc.mailing_prem_id = prem.prem_id
INNER JOIN ci_sa sa ON sa.acct_id = acc.acct_id
    AND sa.sa_status_flg = '20'
    AND sa.sa_type_cd = 'PPD'
WHERE prem_nocs.char_type_cd = 'CM_NOCS'
    AND TRIM(prem_nocs.char_val) = TRIM(:nocs_code)
