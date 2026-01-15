-- Customer Details Search by Meter Number (Installation-Based)
-- Uses current meter installation records for accurate results
-- Returns the CURRENT customer assigned to this meter (not historical)
-- Parameter: :meterNumber

WITH current_installation AS (
    SELECT
        sp_char.adhoc_char_val AS CUSTOMER_ID,
        sa.sa_id AS SA_ID,
        sa.start_dt AS CONNECTION_DATE,
        sa.sa_status_flg AS ACCOUNT_STATUS,
        CASE sa.sa_status_flg
            WHEN '10' THEN 'Pending Start'
            WHEN '20' THEN 'Active'
            WHEN '30' THEN 'Pending Stop'
            WHEN '40' THEN 'Stopped'
            WHEN '50' THEN 'Reactivated'
            ELSE 'Unknown'
        END AS STATUS_DESCRIPTION,
        sa.acct_id AS ACCT_ID
    FROM d1_dvc_identifier dvc
    INNER JOIN d1_dvc_cfg cfg
        ON dvc.d1_device_id = cfg.d1_device_id
    INNER JOIN d1_install_evt evt
        ON cfg.device_config_id = evt.device_config_id
        AND evt.d1_removal_dttm IS NULL  -- Only current installation (not removed)
    INNER JOIN d1_sp_char sp_char
        ON evt.d1_sp_id = sp_char.d1_sp_id
        AND sp_char.char_type_cd = 'CM_LEGCY'
    INNER JOIN d1_sp sp
        ON sp.d1_sp_id = sp_char.d1_sp_id
    INNER JOIN d1_sp_identifier sp_id
        ON sp_id.d1_sp_id = sp.d1_sp_id
        AND sp_id.sp_id_type_flg = 'D1EI'
    INNER JOIN ci_sp ci_sp
        ON ci_sp.sp_id = sp_id.id_value
    INNER JOIN ci_sa_sp sasp
        ON sasp.sp_id = ci_sp.sp_id
    INNER JOIN ci_sa sa
        ON sa.sa_id = sasp.sa_id
        AND sa.sa_type_cd = 'PPD'
    WHERE dvc.id_value = :meterNumber
        AND dvc.dvc_id_type_flg = 'D1SN'
        AND ROWNUM = 1
),
last_bill AS (
    SELECT
        ci.SA_ID,
        MAX(b.end_dt) AS LAST_BILL_DATE
    FROM current_installation ci
    JOIN ci_bseg b ON b.sa_id = ci.SA_ID AND b.bseg_stat_flg = '50'
    GROUP BY ci.SA_ID
)
SELECT
    ci.CUSTOMER_ID,
    per_name.entity_name AS CUSTOMER_NAME,
    ci.SA_ID,
    ci.CONNECTION_DATE,
    ci.ACCOUNT_STATUS,
    ci.STATUS_DESCRIPTION,
    vl.descr AS NOCS_NAME,
    ci.ACCT_ID,
    p1.address1 || ', ' || p1.address2 || ', ' || p1.address3 || ', ' || p1.address4 AS ADDRESS,
    mob.contact_value AS PHONE_NO,
    NULL AS METER_NO,
    lb.LAST_BILL_DATE
FROM current_installation ci
LEFT JOIN ci_acct acc ON acc.acct_id = ci.ACCT_ID
LEFT JOIN ci_prem p1 ON p1.prem_id = acc.mailing_prem_id
LEFT JOIN ci_prem_char pc ON pc.prem_id = p1.prem_id AND pc.char_type_cd = 'CM_NOCS'
LEFT JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
LEFT JOIN ci_acct_per ap ON ap.acct_id = ci.ACCT_ID AND ap.main_cust_sw = 'Y'
LEFT JOIN ci_per_name per_name ON per_name.per_id = ap.per_id AND per_name.prim_name_sw = 'Y'
LEFT JOIN c1_per_contdet mob ON mob.per_id = ap.per_id
    AND mob.comm_rte_type_cd = 'CELLPHONE'
    AND mob.cnd_primary_flg = 'C1YS'
LEFT JOIN last_bill lb ON lb.SA_ID = ci.SA_ID
