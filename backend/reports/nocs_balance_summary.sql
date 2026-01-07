-- NOCS Balance Summary - Most Inclusive Query
-- Purpose: Calculate NOCS balance summary from Oracle database
-- Data Source: Oracle CC&B tables (READ ONLY - no writes to database)
-- Cached in: PostgreSQL (refreshed hourly)
--
-- IMPORTANT - Oracle CC&B Logic (CORRECTED after testing):
--   Positive TOT_AMT (+) = Customer has CREDIT (advance payment) ✅
--   Negative TOT_AMT (-) = Customer has DUE (owes money to DPDC) ❌
--
-- Includes: ALL active accounts with NOCS (no restrictive filters)
-- Performance: 5-10 minutes (runs hourly in background)
-- User Experience: Instant (serves from PostgreSQL cache)

SELECT /*+ PARALLEL(4) */
    nocs_balances.NOCS_NAME,
    nocs_balances.NOCS_CODE,
    COUNT(DISTINCT nocs_balances.acct_id) AS TOTAL_CUSTOMERS,
    -- CREDIT: Positive TOT_AMT means customer has advance payment
    COUNT(CASE WHEN nocs_balances.total_balance > 0 THEN 1 END) AS CREDIT_QTY,
    SUM(CASE WHEN nocs_balances.total_balance > 0 THEN nocs_balances.total_balance ELSE 0 END) AS CREDIT_BALANCE_AMT,
    -- DUE: Negative TOT_AMT means customer owes money
    COUNT(CASE WHEN nocs_balances.total_balance < 0 THEN 1 END) AS DUE_QTY,
    SUM(CASE WHEN nocs_balances.total_balance < 0 THEN ABS(nocs_balances.total_balance) ELSE 0 END) AS DUE_BALANCE_AMT,
    -- NET: Positive = overall credit, Negative = overall due
    SUM(nocs_balances.total_balance) AS NET_BALANCE
FROM (
    -- Pre-aggregate: Calculate balance per account with NOCS info
    -- FIXED: Now matches nocs_customer_payoff logic - ACTIVE PREPAID accounts only
    SELECT /*+ PARALLEL(a,4) PARALLEL(b,4) PARALLEL(j,4) PARALLEL(pc,4) PARALLEL(vl,4) */
        a.acct_id,
        vl.descr AS NOCS_NAME,
        vl.char_val AS NOCS_CODE,
        SUM(COALESCE(j.TOT_AMT, 0)) AS total_balance
    FROM ci_acct a
    -- FIXED: INNER JOIN for active prepaid accounts only (was LEFT JOIN)
    INNER JOIN ci_sa b ON a.acct_id = b.acct_id
        AND b.sa_status_flg = '20'  -- ACTIVE accounts only
        AND b.sa_type_cd = 'PPD'    -- PREPAID accounts only
    -- Get financial transactions (LEFT JOIN to include accounts with zero balance)
    LEFT JOIN ci_ft j ON j.sa_id = b.sa_id
        AND j.freeze_sw = 'Y'
    -- Get NOCS code from premise (INNER JOIN - account must have NOCS)
    INNER JOIN ci_prem_char pc ON pc.prem_id = a.mailing_prem_id
        AND pc.char_type_cd = 'CM_NOCS'
    -- Get NOCS name/description (INNER JOIN - NOCS must have name)
    INNER JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
        AND vl.char_type_cd = 'CM_NOCS'
    WHERE vl.descr IS NOT NULL
    GROUP BY a.acct_id, vl.descr, vl.char_val
) nocs_balances
GROUP BY nocs_balances.NOCS_NAME, nocs_balances.NOCS_CODE
ORDER BY nocs_balances.NOCS_NAME ASC
