-- Customer Details Search by Meter Number (Optimized)
-- Direct search without UNION for better performance
-- Parameter: :meterNumber

WITH customer_base AS (
    SELECT
        spc.adhoc_char_val AS CUSTOMER_ID,
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
    INNER JOIN d1_dvc_cfg dc ON dc.d1_device_id = dvc.d1_device_id
    INNER JOIN d1_measr_comp mc ON mc.device_config_id = dc.device_config_id
    INNER JOIN d1_usage_period_sq ups ON ups.measr_comp_id = mc.measr_comp_id
    INNER JOIN d1_usage du ON du.d1_usage_id = ups.d1_usage_id
    INNER JOIN c1_usage cu ON cu.usage_id = du.usg_ext_id
    INNER JOIN ci_bseg bseg ON bseg.bseg_id = cu.bseg_id
    INNER JOIN ci_sa sa ON sa.sa_id = bseg.sa_id AND sa.sa_type_cd = 'PPD'
    INNER JOIN ci_sa_sp sasp ON sasp.sa_id = sa.sa_id
    INNER JOIN ci_sp_char spc ON spc.sp_id = sasp.sp_id AND spc.char_type_cd = 'CM_LEGCY'
    WHERE dvc.dvc_id_type_flg = 'D1SN'
        AND dvc.id_value = :meterNumber
        AND ROWNUM = 1
),
last_bill AS (
    SELECT
        cb.SA_ID,
        MAX(b.end_dt) AS LAST_BILL_DATE
    FROM customer_base cb
    JOIN ci_bseg b ON b.sa_id = cb.SA_ID AND b.bseg_stat_flg = '50'
    GROUP BY cb.SA_ID
)
SELECT
    cb.CUSTOMER_ID,
    cb.SA_ID,
    cb.CONNECTION_DATE,
    cb.ACCOUNT_STATUS,
    cb.STATUS_DESCRIPTION,
    vl.descr AS NOCS_NAME,
    cb.ACCT_ID,
    p1.address1 || ', ' || p1.address2 || ', ' || p1.address3 || ', ' || p1.address4 AS ADDRESS,
    mob.contact_value AS PHONE_NO,
    NULL AS METER_NO,
    lb.LAST_BILL_DATE
FROM customer_base cb
LEFT JOIN ci_acct acc ON acc.acct_id = cb.ACCT_ID
LEFT JOIN ci_prem p1 ON p1.prem_id = acc.mailing_prem_id
LEFT JOIN ci_prem_char pc ON pc.prem_id = p1.prem_id AND pc.char_type_cd = 'CM_NOCS'
LEFT JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
LEFT JOIN ci_acct_per ap ON ap.acct_id = cb.ACCT_ID AND ap.main_cust_sw = 'Y'
LEFT JOIN c1_per_contdet mob ON mob.per_id = ap.per_id
    AND mob.comm_rte_type_cd = 'CELLPHONE'
    AND mob.cnd_primary_flg = 'C1YS'
LEFT JOIN last_bill lb ON lb.SA_ID = cb.SA_ID
