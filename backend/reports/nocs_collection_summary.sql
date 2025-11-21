-- NOCS-wise collection summary with payment breakdown
-- Parameters: :startDate, :endDate
-- Returns: Summary of collections grouped by NOCS area
-- Optimization: Uses PARALLEL hints and proper joins

SELECT /*+ PARALLEL(4) */
    vl.descr AS NOCS_NAME,
    COUNT(DISTINCT p.pay_event_id) AS TOTAL_PAYMENTS,
    COUNT(DISTINCT p.acct_id) AS UNIQUE_CUSTOMERS,
    SUM(p.pay_amt) AS TOTAL_COLLECTION,
    ROUND(AVG(p.pay_amt), 2) AS AVG_PAYMENT_AMOUNT,
    MAX(p.pay_amt) AS MAX_PAYMENT,
    MIN(p.pay_amt) AS MIN_PAYMENT,
    COUNT(DISTINCT pt.tender_type_cd) AS PAYMENT_METHODS_USED,
    SUM(CASE WHEN pt.tender_type_cd LIKE 'BANK%' THEN pt.tender_amt ELSE 0 END) AS BANK_COLLECTION,
    SUM(CASE WHEN pt.tender_type_cd = 'CASH' THEN pt.tender_amt ELSE 0 END) AS CASH_COLLECTION,
    TO_CHAR(MIN(pe.cre_dttm), 'DD-MON-YYYY HH24:MI') AS FIRST_PAYMENT,
    TO_CHAR(MAX(pe.cre_dttm), 'DD-MON-YYYY HH24:MI') AS LAST_PAYMENT
FROM ci_pay p
INNER JOIN ci_pay_event pe ON p.pay_event_id = pe.pay_event_id
    AND pe.cre_dttm >= TO_DATE(:startDate, 'DD-MON-YYYY')
    AND pe.cre_dttm < TO_DATE(:endDate, 'DD-MON-YYYY') + 1
INNER JOIN ci_pay_tender pt ON p.pay_event_id = pt.pay_event_id
INNER JOIN ci_acct a ON p.acct_id = a.acct_id
INNER JOIN ci_prem_char pc ON pc.prem_id = a.mailing_prem_id
    AND pc.char_type_cd = 'CM_NOCS'
INNER JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
WHERE p.pay_status_flg = '50'
GROUP BY vl.descr
ORDER BY TOTAL_COLLECTION DESC
