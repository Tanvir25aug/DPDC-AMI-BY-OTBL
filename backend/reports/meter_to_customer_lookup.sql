-- Meter to Customer ID Lookup
-- Quick lookup to find customer ID from meter number
-- Parameter: :meterNumber

SELECT DISTINCT
    spc.adhoc_char_val AS CUSTOMER_ID
FROM d1_dvc_identifier dvc
INNER JOIN d1_dvc_cfg dc ON dc.d1_device_id = dvc.d1_device_id
INNER JOIN d1_measr_comp mc ON mc.device_config_id = dc.device_config_id
INNER JOIN d1_usage_period_sq ups ON ups.measr_comp_id = mc.measr_comp_id
INNER JOIN d1_usage du ON du.d1_usage_id = ups.d1_usage_id
INNER JOIN c1_usage cu ON cu.usage_id = du.usg_ext_id
INNER JOIN ci_bseg bseg ON bseg.bseg_id = cu.bseg_id
INNER JOIN ci_sa sa ON sa.sa_id = bseg.sa_id AND sa.sa_type_cd = 'PPD'
INNER JOIN ci_sa_sp sasp ON sasp.sa_id = sa.sa_id
INNER JOIN ci_sp_char spc ON spc.sp_id = sasp.sp_id AND spc.char_type_cd = 'CM_LEGCY'
WHERE dvc.dvc_id_type_flg = 'D1SN'
    AND dvc.id_value = :meterNumber
    AND ROWNUM = 1
