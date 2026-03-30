-- CRP-CPC Bill Stop Analysis - FULL DATA (For Batch Job)
-- No limits - fetches ALL CPC customers with bill stop issues
-- Designed to run as background batch job (may take 10-30 minutes)

WITH CPC_WITH_CRP AS (
    -- Get ALL CPC customers with their CRP
    SELECT
        cpc_char.sp_id,
        cpc_char.adhoc_char_val AS CPC_CUSTOMER_NO,
        crp_char.adhoc_char_val AS CRP_ACCOUNT_NO
    FROM ci_sp_char cpc_char
    JOIN ci_sp_char crp_char
        ON crp_char.sp_id = cpc_char.sp_id
        AND crp_char.char_type_cd = 'CM_CPRLA'
    WHERE cpc_char.char_type_cd = 'CM_LEGCY'
        AND cpc_char.adhoc_char_val IS NOT NULL
        AND crp_char.adhoc_char_val IS NOT NULL
),
METER_INFO AS (
    -- Get AMI meter numbers via d1 (smart meter) tables
    SELECT
        cpc.CPC_CUSTOMER_NO,
        MAX(mtr.id_value) AS METER_NO
    FROM CPC_WITH_CRP cpc
    JOIN d1_sp_char d1_sp ON d1_sp.adhoc_char_val = cpc.CPC_CUSTOMER_NO
        AND d1_sp.char_type_cd = 'CM_LEGCY'
    LEFT JOIN d1_install_evt evt ON evt.d1_sp_id = d1_sp.d1_sp_id
        AND evt.d1_removal_dttm IS NULL
    LEFT JOIN d1_dvc_cfg cfg ON cfg.device_config_id = evt.device_config_id
    LEFT JOIN d1_dvc_identifier mtr ON mtr.d1_device_id = cfg.d1_device_id
        AND mtr.dvc_id_type_flg = 'D1SN'
        AND LENGTH(mtr.id_value) = 8
    GROUP BY cpc.CPC_CUSTOMER_NO
),
SA_WITH_BILLING AS (
    -- Get service agreements with billing status
    SELECT
        cpc.CPC_CUSTOMER_NO,
        cpc.CRP_ACCOUNT_NO,
        cpc.sp_id,
        MIN(sa.sa_id) AS sa_id,
        MIN(sa.sa_status_flg) AS sa_status_flg,
        MAX(bs.end_dt) AS LAST_BILL_DATE,
        MAX(CASE WHEN bs.end_dt > TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) AS BILLED_THIS_MONTH
    FROM CPC_WITH_CRP cpc
    LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = cpc.sp_id
    LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_bseg bs ON bs.sa_id = sa.sa_id AND bs.bseg_stat_flg = '50'  -- Only frozen bills
    GROUP BY cpc.CPC_CUSTOMER_NO, cpc.CRP_ACCOUNT_NO, cpc.sp_id
),
ALL_CUSTOMERS AS (
    -- Get ALL customers (both bill stop and active billing)
    SELECT *
    FROM SA_WITH_BILLING
    -- NO FILTER - Show all customers
)
SELECT
    bs.CRP_ACCOUNT_NO,
    bs.CPC_CUSTOMER_NO,
    COALESCE(mi.METER_NO, 'N/A') AS METER_NO,
    COALESCE(per_name.entity_name, bs.CPC_CUSTOMER_NO) AS CUSTOMER_NAME,
    COALESCE(prem.address1 || ', ' || prem.address2, 'N/A') AS ADDRESS,
    COALESCE(nocs.descr, 'N/A') AS NOCS_NAME,
    COALESCE(contact.contact_value, 'N/A') AS PHONE_NO,
    CASE
        WHEN bs.sa_status_flg = '20' THEN 'Active'
        WHEN bs.sa_status_flg = '30' THEN 'Pending Start'
        WHEN bs.sa_status_flg = '40' THEN 'Pending Stop'
        WHEN bs.sa_status_flg = '50' THEN 'Stopped'
        ELSE 'Unknown'
    END AS SA_STATUS_DESC,
    bs.LAST_BILL_DATE,
    CASE
        WHEN bs.BILLED_THIS_MONTH = 1 THEN 'Active Billing'
        ELSE 'Bill Stop Issue'
    END AS BILLING_STATUS,
    COALESCE(bal.PAYOFF_BAL, 0) AS CURRENT_BALANCE
FROM ALL_CUSTOMERS bs
LEFT JOIN METER_INFO mi ON mi.CPC_CUSTOMER_NO = bs.CPC_CUSTOMER_NO
LEFT JOIN ci_sa sa ON sa.sa_id = bs.sa_id
LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
LEFT JOIN ci_acct_per acc_per ON acc_per.acct_id = acc.acct_id AND acc_per.main_cust_sw = 'Y'
LEFT JOIN ci_per_name per_name ON per_name.per_id = acc_per.per_id
LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
LEFT JOIN ci_prem_char prem_char ON prem_char.prem_id = prem.prem_id
    AND prem_char.char_type_cd = 'CM_NOCS'
LEFT JOIN ci_char_val_l nocs ON nocs.char_val = prem_char.char_val
    AND nocs.char_type_cd = 'CM_NOCS'
LEFT JOIN c1_per_contdet contact ON contact.per_id = acc_per.per_id
    AND contact.comm_rte_type_cd = 'CELLPHONE'
    AND contact.cnd_primary_flg = 'C1YS'
LEFT JOIN (
    SELECT sa_id, SUM(tot_amt) AS PAYOFF_BAL
    FROM ci_ft
    WHERE freeze_sw = 'Y'
    GROUP BY sa_id
) bal ON bal.sa_id = sa.sa_id
ORDER BY bs.CRP_ACCOUNT_NO, bs.LAST_BILL_DATE NULLS FIRST
