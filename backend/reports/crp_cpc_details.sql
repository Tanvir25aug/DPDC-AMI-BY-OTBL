-- CRP-CPC Details - With Last Bill Date and Current Balance
-- Get all CPC (meters) under a specific CRP with customer information
-- Parameters: :crpId (required)

SELECT
    cpc_cust.adhoc_char_val AS CPC_SA_ID,
    cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO,
    COALESCE(mtr.id_value, 'N/A') AS METER_NO,
    COALESCE(sp.sp_id, 'N/A') AS SERVICE_POINT_ID,
    COALESCE(per_name.entity_name, cpc_cust.adhoc_char_val) AS CUSTOMER_NAME,
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
        WHEN MAX(bs.bseg_id) IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS BILLED_THIS_MONTH,
    COALESCE(TO_CHAR(MAX(bs.end_dt), 'DD-MON-YYYY'), 'N/A') AS LAST_BILL_DATE,
    COALESCE(MAX(bal.PAYOFF_BAL), 0) AS CURRENT_BALANCE
FROM d1_sp_char cpc_cust
JOIN d1_sp_char cpr_ref ON cpr_ref.d1_sp_id = cpc_cust.d1_sp_id
    AND cpr_ref.char_type_cd = 'CM_CPRLA'
    AND cpr_ref.adhoc_char_val = :crpId
LEFT JOIN d1_install_evt evt ON evt.d1_sp_id = cpc_cust.d1_sp_id
    AND evt.d1_removal_dttm IS NULL
LEFT JOIN d1_dvc_cfg cfg ON cfg.device_config_id = evt.device_config_id
LEFT JOIN d1_dvc_identifier mtr ON mtr.d1_device_id = cfg.d1_device_id
    AND mtr.dvc_id_type_flg = 'D1SN'
    AND LENGTH(mtr.id_value) = 8
LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc_cust.adhoc_char_val
    AND sp_char.char_type_cd = 'CM_LEGCY'
LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
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
LEFT JOIN ci_bseg bs ON bs.sa_id = sa.sa_id
    AND bs.bseg_stat_flg <> '60'
LEFT JOIN (
    SELECT sa_id, SUM(tot_amt) AS PAYOFF_BAL
    FROM ci_ft
    WHERE freeze_sw = 'Y'
    GROUP BY sa_id
) bal ON bal.sa_id = sa.sa_id
WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
GROUP BY
    cpc_cust.adhoc_char_val,
    mtr.id_value,
    sp.sp_id,
    per_name.entity_name,
    prem.address1,
    prem.address2,
    prem.address3,
    nocs.descr,
    contact.contact_value,
    sa.sa_status_flg,
    sa.start_dt
ORDER BY METER_NO
