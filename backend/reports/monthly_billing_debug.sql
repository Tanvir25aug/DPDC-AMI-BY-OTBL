-- Monthly Billing Debug Query
-- Use this to verify monthly totals and compare with Telegram bot output
-- Parameter: :custId (Customer ID)

WITH daily_billing AS (
    SELECT
        T1.START_DT,
        T1.END_DT,
        MAX(T2.AUDIT_CALC_AMT) AS DAILY_CHARGES,
        (MAX(T13.end_msrmt) - MIN(T13.start_msrmt)) AS QUANTITY
    FROM ci_bseg T1
    INNER JOIN ci_bseg_calc_ln T2 ON T1.BSEG_ID=T2.BSEG_ID
    INNER JOIN c1_usage T3 ON T1.BSEG_ID=T3.BSEG_ID
    INNER JOIN d1_usage T4 ON T3.USAGE_ID=T4.USG_EXT_ID
    INNER JOIN d1_usage_period_sq T5 ON T4.D1_USAGE_ID=T5.D1_USAGE_ID
    LEFT JOIN d1_usage_scalar_dtl T13 ON T13.d1_usage_id=T4.D1_USAGE_ID AND T13.measr_comp_id=T5.MEASR_COMP_ID
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
    GROUP BY
        T1.SA_ID, T1.BSEG_ID, T1.START_DT, T1.END_DT,
        T4.D1_USAGE_ID, T5.MEASR_COMP_ID
)
SELECT
    -- Group by START_DT month (same as Telegram bot)
    TO_CHAR(START_DT, 'YYYY-MM') AS MONTH_KEY,
    TO_CHAR(START_DT, 'Month YYYY') AS MONTH_NAME,
    EXTRACT(YEAR FROM START_DT) AS YEAR,
    COUNT(*) AS BILLING_DAYS,
    ROUND(SUM(DAILY_CHARGES), 2) AS TOTAL_CHARGES,
    ROUND(SUM(QUANTITY), 2) AS TOTAL_CONSUMPTION
FROM daily_billing
GROUP BY
    TO_CHAR(START_DT, 'YYYY-MM'),
    TO_CHAR(START_DT, 'Month YYYY'),
    EXTRACT(YEAR FROM START_DT)
ORDER BY TO_CHAR(START_DT, 'YYYY-MM');

-- ALTERNATIVE: Group by END_DT month (might be more accurate)
-- Uncomment this to test grouping by END_DT instead:

/*
SELECT
    -- Group by END_DT month
    TO_CHAR(END_DT, 'YYYY-MM') AS MONTH_KEY,
    TO_CHAR(END_DT, 'Month YYYY') AS MONTH_NAME,
    EXTRACT(YEAR FROM END_DT) AS YEAR,
    COUNT(*) AS BILLING_DAYS,
    ROUND(SUM(DAILY_CHARGES), 2) AS TOTAL_CHARGES,
    ROUND(SUM(QUANTITY), 2) AS TOTAL_CONSUMPTION
FROM daily_billing
GROUP BY
    TO_CHAR(END_DT, 'YYYY-MM'),
    TO_CHAR(END_DT, 'Month YYYY'),
    EXTRACT(YEAR FROM END_DT)
ORDER BY TO_CHAR(END_DT, 'YYYY-MM');
*/
