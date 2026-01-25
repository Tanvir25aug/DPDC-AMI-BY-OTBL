-- CRP-CPC Bill Stop Summary
-- Summary of bill stop issues grouped by CRP
-- Shows total CPC count, bill stop count, and active billing count per CRP

WITH CPC_LIST AS (
    -- Get all unique CPC customers with their CRP relationships
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO,
        cpc_cust.d1_sp_id,
        cpr_ref.adhoc_char_val AS CRP_ACCOUNT_NO,
        cpr_ref.d1_sp_id AS CRP_D1_SP_ID
    FROM d1_sp_char cpc_cust
    JOIN d1_sp_char cpr_ref ON cpr_ref.d1_sp_id = cpc_cust.d1_sp_id
        AND cpr_ref.char_type_cd = 'CM_CPRLA'
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
),
SP_INFO AS (
    -- Get service point info
    SELECT
        cpc.CPC_CUSTOMER_NO,
        MIN(sp.sp_id) AS sp_id
    FROM CPC_LIST cpc
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc.CPC_CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
    LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
    GROUP BY cpc.CPC_CUSTOMER_NO
),
SA_INFO AS (
    -- Get service agreement info
    SELECT
        sp.sp_id,
        MIN(sa.sa_id) AS sa_id
    FROM SP_INFO sp
    JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
    JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    GROUP BY sp.sp_id
),
BILLING_INFO AS (
    -- Get latest billing info with current month check
    -- Note: end_dt > TRUNC(SYSDATE, 'MM') means bill period ends AFTER 1st of current month
    -- A bill with end_dt = 01-JAN is a December bill (covers up to Jan 1)
    -- A bill with end_dt = 02-JAN or later covers January usage
    SELECT
        sa.sa_id,
        MAX(CASE WHEN bs.end_dt > TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) AS BILLED_THIS_MONTH
    FROM ci_bseg bs
    JOIN SA_INFO sa ON sa.sa_id = bs.sa_id
    WHERE bs.bseg_stat_flg = '50'  -- Only frozen/completed bills
    GROUP BY sa.sa_id
),
CPC_BILLING_STATUS AS (
    -- Join CPC with billing status
    SELECT
        cpc.CRP_ACCOUNT_NO,
        cpc.CRP_D1_SP_ID,
        cpc.CPC_CUSTOMER_NO,
        COALESCE(bill.BILLED_THIS_MONTH, 0) AS BILLED_THIS_MONTH
    FROM CPC_LIST cpc
    LEFT JOIN SP_INFO sp_info ON sp_info.CPC_CUSTOMER_NO = cpc.CPC_CUSTOMER_NO
    LEFT JOIN SA_INFO sa_info ON sa_info.sp_id = sp_info.sp_id
    LEFT JOIN BILLING_INFO bill ON bill.sa_id = sa_info.sa_id
)
SELECT
    CRP_ACCOUNT_NO,
    CRP_D1_SP_ID AS CRP_ID,
    COUNT(*) AS TOTAL_CPC_COUNT,
    SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) AS BILL_STOP_COUNT,
    SUM(CASE WHEN BILLED_THIS_MONTH = 1 THEN 1 ELSE 0 END) AS ACTIVE_BILLING_COUNT,
    ROUND(SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS BILL_STOP_PERCENTAGE
FROM CPC_BILLING_STATUS
GROUP BY CRP_ACCOUNT_NO, CRP_D1_SP_ID
HAVING SUM(CASE WHEN BILLED_THIS_MONTH = 0 THEN 1 ELSE 0 END) > 0  -- Only show CRPs with bill stop issues
ORDER BY BILL_STOP_COUNT DESC, CRP_ACCOUNT_NO
