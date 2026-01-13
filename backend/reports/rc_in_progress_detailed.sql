-- RC In Progress - Detailed Report with Customer Information
-- Returns all RC commands currently in progress with full details

SELECT
    vl.descr AS NOCS_NAME,
    i.id_value AS METER_NUMBER,
    f.srch_char_val AS CUSTOMER_ID,
    l.BUS_OBJ_CD AS COMMAND_TYPE,
    l.BO_STATUS_CD AS COMMAND_STATUS,
    TO_CHAR(l.START_DTTM, 'DD-MM-YYYY HH24:MI:SS') AS TRIGGER_TIME,
    l.START_DTTM AS TRIGGER_TIMESTAMP,
    ROUND((SYSDATE - l.START_DTTM) * 24, 2) AS HOURS_ELAPSED,
    ROUND((SYSDATE - l.START_DTTM) * 24 * 60, 0) AS MINUTES_ELAPSED,
    SUM(j.TOT_AMT) * (-1) AS PAYOFF_BALANCE,
    l.d1_activity_id AS COMMAND_ID,
    CASE
        WHEN (SYSDATE - l.START_DTTM) * 24 < 0.5 THEN 'NORMAL'
        WHEN (SYSDATE - l.START_DTTM) * 24 < 1 THEN 'WARNING'
        WHEN (SYSDATE - l.START_DTTM) * 24 < 2 THEN 'ALERT'
        ELSE 'STUCK'
    END AS DURATION_STATUS
FROM ci_acct a
INNER JOIN ci_acct_char xy ON a.acct_id = xy.acct_id
    AND xy.char_type_cd = 'CM_MTDIS'
    AND xy.CHAR_VAL = 'Y'
INNER JOIN ci_sa b ON a.acct_id = b.acct_id
    AND b.sa_type_cd = 'PPD'
    AND b.sa_status_flg = '20'
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
    AND i.dvc_id_type_flg = 'D1SN'
INNER JOIN D1_ACTIVITY_REL_OBJ k ON k.PK_VALUE1 = h.D1_DEVICE_ID
    AND k.MAINT_OBJ_CD = 'D1-DEVICE'
INNER JOIN ci_prem_char pc ON pc.prem_id = a.mailing_prem_id
    AND pc.char_type_cd = 'CM_NOCS'
INNER JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
INNER JOIN d1_activity PARTITION(p2026JAN) l ON l.D1_ACTIVITY_ID = k.D1_ACTIVITY_ID
    AND l.activity_type_cd = 'REMOTECONNECT'
WHERE TRUNC(l.cre_dttm) = TRUNC(SYSDATE)
    AND l.BUS_OBJ_CD = 'D1-RemoteConnect'
    AND l.BO_STATUS_CD = 'COMINPROG'
GROUP BY
    i.id_value,
    f.srch_char_val,
    a.acct_id,
    b.sa_id,
    l.BUS_OBJ_CD,
    l.start_dttm,
    l.BO_STATUS_CD,
    l.d1_activity_id,
    vl.descr
ORDER BY l.start_dttm ASC
