-- NOCS Meter Installation Yearly Report
-- Shows meter installation statistics by NOCS for entire year with month-by-month breakdown
-- Parameters: :year (format: YYYY)

WITH meter_installations AS (
    SELECT
        p.CHAR_VAL AS NOCS_CODE,
        l.descr AS NOCS_NAME,
        TO_CHAR(f.d1_install_dttm, 'YYYY-MM') AS INSTALL_MONTH,
        TO_NUMBER(TO_CHAR(f.d1_install_dttm, 'MM')) AS MONTH_NUM,
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
      AND TO_CHAR(f.d1_install_dttm, 'YYYY') = :year
)
SELECT
    NOCS_CODE,
    NOCS_NAME,
    SUM(CASE WHEN MONTH_NUM = 1 THEN 1 ELSE 0 END) AS JAN,
    SUM(CASE WHEN MONTH_NUM = 2 THEN 1 ELSE 0 END) AS FEB,
    SUM(CASE WHEN MONTH_NUM = 3 THEN 1 ELSE 0 END) AS MAR,
    SUM(CASE WHEN MONTH_NUM = 4 THEN 1 ELSE 0 END) AS APR,
    SUM(CASE WHEN MONTH_NUM = 5 THEN 1 ELSE 0 END) AS MAY,
    SUM(CASE WHEN MONTH_NUM = 6 THEN 1 ELSE 0 END) AS JUN,
    SUM(CASE WHEN MONTH_NUM = 7 THEN 1 ELSE 0 END) AS JUL,
    SUM(CASE WHEN MONTH_NUM = 8 THEN 1 ELSE 0 END) AS AUG,
    SUM(CASE WHEN MONTH_NUM = 9 THEN 1 ELSE 0 END) AS SEP,
    SUM(CASE WHEN MONTH_NUM = 10 THEN 1 ELSE 0 END) AS OCT,
    SUM(CASE WHEN MONTH_NUM = 11 THEN 1 ELSE 0 END) AS NOV,
    SUM(CASE WHEN MONTH_NUM = 12 THEN 1 ELSE 0 END) AS DEC,
    COUNT(DISTINCT METER_NUMBER) AS TOTAL_YEAR,
    COUNT(DISTINCT PREMISE_ID) AS TOTAL_PREMISES,
    ROUND(COUNT(DISTINCT METER_NUMBER) / 12.0, 2) AS MONTHLY_AVERAGE,
    ROUND(
        COUNT(DISTINCT METER_NUMBER) * 100.0 /
        SUM(COUNT(DISTINCT METER_NUMBER)) OVER (),
        2
    ) AS PERCENTAGE_OF_TOTAL
FROM meter_installations
GROUP BY NOCS_CODE, NOCS_NAME
ORDER BY TOTAL_YEAR DESC
