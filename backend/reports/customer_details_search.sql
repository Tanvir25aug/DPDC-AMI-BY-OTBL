-- Customer Details Search
-- Search by Customer ID ONLY (fast)
-- Parameters: :searchValue (customer ID)

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
    FROM ci_sp_char spc
    INNER JOIN ci_sa_sp sasp ON sasp.sp_id = spc.sp_id
    INNER JOIN ci_sa sa ON sa.sa_id = sasp.sa_id AND sa.sa_type_cd = 'PPD'
    WHERE spc.char_type_cd = 'CM_LEGCY'
        AND spc.adhoc_char_val = :searchValue
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
