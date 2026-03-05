-- Customer Meter Reading Audit
-- Detects reading types from meter's configured measurement components:
--   1 kWh Daily type  → Residential
--   3 kWh Daily types → Commercial (kWh Daily + TOD1 + TOD2)
-- Parameter: :search_value (Customer ID or Meter Number)

WITH meter_info AS (
    SELECT
        sp_char.adhoc_char_val     AS customer_id,
        di.ID_VALUE                AS meter_no,
        TRUNC(evt.d1_install_dttm) AS install_date
    FROM ci_sp_char sp_char
    JOIN d1_sp_char d1_sp
        ON  d1_sp.adhoc_char_val = sp_char.adhoc_char_val
        AND d1_sp.char_type_cd   = 'CM_LEGCY'
    JOIN d1_install_evt evt
        ON  evt.d1_sp_id        = d1_sp.d1_sp_id
        AND evt.d1_removal_dttm IS NULL
    JOIN d1_dvc_cfg cfg
        ON  cfg.device_config_id = evt.device_config_id
    JOIN d1_dvc_identifier di
        ON  di.d1_device_id     = cfg.d1_device_id
        AND di.DVC_ID_TYPE_FLG  = 'D1SN'
        AND LENGTH(di.ID_VALUE) = 8
    WHERE sp_char.char_type_cd = 'CM_LEGCY'
      AND (    UPPER(sp_char.adhoc_char_val) = UPPER(:search_value)
            OR UPPER(di.ID_VALUE)            = UPPER(:search_value) )
      AND ROWNUM = 1
),

customer_tariff AS (
    SELECT UPPER(TRIM(sc.char_val)) AS tariff_code
    FROM meter_info mi
    JOIN ci_sp_char  sp ON sp.adhoc_char_val   = mi.customer_id
                       AND sp.char_type_cd     = 'CM_LEGCY'
    JOIN ci_sa_sp    ss ON ss.sp_id            = sp.sp_id
    JOIN ci_sa       sa ON sa.sa_id            = ss.sa_id
                       AND TRIM(sa.sa_type_cd) IN ('PPD', 'POPD')
    JOIN ci_sa_char  sc ON sc.sa_id            = sa.sa_id
                       AND sc.char_type_cd     = 'CM_CUSCA'
    WHERE sc.effdt = (
        SELECT MAX(sc2.effdt)
        FROM   ci_sa_char sc2
        WHERE  sc2.sa_id        = sc.sa_id
          AND  sc2.char_type_cd = 'CM_CUSCA'
    )
    AND ROWNUM = 1
),

meter_reading_types AS (
    SELECT reading_type
    FROM (
        SELECT 'kWh Daily'      AS reading_type FROM dual
        UNION ALL
        SELECT 'kWh Daily TOD1' FROM dual
        UNION ALL
        SELECT 'kWh Daily TOD2' FROM dual
    )
    WHERE reading_type = 'kWh Daily'
       OR (SELECT tariff_code FROM customer_tariff) <> 'LT-A'
),

last_bill AS (
    SELECT
        s3.srch_char_val AS customer_id,
        MAX(b.end_dt)    AS last_bill_dt
    FROM ci_bseg b
    JOIN ci_sa     s1 ON b.sa_id  = s1.sa_id
    JOIN ci_sa_sp  s2 ON s1.sa_id = s2.sa_id
    JOIN ci_sp_char s3 ON s2.sp_id = s3.sp_id
    WHERE s3.char_type_cd      = 'CM_LEGCY'
      AND s3.srch_char_val IN (SELECT customer_id FROM meter_info)
      AND b.bseg_stat_flg      = '50'
    GROUP BY s3.srch_char_val
),

