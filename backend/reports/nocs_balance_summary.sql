-- NOCS Balance Summary
-- Purpose: Calculate NOCS balance summary from Oracle database
-- Data Source: Oracle CC&B tables (READ ONLY - no writes to database)
-- Cached in: PostgreSQL (refreshed hourly via node-cron)
--
-- IMPORTANT - Oracle CC&B Logic (CORRECTED after testing):
--   Positive TOT_AMT (+) = Customer has CREDIT (advance payment) ✅
--   Negative TOT_AMT (-) = Customer has DUE (owes money to DPDC) ❌
--
-- Includes: ALL active PPD accounts with NOCS assignment
-- Performance: 10-20 minutes on loaded Oracle (runs in background, 30-min timeout)
-- User Experience: Instant (serves from PostgreSQL cache)
--
-- Optimization notes:
--   - COUNT(acct_id) not COUNT(DISTINCT acct_id): inner subquery already groups by acct_id
--     so each account appears exactly once per NOCS — DISTINCT is redundant and adds sort cost
--   - WHERE vl.descr IS NOT NULL removed: INNER JOIN on ci_char_val_l already guarantees it
--   - PARALLEL hints applied to all joined tables

SELECT /*+ PARALLEL(4) */
    nocs_balances.NOCS_NAME,
    nocs_balances.NOCS_CODE,
    COUNT(nocs_balances.acct_id)                                                          AS TOTAL_CUSTOMERS,
    -- CREDIT: Positive TOT_AMT means customer has advance payment
    COUNT(CASE WHEN nocs_balances.total_balance > 0 THEN 1 END)                          AS CREDIT_QTY,
    SUM(CASE WHEN nocs_balances.total_balance > 0 THEN nocs_balances.total_balance ELSE 0 END) AS CREDIT_BALANCE_AMT,
    -- DUE: Negative TOT_AMT means customer owes money
    COUNT(CASE WHEN nocs_balances.total_balance < 0 THEN 1 END)                          AS DUE_QTY,
    SUM(CASE WHEN nocs_balances.total_balance < 0 THEN ABS(nocs_balances.total_balance) ELSE 0 END) AS DUE_BALANCE_AMT,
    -- NET: Positive = overall credit, Negative = overall due
    SUM(nocs_balances.total_balance)                                                      AS NET_BALANCE
FROM (
    -- Pre-aggregate: one row per account with its NOCS and total balance
    SELECT /*+ PARALLEL(a,4) PARALLEL(b,4) PARALLEL(j,4) PARALLEL(pc,4) PARALLEL(vl,4) */
        a.acct_id,
        vl.descr     AS NOCS_NAME,
        vl.char_val  AS NOCS_CODE,
        SUM(COALESCE(j.TOT_AMT, 0)) AS total_balance
    FROM ci_acct a
    INNER JOIN ci_sa b ON a.acct_id = b.acct_id
        AND b.sa_status_flg = '20'   -- ACTIVE accounts only
        AND b.sa_type_cd   = 'PPD'   -- PREPAID accounts only
    LEFT JOIN ci_ft j ON j.sa_id = b.sa_id
        AND j.freeze_sw = 'Y'        -- Frozen (posted) transactions only
    INNER JOIN ci_prem_char pc ON pc.prem_id    = a.mailing_prem_id
        AND pc.char_type_cd = 'CM_NOCS'
    INNER JOIN ci_char_val_l vl ON vl.char_val  = pc.char_val
        AND vl.char_type_cd = 'CM_NOCS'
    GROUP BY a.acct_id, vl.descr, vl.char_val
) nocs_balances
GROUP BY nocs_balances.NOCS_NAME, nocs_balances.NOCS_CODE
ORDER BY nocs_balances.NOCS_NAME ASC
