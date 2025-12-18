-- Meter to Customer ID and Name Lookup (Installation-Based)
-- Quick lookup to find customer ID and name from meter number
-- Uses current meter installation records for more accurate results
-- Parameter: :meterNumber

SELECT
    sp_char.adhoc_char_val AS CUSTOMER_ID,
    per_name.entity_name AS CUSTOMER_NAME
FROM
    d1_dvc_identifier dvc
INNER JOIN d1_dvc_cfg cfg
    ON dvc.d1_device_id = cfg.d1_device_id
INNER JOIN d1_install_evt evt
    ON cfg.device_config_id = evt.device_config_id
    AND evt.d1_removal_dttm IS NULL
INNER JOIN d1_sp_char sp_char
    ON evt.d1_sp_id = sp_char.d1_sp_id
    AND sp_char.char_type_cd = 'CM_LEGCY'
INNER JOIN d1_sp sp
    ON sp.d1_sp_id = sp_char.d1_sp_id
INNER JOIN d1_sp_identifier sp_id
    ON sp_id.d1_sp_id = sp.d1_sp_id
    AND sp_id.sp_id_type_flg = 'D1EI'
INNER JOIN ci_sp ci_sp
    ON ci_sp.sp_id = sp_id.id_value
INNER JOIN ci_sa_sp sasp
    ON sasp.sp_id = ci_sp.sp_id
INNER JOIN ci_sa sa
    ON sa.sa_id = sasp.sa_id
    AND sa.sa_type_cd = 'PPD'
INNER JOIN ci_acct_per acct_per
    ON acct_per.acct_id = sa.acct_id
    AND acct_per.main_cust_sw = 'Y'
INNER JOIN ci_per_name per_name
    ON per_name.per_id = acct_per.per_id
    AND per_name.prim_name_sw = 'Y'
WHERE
    dvc.id_value = :meterNumber
    AND dvc.dvc_id_type_flg = 'D1SN'
    AND ROWNUM = 1
