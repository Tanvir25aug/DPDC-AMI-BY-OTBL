-- Customer Billing Details - Fixed to Match Reference Query Exactly
-- Parameters: :custId (required), :startDate (optional), :endDate (optional)

SELECT
    billing.CUSTID,
    billing.MSN,
    billing.MOBILE_NO,
    billing.USAGEID,
    billing.START_DT,
    billing.END_DT,
    billing.DAILY_CHARGES,
    billing.MEASR_COMP_ID,
    (SELECT MIN(m1.start_msrmt) FROM d1_usage_scalar_dtl m1
     WHERE m1.d1_usage_id = billing.USAGEID AND m1.measr_comp_id = billing.MEASR_COMP_ID) AS START_READ,
    (SELECT MAX(m1.end_msrmt) FROM d1_usage_scalar_dtl m1
     WHERE m1.d1_usage_id = billing.USAGEID AND m1.measr_comp_id = billing.MEASR_COMP_ID) AS END_READ,
    billing.QUANTITY,
    billing.TOTAL_MONTHLY_AMOUNT,
    billing.PAYOFF_BAL
FROM (
    SELECT
        T11.ID_VALUE AS MSN,
        (SELECT ADHOC_CHAR_VAL FROM CI_SP_CHAR
         WHERE CHAR_TYPE_CD = 'CM_LEGCY' AND ADHOC_CHAR_VAL = :custId AND ROWNUM = 1) AS CUSTID,
        T12.CONTACT_VALUE AS MOBILE_NO,
        T4.D1_USAGE_ID AS USAGEID,
        T1.START_DT,
        T1.END_DT,
        SUM(T2.AUDIT_CALC_AMT) AS DAILY_CHARGES,
        T5.MEASR_COMP_ID,
        T5.QUANTITY,
        T6.AUDIT_CALC_AMT AS TOTAL_MONTHLY_AMOUNT,
        (SELECT SUM(TOT_AMT) FROM CI_FT WHERE ACCOUNTING_DT <= T1.END_DT AND SA_ID = T1.SA_ID) AS PAYOFF_BAL
    FROM CI_BSEG T1
    LEFT JOIN CI_BSEG_CALC_LN T6 ON T6.bseg_id = T1.bseg_id
        AND T6.SEQNO = (SELECT MAX(M.SEQNO) FROM CI_BSEG_CALC_LN M
                        WHERE M.BSEG_ID = T6.BSEG_ID AND M.CALC_RULE_CD = 'E_TM_NLL')
    , CI_BSEG_CALC_LN T2
    , C1_USAGE T3
    , D1_USAGE T4
    , D1_USAGE_PERIOD_SQ T5
    , D1_US_CONTACT T7
    , D1_MEASR_COMP T9
    , D1_DVC_CFG T10
    , D1_DVC_IDENTIFIER T11
    , C1_PER_CONTDET T12
    WHERE T1.BSEG_ID = T2.BSEG_ID
        AND T1.BSEG_STAT_FLG <> '60'
        AND T4.US_ID = T7.US_ID
        AND T5.MEASR_COMP_ID = T9.MEASR_COMP_ID
        AND T9.DEVICE_CONFIG_ID = T10.DEVICE_CONFIG_ID
        AND T10.D1_DEVICE_ID = T11.D1_DEVICE_ID
        AND T11.DVC_ID_TYPE_FLG = 'D1SN'
        AND T1.SA_ID = (
            SELECT E3.SA_ID FROM CI_SA_SP E1, CI_SA E3
            WHERE SP_ID = (SELECT SP_ID FROM CI_SP_CHAR
                           WHERE CHAR_TYPE_CD = 'CM_LEGCY' AND ADHOC_CHAR_VAL = :custId AND ROWNUM = 1)
            AND E3.SA_TYPE_CD = 'PPD     '
            AND E3.SA_ID = E1.SA_ID
        )
        AND T12.per_id IN (
            SELECT per_id FROM ci_acct_per WHERE acct_id IN (
                SELECT acct_id FROM ci_acct WHERE acct_id IN (
                    SELECT acct_id FROM ci_sa WHERE sa_id = T1.SA_ID
                )
            )
        )
        AND T12.cnd_primary_flg = 'C1YS'
        AND T2.CALC_RULE_CD IN (
            'CM_TOTALCHRGE', 'SUM_OF_CHARGES', 'E_LTECOP', 'E_LTECPK',
            'E_LTC2CN', 'E_LTC1OP', 'E_LTC1PK', 'CM_SUM_OF_CHG',
            'E_LTD2SW', 'E_LTD1ED', 'E_LTD3BSOP', 'E_LTD3BOP', 'E_LTD3BPK'
        )
        AND T1.BSEG_ID = T3.BSEG_ID
        AND T3.USAGE_ID = T4.USG_EXT_ID
        AND T4.D1_USAGE_ID = T5.D1_USAGE_ID
        AND TRIM(T5.d1_tou_cd) IS NULL
        AND TRIM(T5.d1_sqi_cd) IS NULL
        AND T5.d1_uom_cd = 'KWH'
        AND (:startDate IS NULL OR T1.END_DT >= TO_DATE(:startDate, 'DD-MON-YYYY'))
        AND (:endDate IS NULL OR T1.END_DT <= TO_DATE(:endDate, 'DD-MON-YYYY'))
    GROUP BY
        T1.SA_ID, T1.BSEG_ID, T1.START_DT, T1.END_DT,
        T4.D1_USAGE_ID, T5.QUANTITY, T6.AUDIT_CALC_AMT,
        T12.CONTACT_VALUE, T11.ID_VALUE, T5.MEASR_COMP_ID
    ORDER BY T1.END_DT ASC
) billing
