-- CRP-CPC Bill Stop Analysis - FAST VERSION
-- Optimized for performance with ROWNUM limit
-- Returns only CPC customers with bill stop issues (not billed this month)
-- Parameters: :maxRows (optional, default 50000)

WITH CPC_WITH_CRP AS (
    -- Get CPC customers with their CRP (simplified, no D1 lookup)
    SELECT /*+ PARALLEL(4) */
        cpc_char.adhoc_char_val AS CPC_CUSTOMER_NO,
        crp_char.adhoc_char_val AS CRP_ACCOUNT_NO
    FROM ci_sp_char cpc_char
    JOIN ci_sp_char crp_char
        ON crp_char.sp_id = cpc_char.sp_id
        AND crp_char.char_type_cd = 'CM_CPRLA'
    WHERE cpc_char.char_type_cd = 'CM_LEGCY'
        AND cpc_char.adhoc_char_val IS NOT NULL
        AND ROWNUM <= NVL(:maxRows, 50000) * 2  -- Safety limit with buffer
),
SA_WITH_BILLING AS (
    -- Get service agreements with billing status
    SELECT /*+ PARALLEL(4) */
        sp_char.adhoc_char_val AS CPC_CUSTOMER_NO,
        sa.sa_id,
        sa.sa_status_flg,
        MAX(bs.end_dt) AS LAST_BILL_DATE,
        MAX(CASE WHEN bs.end_dt >= TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) AS BILLED_THIS_MONTH
    FROM ci_sp_char sp_char
    JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp_char.sp_id
    JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id AND sa.sa_type_cd = 'PPD'
    LEFT JOIN ci_bseg bs ON bs.sa_id = sa.sa_id AND bs.bseg_stat_flg <> '60'
    WHERE sp_char.char_type_cd = 'CM_LEGCY'
        AND sp_char.adhoc_char_val IN (SELECT CPC_CUSTOMER_NO FROM CPC_WITH_CRP)
    GROUP BY sp_char.adhoc_char_val, sa.sa_id, sa.sa_status_flg
),
BILL_STOP_CUSTOMERS AS (
    -- Filter to only bill stop issues
    SELECT
        CPC_CUSTOMER_NO,
        sa_id,
        sa_status_flg,
        LAST_BILL_DATE,
        BILLED_THIS_MONTH
    FROM SA_WITH_BILLING
    WHERE BILLED_THIS_MONTH = 0  -- Only bill stop issues
        AND ROWNUM <= NVL(:maxRows, 50000)  -- Safety limit
)
SELECT /*+ PARALLEL(4) */
    cpc.CRP_ACCOUNT_NO,
    bs.CPC_CUSTOMER_NO,
    COALESCE(per_name.entity_name, bs.CPC_CUSTOMER_NO) AS CUSTOMER_NAME,
    COALESCE(prem.address1 || ', ' || prem.address2, 'N/A') AS ADDRESS,
    COALESCE(nocs.descr, 'N/A') AS NOCS_NAME,
    COALESCE(contact.contact_value, 'N/A') AS PHONE_NO,
    'N/A' AS METER_NO,  -- Simplified - meter lookup is slow
    CASE
        WHEN bs.sa_status_flg = '20' THEN 'Active'
        WHEN bs.sa_status_flg = '30' THEN 'Pending Start'
        WHEN bs.sa_status_flg = '40' THEN 'Pending Stop'
        WHEN bs.sa_status_flg = '50' THEN 'Stopped'
        ELSE 'Unknown'
    END AS SA_STATUS_DESC,
    COALESCE(TO_CHAR(bs.LAST_BILL_DATE, 'DD-MON-YYYY'), 'Never Billed') AS LAST_BILL_DATE,
    'Bill Stop Issue' AS BILLING_STATUS,
    COALESCE(bal.PAYOFF_BAL, 0) AS CURRENT_BALANCE
FROM BILL_STOP_CUSTOMERS bs
JOIN CPC_WITH_CRP cpc ON cpc.CPC_CUSTOMER_NO = bs.CPC_CUSTOMER_NO
JOIN ci_sa sa ON sa.sa_id = bs.sa_id
LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
LEFT JOIN ci_acct_per acc_per ON acc_per.acct_id = acc.acct_id AND acc_per.main_cust_sw = 'Y'
LEFT JOIN ci_per per ON per.per_id = acc_per.per_id
LEFT JOIN ci_per_name per_name ON per_name.per_id = per.per_id
LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
LEFT JOIN ci_prem_char prem_char ON prem_char.prem_id = prem.prem_id AND prem_char.char_type_cd = 'CM_NOCS'
LEFT JOIN ci_char_val_l nocs ON nocs.char_val = prem_char.char_val AND nocs.char_type_cd = 'CM_NOCS'
LEFT JOIN c1_per_contdet contact ON contact.per_id = per.per_id
    AND contact.comm_rte_type_cd = 'CELLPHONE'
    AND contact.cnd_primary_flg = 'C1YS'
LEFT JOIN (
    SELECT sa_id, SUM(tot_amt) AS PAYOFF_BAL
    FROM ci_ft
    WHERE freeze_sw = 'Y'
    GROUP BY sa_id
) bal ON bal.sa_id = sa.sa_id
WHERE ROWNUM <= NVL(:maxRows, 50000)  -- Final safety limit
ORDER BY cpc.CRP_ACCOUNT_NO, bs.LAST_BILL_DATE NULLS FIRST
