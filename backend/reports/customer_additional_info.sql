-- Get additional customer information (Simplified Version)
-- Includes NOCS, Connection Date, Account Status
-- Parameter: :custId

SELECT DISTINCT
    s1.adhoc_char_val AS CUSTOMER_NO,
    vl.descr AS NOCS_NAME,
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
    p1.address1 || ', ' || p1.address2 || ', ' || p1.address3 || ', ' || p1.address4 AS ADDRESS,
    mob.contact_value AS PHONE_NO,
    NULL AS METER_NO,
    NULL AS FEEDER,
    NULL AS FEEDER_DESCRIPTION
FROM ci_sp_char s1
INNER JOIN ci_sa_sp sasp ON sasp.sp_id = s1.sp_id
INNER JOIN ci_sa sa ON sa.sa_id = sasp.sa_id
LEFT JOIN ci_acct acct ON acct.acct_id = sa.acct_id
LEFT JOIN ci_prem p1 ON p1.prem_id = acct.mailing_prem_id
LEFT JOIN ci_prem_char pc ON pc.prem_id = p1.prem_id
    AND pc.char_type_cd = 'CM_NOCS'
LEFT JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
LEFT JOIN ci_acct_per ap ON ap.acct_id = sa.acct_id
    AND ap.main_cust_sw = 'Y'
LEFT JOIN c1_per_contdet mob ON mob.per_id = ap.per_id
    AND mob.comm_rte_type_cd = 'CELLPHONE'
    AND mob.cnd_primary_flg = 'C1YS'
WHERE s1.char_type_cd = 'CM_LEGCY'
  AND s1.adhoc_char_val = :custId
  AND sa.sa_type_cd = 'PPD'
  AND sa.sa_status_flg = '20'
  AND ROWNUM = 1
