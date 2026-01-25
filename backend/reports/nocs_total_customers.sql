-- Total Customer Count
-- Returns total count of active AMI customers with meters installed

SELECT
    COUNT(DISTINCT h.id_value) AS TOTAL_CUSTOMERS
FROM d1_install_evt f
INNER JOIN d1_dvc_cfg g ON f.device_config_id = g.device_config_id
INNER JOIN d1_dvc_identifier h ON g.d1_device_id = h.d1_device_id
INNER JOIN CISADM.D1_SP_CHAR e ON e.d1_sp_id = f.d1_sp_id
INNER JOIN d1_Sp_identifier s1 ON e.d1_sp_id = s1.d1_sp_id
INNER JOIN CI_PREM_CHAR p ON S1.ID_VALUE = p.PREM_ID
WHERE h.dvc_id_type_flg = 'D1SN'
  AND s1.SP_ID_TYPE_FLG = 'D1EP'
  AND p.char_type_cd = 'CM_NOCS'
  AND e.char_type_cd = 'CM_LEGCY'
  AND f.d1_removal_dttm IS NULL
