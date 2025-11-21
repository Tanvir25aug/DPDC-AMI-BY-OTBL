-- Auto Connect/Disconnect Eligible Meters Status
-- Lists all MD-enabled prepaid meters with their current status and payoff balance
-- Does not filter by RC/DC activity - shows all eligible meters

SELECT
    a.acct_id,
    b.sa_id,
    SUM(j.TOT_AMT) PAYOFF_BALANCE,
    i.id_value MSN,
    f.srch_char_val OLD_CONSUMER_ID,
    g.bo_status_cd METER_STATUS,
    h.DEVICE_CONFIG_TYPE_CD phase
FROM ci_acct a
INNER JOIN ci_acct_char k ON k.acct_id = a.acct_id
    AND k.char_type_cd = 'CM_MTDIS'
    AND k.CHAR_VAL = 'Y'
INNER JOIN ci_sa b ON a.acct_id = b.acct_id
    AND sa_type_cd = 'PPD'
    AND sa_status_flg = '20'
INNER JOIN ci_sa_sp c ON c.sa_id = b.sa_id
INNER JOIN ci_ft j ON j.sa_id = b.sa_id
INNER JOIN ci_sp d ON d.sp_id = c.sp_id
INNER JOIN ci_sp_char e ON e.sp_id = d.sp_id
    AND e.char_type_cd = 'CM_LEGCY'
INNER JOIN d1_sp_char f ON f.srch_char_val = e.srch_char_val
    AND f.char_type_cd = 'CM_LEGCY'
INNER JOIN d1_install_evt g ON g.d1_sp_id = f.d1_sp_id
    AND g.d1_removal_dttm IS NULL
INNER JOIN d1_dvc_cfg h ON h.DEVICE_CONFIG_ID = g.DEVICE_CONFIG_ID
INNER JOIN d1_dvc_identifier i ON i.D1_DEVICE_ID = h.D1_DEVICE_ID
GROUP BY
    i.id_value,
    f.srch_char_val,
    g.bo_status_cd,
    h.DEVICE_CONFIG_TYPE_CD,
    a.acct_id,
    b.sa_id
ORDER BY g.bo_status_cd DESC
