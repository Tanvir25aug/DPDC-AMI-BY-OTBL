-- Customer Master List
-- Purpose: Full customer master data export (all active PPD/POPD accounts with NOCS)
-- Data Source: Oracle CC&B (CISADM schema) - READ ONLY
-- Rows: ~3 lakh customers
-- Execution Time: 10-30 minutes on loaded Oracle
-- Columns: NOCS, Customer No, Name, Father Name, Address, Mobile, Sanction Load,
--          Meter No, Phase, Tariff, Connection Date, Feeder No, Feeder Name

WITH
/* Legacy/pre-account char IDs */
d1_sp_char_merge AS (
    SELECT d1_sp_id, char_type_cd, adhoc_char_val
    FROM   cisadm.d1_sp_char
    WHERE  char_type_cd IN ('CM_LEGCY', 'CM_PREAC')
),

/* Concatenated legacy customer IDs per service point */
sp_char_agg AS (
    SELECT
        d1_sp_id,
        LISTAGG(adhoc_char_val, ',') WITHIN GROUP (ORDER BY char_type_cd) AS leg_cust_id_no
    FROM   d1_sp_char_merge
    GROUP BY d1_sp_id
),

/* Latest meter type per service point */
meter_type_cte AS (
    SELECT b.d1_sp_id, b.char_val
    FROM (
        SELECT d1_sp_id, MAX(effdt) AS max_effdt
        FROM   cisadm.d1_sp_char
        WHERE  char_type_cd = 'CM_MTRTY'
        GROUP BY d1_sp_id
    ) a
    JOIN cisadm.d1_sp_char b
        ON  b.d1_sp_id     = a.d1_sp_id
        AND b.effdt        = a.max_effdt
        AND b.char_type_cd = 'CM_MTRTY'
),

/* Father name only */
per_father AS (
    SELECT per_id, MAX(adhoc_char_val) AS father_name
    FROM   cisadm.ci_per_char
    WHERE  char_type_cd = 'FATHER  '
    GROUP BY per_id
),

/* Primary mobile - single scan of c1_per_contdet */
per_mobile AS (
    SELECT per_id, MAX(contact_value) AS mobile_no
    FROM   cisadm.c1_per_contdet
    WHERE  comm_rte_type_cd = 'CELLPHONE'
      AND  cnd_primary_flg  = 'C1YS'
    GROUP BY per_id
),

/* Sanction load - window functions replace correlated subqueries */
sanc_load AS (
    SELECT sa_id, cont_qty
    FROM (
        SELECT
            sc.sa_id,
            sq.cont_qty,
            RANK() OVER (PARTITION BY sc.sa_id ORDER BY sc.effdt DESC) AS char_rn,
            RANK() OVER (PARTITION BY sq.sa_id ORDER BY sq.effdt DESC) AS qty_rn
        FROM   cisadm.ci_sa_char     sc
        JOIN   cisadm.ci_sa          sa ON sa.sa_id = sc.sa_id
                                       AND TRIM(sa.sa_type_cd) IN ('PPD', 'POPD')
        JOIN   cisadm.ci_sa_cont_qty sq ON sq.sa_id = sc.sa_id
                                       AND TRIM(sq.cont_qty_type_cd) = 'SLOAD'
        WHERE  sc.char_type_cd = 'CM_CUSCA'
    )
    WHERE char_rn = 1 AND qty_rn = 1
),

/* Feeder info */
feeder_info AS (
    SELECT
        csc.sp_id,
        fa.id_value AS feeder_cd,
        fb.descr100 AS feeder_desc
    FROM   cisadm.ci_sp_char            csc
    JOIN   cisadm.d1_facility_identifier fi_sp ON fi_sp.facility_id     = csc.char_val_fk1
    JOIN   cisadm.d1_nw_loc             nl     ON nl.facility_id        = fi_sp.facility_id
    JOIN   cisadm.d1_nw_node            nn     ON nn.network_location_id = nl.network_location_id
    JOIN   cisadm.d1_facility_l         fb     ON fb.facility_id        = nn.network_node
    JOIN   cisadm.d1_facility_identifier fa    ON fa.facility_id        = fb.facility_id
    WHERE  csc.char_type_cd = 'CM-DISNT'
),

