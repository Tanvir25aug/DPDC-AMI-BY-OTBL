-- Customer Billing Details - Optimized Version (Oracle Compatible)
-- Parameters: :custId (required), :startDate (optional), :endDate (optional)

SELECT
    T11.ID_VALUE AS MSN,
    :custId AS CUSTID,
    T12.CONTACT_VALUE AS MOBILE_NO,
    T4.D1_USAGE_ID AS USAGEID,
    T1.START_DT,
    T1.END_DT,
    MAX(T2.AUDIT_CALC_AMT) AS DAILY_CHARGES,
    T5.MEASR_COMP_ID,
    MIN(T13.start_msrmt) AS START_READ,
    MAX(T13.end_msrmt) AS END_READ,
    -- Calculate consumption as END_READ - START_READ
    (MAX(T13.end_msrmt) - MIN(T13.start_msrmt)) AS QUANTITY,
    T6.AUDIT_CALC_AMT AS TOTAL_MONTHLY_AMOUNT,
    MAX(BAL.PAYOFF_BAL) AS PAYOFF_BAL,
    MAX(NOCS.NOCS_NAME) AS NOCS_NAME
FROM ci_bseg T1
LEFT JOIN ci_bseg_calc_ln T6 ON T6.bseg_id=T1.bseg_id
    AND T6.SEQNO=(SELECT MAX(M.SEQNO) FROM ci_bseg_calc_ln M WHERE M.BSEG_ID=T6.BSEG_ID AND M.CALC_RULE_CD='E_TM_NLL')
INNER JOIN ci_bseg_calc_ln T2 ON T1.BSEG_ID=T2.BSEG_ID
INNER JOIN c1_usage T3 ON T1.BSEG_ID=T3.BSEG_ID
INNER JOIN d1_usage T4 ON T3.USAGE_ID=T4.USG_EXT_ID
INNER JOIN d1_usage_period_sq T5 ON T4.D1_USAGE_ID=T5.D1_USAGE_ID
INNER JOIN d1_us_contact T7 ON T4.US_ID=T7.US_ID
INNER JOIN d1_measr_comp T9 ON T5.MEASR_COMP_ID=T9.MEASR_COMP_ID
INNER JOIN d1_dvc_cfg T10 ON T9.DEVICE_CONFIG_ID=T10.DEVICE_CONFIG_ID
INNER JOIN d1_dvc_identifier T11 ON T10.D1_DEVICE_ID=T11.D1_DEVICE_ID AND T11.DVC_ID_TYPE_FLG='D1SN'
LEFT JOIN d1_usage_scalar_dtl T13 ON T13.d1_usage_id=T4.D1_USAGE_ID AND T13.measr_comp_id=T5.MEASR_COMP_ID
LEFT JOIN ci_sa SA ON SA.SA_ID = T1.SA_ID
LEFT JOIN ci_acct_per AP ON AP.acct_id = SA.acct_id AND AP.main_cust_sw='Y'
LEFT JOIN c1_per_contdet T12 ON T12.per_id = AP.per_id AND T12.cnd_primary_flg='C1YS'
LEFT JOIN (
    SELECT SA_ID, SUM(TOT_AMT) AS PAYOFF_BAL
    FROM CI_FT
    WHERE FREEZE_SW='Y'
    GROUP BY SA_ID
) BAL ON BAL.SA_ID = T1.SA_ID
LEFT JOIN (
    SELECT sa.sa_id, vl.descr AS NOCS_NAME
    FROM ci_sa sa
    JOIN ci_acct acc ON acc.acct_id = sa.acct_id
    LEFT JOIN ci_prem_char pc ON pc.prem_id = acc.mailing_prem_id AND pc.char_type_cd='CM_NOCS'
    LEFT JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
) NOCS ON NOCS.sa_id = T1.SA_ID
WHERE T1.BSEG_STAT_FLG<>'60'
    AND T1.SA_ID = (
        SELECT E3.SA_ID FROM CI_SA_SP E1, CI_SA E3
        WHERE E1.SP_ID=(SELECT SP_ID FROM CI_SP_CHAR WHERE CHAR_TYPE_CD='CM_LEGCY' AND ADHOC_CHAR_VAL=:custId AND ROWNUM=1)
        AND E3.SA_TYPE_CD='PPD' AND E3.SA_ID=E1.SA_ID AND ROWNUM=1
    )
    AND T2.CALC_RULE_CD = 'CM_TOTALCHRGE'
    AND TRIM(T5.d1_tou_cd) IS NULL
    AND TRIM(T5.d1_sqi_cd) IS NULL
    AND T5.d1_uom_cd='KWH'
    AND (:startDate IS NULL OR T1.END_DT >= TO_DATE(:startDate, 'DD-MON-YYYY'))
    AND (:endDate IS NULL OR T1.END_DT <= TO_DATE(:endDate, 'DD-MON-YYYY'))
GROUP BY
    T1.SA_ID, T1.BSEG_ID, T1.START_DT, T1.END_DT,
    T4.D1_USAGE_ID, T6.AUDIT_CALC_AMT,
    T12.CONTACT_VALUE, T11.ID_VALUE, T5.MEASR_COMP_ID
ORDER BY T1.END_DT ASC
