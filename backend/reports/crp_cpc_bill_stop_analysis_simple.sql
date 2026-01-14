-- CRP-CPC Bill Stop Analysis - SUPER SIMPLE VERSION
-- Minimal joins for maximum speed
-- Parameters: :maxRows (default 5000)

SELECT /*+ PARALLEL(8) FIRST_ROWS(5000) */
    crp_char.adhoc_char_val AS CRP_ACCOUNT_NO,
    cpc_char.adhoc_char_val AS CPC_CUSTOMER_NO,
    COALESCE(per_name.entity_name, cpc_char.adhoc_char_val) AS CUSTOMER_NAME,
    'N/A' AS METER_NO,
    COALESCE(prem.address1, 'N/A') AS ADDRESS,
    'N/A' AS NOCS_NAME,
    'N/A' AS PHONE_NO,
    'Unknown' AS SA_STATUS_DESC,
    COALESCE(TO_CHAR(MAX(bs.end_dt), 'DD-MON-YYYY'), 'Never Billed') AS LAST_BILL_DATE,
    'Bill Stop Issue' AS BILLING_STATUS,
    0 AS CURRENT_BALANCE
FROM ci_sp_char cpc_char
JOIN ci_sp_char crp_char
    ON crp_char.sp_id = cpc_char.sp_id
    AND crp_char.char_type_cd = 'CM_CPRLA'
JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = cpc_char.sp_id
JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
LEFT JOIN ci_bseg bs ON bs.sa_id = sa.sa_id AND bs.bseg_stat_flg <> '60'
LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
LEFT JOIN ci_acct_per acc_per ON acc_per.acct_id = acc.acct_id AND acc_per.main_cust_sw = 'Y'
LEFT JOIN ci_per_name per_name ON per_name.per_id = acc_per.per_id
LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
WHERE cpc_char.char_type_cd = 'CM_LEGCY'
    AND cpc_char.adhoc_char_val IS NOT NULL
    AND crp_char.adhoc_char_val IS NOT NULL
GROUP BY
    crp_char.adhoc_char_val,
    cpc_char.adhoc_char_val,
    per_name.entity_name,
    prem.address1
HAVING MAX(bs.end_dt) < TRUNC(SYSDATE, 'MM') OR MAX(bs.end_dt) IS NULL
ORDER BY crp_char.adhoc_char_val, MAX(bs.end_dt) NULLS FIRST
FETCH FIRST :maxRows ROWS ONLY