/* Customer tariff */
cust_det AS (
    SELECT a.sa_id, a.cust_cat
    FROM (
        SELECT *
        FROM (
            SELECT
                a.sa_id,
                a.char_val                                                AS cust_cat,
                RANK() OVER (PARTITION BY a.sa_id ORDER BY a.effdt DESC) AS ran1,
                RANK() OVER (PARTITION BY b.sa_id ORDER BY b.effdt)      AS ran
            FROM   cisadm.ci_sa_char    a
            JOIN   cisadm.ci_sa_cont_qty b ON b.sa_id = a.sa_id
                                          AND b.cont_qty_type_cd = 'SLOAD   '
            JOIN   cisadm.ci_sa          i ON i.sa_id = a.sa_id
                                          AND TRIM(i.sa_type_cd) IN ('PPD', 'POPD')
            WHERE  a.char_type_cd = 'CM_CUSCA'
        )
        WHERE ran = 1 AND ran1 = 1
    ) a
)

SELECT DISTINCT
    cval.descr                                                                    AS NOCS_NAME,
    SUBSTR(sca.leg_cust_id_no, 1,
           NULLIF(INSTR(sca.leg_cust_id_no, ',', 1), 0) - 1)                     AS CUSTOMER_NUM,
    pname.entity_name                                                             AS CUSTOMER_NAME,
    pf.father_name                                                                AS FATHER_NAME,
    prem.address1 || ',' || prem.address2 || ',' || prem.address3 || ','
    || prem.address4 || ',' || prem.county || ',' || prem.city || ','
    || prem.geo_code || ',' || prem.postal || ',' || prem.country                AS ADDRESS,
    pm.mobile_no                                                                  AS MOBILE_NO,
    sl.cont_qty                                                                   AS SANCTION_LOAD,
    dvc_id.id_value                                                               AS METER_NO,
    DECODE(TRIM(mt.char_val), 'SINGLE', '1P', '3P')                              AS PHASE,
    TRIM(cd.cust_cat)                                                             AS TARIFF,
    inst.d1_install_dttm                                                          AS CONN_DATE,
    fi.feeder_cd                                                                  AS FEEDER_NO,
    fi.feeder_desc                                                                AS FEEDER_NAME

FROM       cisadm.ci_acct_per         acct_per
JOIN       cisadm.ci_per              per        ON per.per_id             = acct_per.per_id
JOIN       cisadm.ci_per_name         pname      ON pname.per_id           = per.per_id
JOIN       cisadm.ci_acct             acct       ON acct.acct_id           = acct_per.acct_id
JOIN       cisadm.ci_prem             prem       ON prem.prem_id           = acct.mailing_prem_id
JOIN       cisadm.ci_prem_char        prem_char  ON prem_char.prem_id      = prem.prem_id
                                               AND prem_char.char_type_cd  = 'CM_NOCS'
JOIN       cisadm.ci_char_val_l       cval       ON cval.char_type_cd      = 'CM_NOCS'
                                               AND cval.char_val           = prem_char.char_val
JOIN       cisadm.ci_sa               sa         ON sa.acct_id             = acct.acct_id
                                               AND TRIM(sa.sa_type_cd) IN ('PPD', 'POPD')
JOIN       cisadm.ci_sp               sp         ON sp.prem_id             = prem.prem_id
JOIN       cisadm.d1_sp_identifier    sp_ident   ON sp_ident.id_value      = sp.sp_id
                                               AND sp_ident.sp_id_type_flg = 'D1EI'
JOIN       cisadm.d1_sp               d1sp       ON d1sp.d1_sp_id          = sp_ident.d1_sp_id
JOIN       cisadm.d1_install_evt      inst       ON inst.d1_sp_id          = d1sp.d1_sp_id
                                               AND inst.d1_removal_dttm IS NULL
JOIN       cisadm.d1_dvc_cfg          dvc_cfg    ON dvc_cfg.device_config_id = inst.device_config_id
JOIN       cisadm.d1_dvc              dvc        ON dvc.d1_device_id       = dvc_cfg.d1_device_id
JOIN       cisadm.d1_dvc_identifier   dvc_id     ON dvc_id.d1_device_id   = dvc.d1_device_id
JOIN       sp_char_agg                sca        ON sca.d1_sp_id           = d1sp.d1_sp_id
JOIN       meter_type_cte             mt         ON mt.d1_sp_id            = d1sp.d1_sp_id
JOIN       cust_det                   cd         ON cd.sa_id               = sa.sa_id
JOIN       feeder_info                fi         ON fi.sp_id               = sp.sp_id
LEFT JOIN  per_father                 pf         ON pf.per_id              = per.per_id
LEFT JOIN  per_mobile                 pm         ON pm.per_id              = per.per_id
LEFT JOIN  sanc_load                  sl         ON sl.sa_id               = sa.sa_id

WHERE
    pname.entity_name   NOT LIKE 'PROD TEST%'
    AND dvc_id.id_value NOT LIKE '%BAD'
    AND dvc_id.id_value NOT LIKE '%DUP'
