-- CRP-CPC Details - OPTIMIZED (Properly Deduplicated)
-- Get all CPC (meters) under a specific CRP with customer information
-- Parameters: :crpId (required)

WITH CPC_LIST AS (
    -- Get unique CPC customers for this CRP
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO,
        cpc_cust.d1_sp_id
    FROM d1_sp_char cpc_cust
    JOIN d1_sp_char cpr_ref ON cpr_ref.d1_sp_id = cpc_cust.d1_sp_id
        AND cpr_ref.char_type_cd = 'CM_CPRLA'
        AND cpr_ref.adhoc_char_val = :crpId
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
),
METER_INFO AS (
    -- Get meter numbers (one per CPC)
    SELECT
        cpc.d1_sp_id,
        MAX(mtr.id_value) AS METER_NO
    FROM CPC_LIST cpc
    LEFT JOIN d1_install_evt evt ON evt.d1_sp_id = cpc.d1_sp_id
        AND evt.d1_removal_dttm IS NULL
    LEFT JOIN d1_dvc_cfg cfg ON cfg.device_config_id = evt.device_config_id
    LEFT JOIN d1_dvc_identifier mtr ON mtr.d1_device_id = cfg.d1_device_id
        AND mtr.dvc_id_type_flg = 'D1SN'
        AND LENGTH(mtr.id_value) = 8
    GROUP BY cpc.d1_sp_id
),
SP_INFO AS (
    -- Get service point info (one per CPC customer)
    SELECT
        cpc.CPC_CUSTOMER_NO,
        MIN(sp.sp_id) AS sp_id  -- Take first SP only
    FROM CPC_LIST cpc
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc.CPC_CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    GROUP BY cpc.CPC_CUSTOMER_NO
),
SA_INFO AS (
    -- Get service agreement info (one per SP)
    SELECT
        sp.sp_id,
        MIN(sa.sa_id) AS sa_id  -- Take first active SA only
    FROM SP_INFO sp
    JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    GROUP BY sp.sp_id
),
BILLING_INFO AS (
    -- Get latest billing info
    SELECT
        sa.sa_id,
        MAX(bs.end_dt) AS LAST_BILL_DATE,
        MAX(CASE WHEN bs.end_dt >= TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) AS BILLED_THIS_MONTH
    FROM ci_bseg bs
    JOIN SA_INFO sa ON sa.sa_id = bs.sa_id
    WHERE bs.bseg_stat_flg <> '60'
    GROUP BY sa.sa_id
)
SELECT
    cpc.CPC_CUSTOMER_NO AS CPC_SA_ID,
    cpc.CPC_CUSTOMER_NO AS CPC_CUSTOMER_NO,
    COALESCE(m.METER_NO, 'N/A') AS METER_NO,
    COALESCE(TO_CHAR(sp_info.sp_id), 'N/A') AS SERVICE_POINT_ID,
    COALESCE(per_name.entity_name, cpc.CPC_CUSTOMER_NO) AS CUSTOMER_NAME,
    COALESCE(prem.address1 || ', ' || prem.address2 || ', ' || prem.address3, 'N/A') AS ADDRESS,
    COALESCE(nocs.descr, 'N/A') AS NOCS_NAME,
    COALESCE(contact.contact_value, 'N/A') AS PHONE_NO,
    'N/A' AS FEEDER,
    'N/A' AS FEEDER_DESCRIPTION,
    COALESCE(sa.sa_status_flg, 'N/A') AS SA_STATUS,
    CASE
        WHEN sa.sa_status_flg = '20' THEN 'Active'
        WHEN sa.sa_status_flg = '30' THEN 'Pending Start'
        WHEN sa.sa_status_flg = '40' THEN 'Pending Stop'
        WHEN sa.sa_status_flg = '50' THEN 'Stopped'
        ELSE 'Unknown'
    END AS SA_STATUS_DESC,
    COALESCE(TO_CHAR(sa.start_dt, 'DD-MON-YYYY'), 'N/A') AS START_DATE,
    CASE
        WHEN bill.BILLED_THIS_MONTH = 1 THEN 'Yes'
        ELSE 'No'
    END AS BILLED_THIS_MONTH,
    COALESCE(TO_CHAR(bill.LAST_BILL_DATE, 'DD-MON-YYYY'), 'N/A') AS LAST_BILL_DATE,
    COALESCE(bal.PAYOFF_BAL, 0) AS CURRENT_BALANCE
FROM CPC_LIST cpc
LEFT JOIN METER_INFO m ON m.d1_sp_id = cpc.d1_sp_id
LEFT JOIN SP_INFO sp_info ON sp_info.CPC_CUSTOMER_NO = cpc.CPC_CUSTOMER_NO
LEFT JOIN SA_INFO sa_info ON sa_info.sp_id = sp_info.sp_id
LEFT JOIN ci_sa sa ON sa.sa_id = sa_info.sa_id
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
LEFT JOIN BILLING_INFO bill ON bill.sa_id = sa.sa_id
LEFT JOIN (
    SELECT sa_id, SUM(tot_amt) AS PAYOFF_BAL
    FROM ci_ft
    WHERE freeze_sw = 'Y'
    GROUP BY sa_id
) bal ON bal.sa_id = sa.sa_id
ORDER BY
    CASE WHEN sp_info.sp_id IS NOT NULL THEN 0 ELSE 1 END,  -- Show complete records first
    m.METER_NO NULLS LAST,
    cpc.CPC_CUSTOMER_NO
