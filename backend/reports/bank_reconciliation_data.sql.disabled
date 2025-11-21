-- Detailed payment transactions for bank reconciliation
-- Parameters: :startDate, :endDate, :bankCode (optional - pass NULL for all banks)
-- Returns: Detailed payment transaction list with bank references
-- Optimization: Uses PARALLEL hints and indexed columns in WHERE clause

SELECT /*+ PARALLEL(4) */
    pe.pay_event_id AS PAYMENT_ID,
    TO_CHAR(pe.cre_dttm, 'DD-MON-YYYY HH24:MI:SS') AS PAYMENT_DATETIME,
    p.acct_id AS CUSTOMER_ACCOUNT,
    p.pay_amt AS PAYMENT_AMOUNT,
    p.pay_status_flg AS PAYMENT_STATUS,
    pt.tender_type_cd AS BANK_CODE,
    ttl.descr AS BANK_NAME,
    pt.tender_amt AS TENDER_AMOUNT,
    pt.tender_ctl_id AS BANK_REFERENCE,
    pe.pay_location_cd AS PAYMENT_LOCATION,
    pe.cre_user_id AS COLLECTED_BY,
    CASE
        WHEN p.pay_status_flg = '50' THEN 'Posted'
        WHEN p.pay_status_flg = '60' THEN 'Cancelled'
        WHEN p.pay_status_flg = '70' THEN 'Error'
        ELSE 'Other'
    END AS STATUS_DESCRIPTION
FROM ci_pay p
INNER JOIN ci_pay_event pe ON p.pay_event_id = pe.pay_event_id
    AND pe.cre_dttm >= TO_DATE(:startDate, 'DD-MON-YYYY')
    AND pe.cre_dttm < TO_DATE(:endDate, 'DD-MON-YYYY') + 1
INNER JOIN ci_pay_tender pt ON p.pay_event_id = pt.pay_event_id
INNER JOIN ci_tndr_type_l ttl ON pt.tender_type_cd = ttl.tender_type_cd
WHERE p.pay_status_flg = '50'
    AND (:bankCode IS NULL OR pt.tender_type_cd = :bankCode)
ORDER BY pe.cre_dttm DESC, pe.pay_event_id
