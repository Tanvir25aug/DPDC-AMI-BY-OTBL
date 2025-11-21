-- Daily RC/DC Command Count Summary
-- Provides aggregated count of Remote Connect and Disconnect commands by type and status
-- Simple summary for dashboard KPIs

SELECT
    COUNT(1) AS count,
    bus_obj_cd,
    bo_status_cd
FROM d1_activity
WHERE TRUNC(CRE_DTTM) = TRUNC(SYSDATE)
AND bus_obj_cd IN ('D1-RemoteConnect', 'D1-RemoteDisconnect')
GROUP BY bus_obj_cd, bo_status_cd
ORDER BY bus_obj_cd, bo_status_cd
