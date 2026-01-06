-- Get summary statistics for NOCS Customer Payoff (FAST - NO DETAIL DATA)
-- Parameter: :nocs_code (required)
-- Returns: Aggregated statistics only (total customers, credit/due breakdown)

WITH nocs_customers AS (
    -- Start with NOCS filtering for early dataset reduction
    SELECT /*+ INDEX(prem_nocs CI_PREM_CHAR_PK) */
        sa.sa_id AS SA_ID
    FROM ci_prem_char prem_nocs
    INNER JOIN ci_prem prem ON prem.prem_id = prem_nocs.prem_id
    INNER JOIN ci_acct acc ON acc.mailing_prem_id = prem.prem_id
    INNER JOIN ci_sa sa ON sa.acct_id = acc.acct_id
        AND sa.sa_status_flg = '20'
        AND sa.sa_type_cd = 'PPD'
    WHERE prem_nocs.char_type_cd = 'CM_NOCS'
        AND TRIM(prem_nocs.char_val) = TRIM(:nocs_code)
),
-- Pre-aggregate financial transactions
customer_balances AS (
    SELECT
        ROUND(COALESCE(SUM(ft.TOT_AMT), 0), 2) AS PAYOFF_BALANCE
    FROM nocs_customers nc
    LEFT JOIN ci_ft ft ON ft.sa_id = nc.SA_ID
        AND ft.FREEZE_SW = 'Y'
    GROUP BY nc.SA_ID
)
-- Calculate summary statistics
SELECT
    COUNT(*) AS TOTAL_CUSTOMERS,
    SUM(CASE WHEN PAYOFF_BALANCE * -1 > 0 THEN 1 ELSE 0 END) AS CREDIT_QTY,
    SUM(CASE WHEN PAYOFF_BALANCE * -1 > 0 THEN PAYOFF_BALANCE * -1 ELSE 0 END) AS CREDIT_BALANCE,
    SUM(CASE WHEN PAYOFF_BALANCE * -1 < 0 THEN 1 ELSE 0 END) AS DUE_QTY,
    SUM(CASE WHEN PAYOFF_BALANCE * -1 < 0 THEN PAYOFF_BALANCE * -1 ELSE 0 END) AS DUE_BALANCE,
    SUM(PAYOFF_BALANCE * -1) AS NET_BALANCE
FROM customer_balances
