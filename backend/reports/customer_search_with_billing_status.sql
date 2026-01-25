-- Customer Search with Billing Status
-- Search customer by Customer ID or Meter Number
-- Returns customer information and billing status (Active/Bill Stop)
-- Parameters: :search_value (Customer ID or Meter Number)

WITH CUSTOMER_BASE AS (
    -- Find customer by Customer ID (CM_LEGCY) or Meter Number
    SELECT DISTINCT
        sp_char.adhoc_char_val AS CUSTOMER_ID,
        sp_char.sp_id,
        'CUSTOMER_ID' AS MATCH_TYPE
    FROM ci_sp_char sp_char
    WHERE sp_char.char_type_cd = 'CM_LEGCY'
      AND UPPER(sp_char.adhoc_char_val) = UPPER(:search_value)

    UNION

    -- Search by Meter Number
    SELECT DISTINCT
        sp_char.adhoc_char_val AS CUSTOMER_ID,
        sp_char.sp_id,
        'METER_NO' AS MATCH_TYPE
    FROM d1_dvc_identifier mtr
    JOIN d1_dvc_cfg cfg ON cfg.d1_device_id = mtr.d1_device_id
    JOIN d1_install_evt evt ON evt.device_config_id = cfg.device_config_id
        AND evt.d1_removal_dttm IS NULL
    JOIN d1_sp_char d1_sp ON d1_sp.d1_sp_id = evt.d1_sp_id
        AND d1_sp.char_type_cd = 'CM_LEGCY'
    JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = d1_sp.adhoc_char_val
        AND sp_char.char_type_cd = 'CM_LEGCY'
    WHERE mtr.dvc_id_type_flg = 'D1SN'
      AND UPPER(mtr.id_value) = UPPER(:search_value)
),
SA_INFO AS (
    -- Get service agreement info
    SELECT
        cb.CUSTOMER_ID,
        cb.sp_id,
        cb.MATCH_TYPE,
        sa.sa_id,
        sa.sa_status_flg,
        sa.acct_id
    FROM CUSTOMER_BASE cb
    JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = cb.sp_id
    JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
),
METER_INFO AS (
    -- Get meter number from device
    SELECT
        d1_sp.adhoc_char_val AS CUSTOMER_ID,
        MAX(mtr.id_value) AS METER_NO
    FROM CUSTOMER_BASE cb
    JOIN ci_sp_char sp_char ON sp_char.sp_id = cb.sp_id
        AND sp_char.char_type_cd = 'CM_LEGCY'
    JOIN d1_sp_char d1_sp ON d1_sp.adhoc_char_val = sp_char.adhoc_char_val
        AND d1_sp.char_type_cd = 'CM_LEGCY'
    JOIN d1_install_evt evt ON evt.d1_sp_id = d1_sp.d1_sp_id
        AND evt.d1_removal_dttm IS NULL
    JOIN d1_dvc_cfg cfg ON cfg.device_config_id = evt.device_config_id
    JOIN d1_dvc_identifier mtr ON mtr.d1_device_id = cfg.d1_device_id
        AND mtr.dvc_id_type_flg = 'D1SN'
        AND LENGTH(mtr.id_value) = 8
    GROUP BY d1_sp.adhoc_char_val
),
BILLING_INFO AS (
    SELECT
        sa.sa_id,
        MAX(bs.end_dt) AS LAST_BILL_DATE,
        MAX(CASE WHEN bs.end_dt > TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) AS BILLED_THIS_MONTH
    FROM ci_bseg bs
    JOIN SA_INFO sa ON sa.sa_id = bs.sa_id
    WHERE bs.bseg_stat_flg = '50'
    GROUP BY sa.sa_id
),
BALANCE_INFO AS (
    -- Get current balance
    SELECT
        sa_id,
        SUM(tot_amt) AS CURRENT_BALANCE
    FROM ci_ft
    WHERE freeze_sw = 'Y'
      AND sa_id IN (SELECT sa_id FROM SA_INFO)
    GROUP BY sa_id
)
SELECT
    sa.CUSTOMER_ID,
    COALESCE(per_name.entity_name, sa.CUSTOMER_ID) AS CUSTOMER_NAME,
    COALESCE(m.METER_NO, 'N/A') AS METER_NO,
    COALESCE(nocs.descr, 'N/A') AS NOCS_NAME,
    COALESCE(prem.address1 || ', ' || prem.address2 || ', ' || prem.address3, 'N/A') AS ADDRESS,
    COALESCE(contact.contact_value, 'N/A') AS PHONE_NO,
    CASE
        WHEN sa.sa_status_flg = '20' THEN 'Active'
        WHEN sa.sa_status_flg = '30' THEN 'Pending Start'
        WHEN sa.sa_status_flg = '40' THEN 'Pending Stop'
        WHEN sa.sa_status_flg = '50' THEN 'Stopped'
        ELSE 'Unknown'
    END AS SA_STATUS,
    COALESCE(TO_CHAR(bill.LAST_BILL_DATE, 'DD-MON-YYYY'), 'Never Billed') AS LAST_BILL_DATE,
    bill.LAST_BILL_DATE AS LAST_BILL_DATE_RAW,
    CASE
        WHEN bill.BILLED_THIS_MONTH = 1 THEN 'Active Billing'
        WHEN bill.BILLED_THIS_MONTH = 0 THEN 'Bill Stop Issue'
        WHEN bill.BILLED_THIS_MONTH IS NULL THEN 'Never Billed'
        ELSE 'Unknown'
    END AS BILLING_STATUS,
    COALESCE(bill.BILLED_THIS_MONTH, 0) AS BILLED_THIS_MONTH,
    COALESCE(bal.CURRENT_BALANCE, 0) AS CURRENT_BALANCE,
    TO_CHAR(TRUNC(SYSDATE, 'MM'), 'MON-YYYY') AS CURRENT_BILLING_MONTH,
    sa.MATCH_TYPE
FROM SA_INFO sa
LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
LEFT JOIN ci_acct_per acc_per ON acc_per.acct_id = acc.acct_id
    AND acc_per.main_cust_sw = 'Y'
LEFT JOIN ci_per per ON per.per_id = acc_per.per_id
LEFT JOIN ci_per_name per_name ON per_name.per_id = per.per_id
LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
LEFT JOIN ci_prem_char prem_char ON prem_char.prem_id = prem.prem_id
    AND prem_char.char_type_cd = 'CM_NOCS'
LEFT JOIN ci_char_val_l nocs ON nocs.char_val = prem_char.char_val
    AND nocs.char_type_cd = 'CM_NOCS'
LEFT JOIN c1_per_contdet contact ON contact.per_id = per.per_id
    AND contact.comm_rte_type_cd = 'CELLPHONE'
    AND contact.cnd_primary_flg = 'C1YS'
LEFT JOIN METER_INFO m ON m.CUSTOMER_ID = sa.CUSTOMER_ID
LEFT JOIN BILLING_INFO bill ON bill.sa_id = sa.sa_id
LEFT JOIN BALANCE_INFO bal ON bal.sa_id = sa.sa_id
WHERE ROWNUM = 1