-- Generate one row per check date (install date + 1st of every month up to now)
check_dates AS (
    SELECT
        m.customer_id,
        m.meter_no,
        m.install_date,
        COALESCE(l.last_bill_dt, m.install_date)                 AS last_bill_dt,
        CASE WHEN l.last_bill_dt IS NULL THEN 'Never Billed'
             ELSE TO_CHAR(l.last_bill_dt, 'DD-MON-YYYY') END     AS bill_status,
        m.install_date AS check_date,
        'Initial Read' AS date_type
    FROM meter_info m
    LEFT JOIN last_bill l ON l.customer_id = m.customer_id

    UNION ALL

    SELECT
        m.customer_id,
        m.meter_no,
        m.install_date,
        COALESCE(l.last_bill_dt, m.install_date),
        CASE WHEN l.last_bill_dt IS NULL THEN 'Never Billed'
             ELSE TO_CHAR(l.last_bill_dt, 'DD-MON-YYYY') END,
        ADD_MONTHS(TRUNC(m.install_date, 'MM'), LEVEL) AS check_date,
        'Month Start' AS date_type
    FROM meter_info m
    LEFT JOIN last_bill l ON l.customer_id = m.customer_id
    CONNECT BY
        LEVEL <= MONTHS_BETWEEN(TRUNC(SYSDATE, 'MM'), TRUNC(m.install_date, 'MM'))
        AND PRIOR m.customer_id = m.customer_id
        AND PRIOR m.meter_no    = m.meter_no
        AND PRIOR DBMS_RANDOM.VALUE IS NOT NULL
),

expected_reads AS (
    SELECT
        cd.customer_id,
        cd.meter_no,
        cd.install_date,
        cd.last_bill_dt,
        cd.bill_status,
        cd.check_date,
        cd.date_type,
        rt.reading_type
    FROM check_dates cd
    CROSS JOIN meter_reading_types rt
),

actual_reads AS (
    SELECT
        di.ID_VALUE           AS meter_no,
        TRUNC(ms.MSRMT_DTTM)  AS reading_date,
        ms.LAST_UPDATE_DTTM,
        ms.READING_VAL,
        mci.ID_VALUE          AS reading_type
    FROM d1_dvc_identifier di
    JOIN d1_dvc_cfg               dc  ON di.D1_DEVICE_ID    = dc.D1_DEVICE_ID
    JOIN d1_measr_comp            mc  ON dc.DEVICE_CONFIG_ID = mc.DEVICE_CONFIG_ID
    JOIN d1_measr_comp_identifier mci ON mc.MEASR_COMP_ID   = mci.MEASR_COMP_ID
    JOIN d1_msrmt                 ms  ON ms.MEASR_COMP_ID   = mc.MEASR_COMP_ID
    WHERE di.DVC_ID_TYPE_FLG = 'D1SN'
      AND di.ID_VALUE  IN (SELECT meter_no     FROM meter_info)
      AND mci.ID_VALUE IN (SELECT reading_type FROM meter_reading_types)
)

SELECT
    e.customer_id,
    e.meter_no,
    CASE WHEN (SELECT COUNT(*) FROM meter_reading_types) = 1
         THEN 'Residential' ELSE 'Commercial' END    AS meter_type,
    TO_CHAR(e.install_date,     'DD-MON-YYYY')       AS install_date,
    TO_CHAR(e.last_bill_dt,     'DD-MON-YYYY')       AS last_bill_dt,
    e.bill_status,
    TO_CHAR(e.check_date,       'DD-MON-YYYY')       AS expected_date,
    e.date_type,
    e.reading_type,
    a.READING_VAL,
    TO_CHAR(a.LAST_UPDATE_DTTM, 'DD-MON-YYYY HH24:MI') AS last_updated,
    CASE WHEN a.READING_VAL IS NULL THEN 'Missing' ELSE 'OK' END AS status
FROM expected_reads e
LEFT JOIN actual_reads a
    ON  e.meter_no     = a.meter_no
    AND e.reading_type = a.reading_type
    AND e.check_date   = a.reading_date
ORDER BY e.check_date, e.reading_type
