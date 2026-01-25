-- NOCS Meter Installation Monthly Report
-- Shows meter installation statistics by NOCS for a specific month
-- Parameters: :year_month (format: YYYY-MM)

WITH meter_installations AS (
    SELECT
        p.CHAR_VAL AS NOCS_CODE,
        l.descr AS NOCS_NAME,
        f.d1_install_dttm AS INSTALL_DATE,
        h.id_value AS METER_NUMBER,
        s1.ID_VALUE AS PREMISE_ID
    FROM d1_install_evt f
    INNER JOIN d1_dvc_cfg g ON f.device_config_id = g.device_config_id
    INNER JOIN d1_dvc_identifier h ON g.d1_device_id = h.d1_device_id
    INNER JOIN CISADM.D1_SP_CHAR e ON e.d1_sp_id = f.d1_sp_id
    INNER JOIN d1_Sp_identifier s1 ON e.d1_sp_id = s1.d1_sp_id
    INNER JOIN CI_PREM_CHAR p ON S1.ID_VALUE = p.PREM_ID
    INNER JOIN ci_char_val_l l ON p.char_val = l.char_val
    WHERE h.dvc_id_type_flg = 'D1SN'
      AND s1.SP_ID_TYPE_FLG = 'D1EP'
      AND p.char_type_cd = 'CM_NOCS'
      AND e.char_type_cd = 'CM_LEGCY'
      AND f.d1_removal_dttm IS NULL
      AND TO_CHAR(f.d1_install_dttm, 'YYYY-MM') = :year_month
)
SELECT
    NOCS_CODE,
    NOCS_NAME,
    COUNT(DISTINCT METER_NUMBER) AS METER_COUNT,
    COUNT(DISTINCT PREMISE_ID) AS PREMISE_COUNT,
    TO_CHAR(MIN(INSTALL_DATE), 'DD-MON-YYYY') AS FIRST_INSTALL_DATE,
    TO_CHAR(MAX(INSTALL_DATE), 'DD-MON-YYYY') AS LAST_INSTALL_DATE,
    ROUND(COUNT(DISTINCT METER_NUMBER) / GREATEST(
        TRUNC(MAX(INSTALL_DATE)) - TRUNC(MIN(INSTALL_DATE)) + 1, 1
    ), 2) AS DAILY_AVERAGE,
    ROUND(
        COUNT(DISTINCT METER_NUMBER) * 100.0 /
        SUM(COUNT(DISTINCT METER_NUMBER)) OVER (),
        2
    ) AS PERCENTAGE_OF_TOTAL
FROM meter_installations
GROUP BY NOCS_CODE, NOCS_NAME
ORDER BY METER_COUNT DESC
