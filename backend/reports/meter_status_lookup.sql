-- Meter Status Lookup
-- Get current meter status (Connected/Disconnected/RC In Progress/DC In Progress)
-- Parameter: :meterNumber

WITH latest_activity AS (
    SELECT
        act.bus_obj_cd,
        act.bo_status_cd,
        act.start_dttm,
        ROW_NUMBER() OVER (ORDER BY act.start_dttm DESC) AS rn
    FROM d1_dvc_identifier dvc
    INNER JOIN d1_activity_rel_obj rel ON rel.pk_value1 = dvc.d1_device_id AND rel.maint_obj_cd = 'D1-DEVICE'
    INNER JOIN d1_activity act ON act.d1_activity_id = rel.d1_activity_id
    WHERE dvc.id_value = :meterNumber
        AND dvc.dvc_id_type_flg = 'D1SN'
        AND act.bus_obj_cd IN ('D1-RemoteConnect', 'D1-RemoteDisconnect')
        AND act.bo_status_cd IN ('COMPLETED', 'COMINPROG')
)
SELECT
    CASE
        WHEN bus_obj_cd = 'D1-RemoteConnect' AND bo_status_cd = 'COMINPROG' THEN 'RC In Progress'
        WHEN bus_obj_cd = 'D1-RemoteDisconnect' AND bo_status_cd = 'COMINPROG' THEN 'DC In Progress'
        WHEN bus_obj_cd = 'D1-RemoteConnect' AND bo_status_cd = 'COMPLETED' THEN 'Connected'
        WHEN bus_obj_cd = 'D1-RemoteDisconnect' AND bo_status_cd = 'COMPLETED' THEN 'Disconnected'
        ELSE 'Unknown'
    END AS METER_STATUS
FROM latest_activity
WHERE rn = 1
