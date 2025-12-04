-- Remote Connect/Disconnect NOCS-wise Aggregated Summary
-- Returns pre-aggregated counts grouped by NOCS, command type, and status
-- Much faster than processing individual rows - shows ALL data without row limits

SELECT
    NVL(vl.descr, 'Unknown NOCS') AS NOCS_NAME,
    l.BUS_OBJ_CD AS COMMAND_TYPE,
    l.BO_STATUS_CD AS COMMAND_STATUS,
    COUNT(DISTINCT l.d1_activity_id) AS COMMAND_COUNT
FROM ci_acct a
INNER JOIN ci_acct_char xy ON a.acct_id = xy.acct_id
    AND xy.char_type_cd = 'CM_MTDIS'
    AND xy.CHAR_VAL = 'Y'
INNER JOIN ci_sa b ON a.acct_id = b.acct_id
    AND b.sa_type_cd = 'PPD'
    AND b.sa_status_flg = '20'
INNER JOIN ci_sa_sp c ON c.sa_id = b.sa_id
INNER JOIN ci_sp d ON d.sp_id = c.sp_id
INNER JOIN ci_sp_char e ON e.sp_id = d.sp_id
    AND e.char_type_cd = 'CM_LEGCY'
INNER JOIN d1_sp_char f ON f.srch_char_val = e.srch_char_val
    AND f.char_type_cd = 'CM_LEGCY'
INNER JOIN d1_install_evt g ON g.d1_sp_id = f.d1_sp_id
    AND g.d1_removal_dttm IS NULL
INNER JOIN d1_dvc_cfg h ON h.DEVICE_CONFIG_ID = g.DEVICE_CONFIG_ID
INNER JOIN D1_ACTIVITY_REL_OBJ k ON k.PK_VALUE1 = h.D1_DEVICE_ID
    AND k.MAINT_OBJ_CD = 'D1-DEVICE'
INNER JOIN ci_prem_char pc ON pc.prem_id = a.mailing_prem_id
    AND pc.char_type_cd = 'CM_NOCS'
INNER JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
    AND vl.language_cd = 'ENG'
INNER JOIN d1_activity PARTITION(p2025DEC) l ON l.D1_ACTIVITY_ID = k.D1_ACTIVITY_ID
    AND l.activity_type_cd IN ('REMOTEDISCONNECT', 'REMOTECONNECT')
WHERE TRUNC(l.cre_dttm) = TRUNC(SYSDATE)
    AND l.BUS_OBJ_CD IN ('D1-RemoteConnect', 'D1-RemoteDisconnect')
    AND l.BO_STATUS_CD IN ('COMPLETED', 'COMINPROG', 'DISCARDED')
GROUP BY
    vl.descr,
    l.BUS_OBJ_CD,
    l.BO_STATUS_CD
ORDER BY
    NOCS_NAME,
    COMMAND_TYPE,
    COMMAND_STATUS
