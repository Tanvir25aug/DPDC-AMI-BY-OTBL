-- Bank-wise collection summary with payment method breakdown
-- Parameters: :startDate, :endDate
-- Returns: Summary of collections grouped by bank/payment tender type
-- Optimization: Uses PARALLEL hints and proper date range filtering

SELECT /*+ PARALLEL(4) */
    pt.tender_type_cd AS BANK_CODE,
    ttl.descr AS BANK_NAME,
    pt.tender_ctl_id AS TENDER_ID,
    COUNT(DISTINCT p.pay_event_id) AS TRANSACTION_COUNT,
    SUM(pt.tender_amt) AS TOTAL_COLLECTION,
    AVG(pt.tender_amt) AS AVG_TRANSACTION_AMOUNT,
    MIN(pt.tender_amt) AS MIN_AMOUNT,
    MAX(pt.tender_amt) AS MAX_AMOUNT,
    TO_CHAR(MIN(pe.cre_dttm), 'DD-MON-YYYY HH24:MI:SS') AS FIRST_PAYMENT_TIME,
    TO_CHAR(MAX(pe.cre_dttm), 'DD-MON-YYYY HH24:MI:SS') AS LAST_PAYMENT_TIME
FROM ci_pay p
INNER JOIN ci_pay_event pe ON p.pay_event_id = pe.pay_event_id
    AND pe.cre_dttm >= TO_DATE(:startDate, 'DD-MON-YYYY')
    AND pe.cre_dttm < TO_DATE(:endDate, 'DD-MON-YYYY') + 1
INNER JOIN ci_pay_tender pt ON p.pay_event_id = pt.pay_event_id
INNER JOIN ci_tndr_type_l ttl ON pt.tender_type_cd = ttl.tender_type_cd
WHERE p.pay_status_flg = '50'
GROUP BY pt.tender_type_cd, ttl.descr, pt.tender_ctl_id
ORDER BY TOTAL_COLLECTION DESC
