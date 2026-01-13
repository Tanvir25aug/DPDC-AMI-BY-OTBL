-- Auto Connect/Disconnect Detailed Transaction View
-- Detailed view of RC/DC commands with filters for command type and status
-- Uncomment WHERE filters to filter by specific command type or status

SELECT
    l.d1_activity_id,
    f.srch_char_val OLD_CONSUMER_ID,
    i.id_value MSN,
    a.acct_id account_no,
    TO_CHAR(l.START_DTTM, 'DD-MM-YYYY HH24:MI:SS') DATE_OF_COMMAND_TRIGGER,
    TO_CHAR(l.END_DTTM, 'DD-MM-YYYY HH24:MI:SS') RESPONSE_DATE_AND_TIME,
    l.BUS_OBJ_CD COMMAND_TYPE,
    l.BO_STATUS_CD COMMAND_STATUS,
    b.sa_id,
    SUM(j.TOT_AMT) PAYOFF_BALANCE,
    vl.descr nocs_name,
    g.bo_status_cd METER_STATUS,
    h.DEVICE_CONFIG_TYPE_CD phase
FROM ci_acct a
INNER JOIN ci_acct_char xy ON a.acct_id = xy.acct_id
    AND xy.char_type_cd = 'CM_MTDIS'
    AND xy.CHAR_VAL = 'Y'
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
INNER JOIN D1_ACTIVITY_REL_OBJ k ON k.PK_VALUE1 = h.D1_DEVICE_ID
    AND k.MAINT_OBJ_CD = 'D1-DEVICE'
INNER JOIN ci_prem_char pc ON pc.prem_id = a.mailing_prem_id
    AND pc.char_type_cd = 'CM_NOCS'
INNER JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
INNER JOIN d1_activity PARTITION(p2026JAN) l ON l.D1_ACTIVITY_ID = k.D1_ACTIVITY_ID
    AND l.activity_type_cd IN ('REMOTEDISCONNECT', 'REMOTECONNECT')
WHERE TRUNC(l.cre_dttm) = TRUNC(SYSDATE)
-- Filter by command status (uncomment one):
AND l.BO_STATUS_CD = 'COMPLETED'
--AND l.BO_STATUS_CD = 'COMINPROG'
--AND l.BO_STATUS_CD = 'DISCARDED'
-- Filter by command type (uncomment one):
AND l.BUS_OBJ_CD = 'D1-RemoteConnect'
--AND l.BUS_OBJ_CD = 'D1-RemoteDisconnect'
GROUP BY
    i.id_value,
    f.srch_char_val,
    g.bo_status_cd,
    h.DEVICE_CONFIG_TYPE_CD,
    a.acct_id,
    b.sa_id,
    l.BUS_OBJ_CD,
    l.ACTIVITY_TYPE_CD,
    l.start_dttm,
    l.END_DTTM,
    l.BO_STATUS_CD,
    l.d1_activity_id,
    vl.descr
ORDER BY l.start_dttm DESC
