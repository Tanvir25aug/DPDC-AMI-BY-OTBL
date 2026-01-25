-- Bank-Wise Collection Summary with NOCS Breakdown
-- Shows collection grouped by NOCS and Bank with Principal, VAT (5%), and Total
-- Parameters: :start_date, :end_date (YYYY-MM-DD format)

WITH unique_transactions AS (
    -- Get unique payment transactions with NOCS and Bank (avoid duplicates from multiple JOINs)
    SELECT DISTINCT
        t1.pay_event_id,
        t1.tender_amt,
        t2.pay_dt,
        t4.descr AS Bank_name,
        p.CHAR_VAL AS NOCS_CODE,
        l.descr AS NOCS_NAME
    FROM CI_PAY_TNDR T1
    INNER JOIN CI_PAY_EVENT T2 ON T1.PAY_EVENT_ID = T2.PAY_EVENT_ID
    INNER JOIN CI_TNDR_CTL t3 ON t1.tndr_ctl_id = t3.tndr_ctl_id
    INNER JOIN CI_TNDR_SRCE_L t4 ON t3.tndr_source_cd = t4.tndr_source_cd
    INNER JOIN cisadm.ci_acct a ON A.ACCT_ID = t1.payor_acct_id
    INNER JOIN cisadm.ci_sa b ON a.acct_id = b.acct_id
    INNER JOIN cisadm.ci_sa_sp c ON b.sa_id = c.sa_id
    INNER JOIN cisadm.ci_Sp_char d ON c.sp_id = d.sp_id
    INNER JOIN CISADM.D1_SP_CHAR e ON e.adhoc_Char_val = D.adhoc_Char_val
    INNER JOIN d1_install_evt f ON e.d1_sp_id = f.d1_sp_id
    INNER JOIN d1_dvc_cfg g ON f.device_config_id = g.device_config_id
    INNER JOIN d1_dvc_identifier h ON g.d1_device_id = h.d1_device_id
    INNER JOIN d1_Sp_identifier s1 ON e.d1_sp_id = s1.d1_sp_id
    INNER JOIN CI_PREM_CHAR p ON S1.ID_VALUE = p.PREM_ID
    INNER JOIN ci_char_val_l l ON p.char_val = l.char_val
    WHERE T2.ilm_dt BETWEEN TO_DATE(:start_date, 'YYYY-MM-DD')
                        AND TO_DATE(:end_date, 'YYYY-MM-DD')
      AND b.sa_type_cd = 'PPD'
      AND d.char_type_cd = 'CM_LEGCY'
      AND e.char_type_cd = 'CM_LEGCY'
      AND h.dvc_id_type_flg = 'D1SN'
      AND s1.SP_ID_TYPE_FLG = 'D1EP'
      AND p.char_type_cd = 'CM_NOCS'
)
SELECT
    NOCS_CODE,
    NOCS_NAME,
    Bank_name AS BANK_NAME,
    ROUND(SUM(tender_amt), 2) AS PRINCIPAL_AMOUNT,
    ROUND(SUM(tender_amt) * 0.05, 2) AS VAT_AMOUNT,
    ROUND(SUM(tender_amt) * 1.05, 2) AS TOTAL_AMOUNT,
    COUNT(DISTINCT pay_event_id) AS TRANSACTION_COUNT,
    TO_CHAR(MIN(pay_dt), 'DD-MON-YYYY') AS FIRST_PAYMENT_DATE,
    TO_CHAR(MAX(pay_dt), 'DD-MON-YYYY') AS LAST_PAYMENT_DATE
FROM unique_transactions
GROUP BY NOCS_CODE, NOCS_NAME, Bank_name
ORDER BY SUM(tender_amt) DESC
