-- Get total count of meter-wise commands (for pagination)
-- Much faster than COUNT(*) on the full query

SELECT /*+ PARALLEL(2) */
    COUNT(DISTINCT l.d1_activity_id) AS TOTAL_COUNT
FROM d1_activity PARTITION(p2025DEC) l
INNER JOIN D1_ACTIVITY_REL_OBJ k ON l.D1_ACTIVITY_ID = k.D1_ACTIVITY_ID
    AND k.MAINT_OBJ_CD = 'D1-DEVICE'
WHERE TRUNC(l.cre_dttm) = TRUNC(SYSDATE)
    AND l.activity_type_cd IN ('REMOTEDISCONNECT','REMOTECONNECT')
    AND l.BUS_OBJ_CD IN ('D1-RemoteConnect', 'D1-RemoteDisconnect')
    AND l.BO_STATUS_CD IN ('COMPLETED', 'COMINPROG', 'DISCARDED')
