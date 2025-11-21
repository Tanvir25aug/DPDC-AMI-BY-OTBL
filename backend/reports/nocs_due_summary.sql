-- Get NOCS-wise due summary with corrected due/credit logic
-- Parameter: :nocsName
-- Logic: Payoff Balance = SUM(TOT_AMT) * (-1)
--   If Payoff Balance < 0: Customer has DUE (owes money)
--   If Payoff Balance > 0: Customer has CREDIT (advance payment)

SELECT
    account_balances.descr AS NOCS_NAME,
    COUNT(DISTINCT account_balances.acct_id) AS TOTAL_ACCOUNTS,
    COUNT(DISTINCT CASE WHEN account_balances.total_balance < 0 THEN account_balances.acct_id END) AS ACCOUNTS_WITH_DUE,
    COUNT(DISTINCT CASE WHEN account_balances.total_balance > 0 THEN account_balances.acct_id END) AS ACCOUNTS_WITH_CREDIT,
    COUNT(DISTINCT CASE WHEN account_balances.total_balance = 0 THEN account_balances.acct_id END) AS ACCOUNTS_ZERO_BALANCE,
    SUM(CASE WHEN account_balances.total_balance < 0 THEN ABS(account_balances.total_balance) ELSE 0 END) AS TOTAL_DUE,
    SUM(CASE WHEN account_balances.total_balance > 0 THEN account_balances.total_balance ELSE 0 END) AS TOTAL_CREDIT,
    SUM(account_balances.total_balance) AS NET_BALANCE,
    AVG(CASE WHEN account_balances.total_balance < 0 THEN ABS(account_balances.total_balance) END) AS AVG_DUE_PER_ACCOUNT,
    MAX(CASE WHEN account_balances.total_balance < 0 THEN ABS(account_balances.total_balance) END) AS MAX_DUE,
    MAX(CASE WHEN account_balances.total_balance > 0 THEN account_balances.total_balance END) AS MAX_CREDIT
FROM (
    SELECT
        a.acct_id,
        vl.descr,
        SUM(j.TOT_AMT) * (-1) AS total_balance
    FROM ci_acct a
    INNER JOIN ci_acct_char xy ON a.acct_id = xy.acct_id
        AND xy.char_type_cd = 'CM_MTDIS'
        AND xy.CHAR_VAL = 'Y'
    INNER JOIN ci_sa b ON a.acct_id = b.acct_id
        AND b.sa_type_cd = 'PPD'
        AND b.sa_status_flg = '20'
    INNER JOIN ci_ft j ON j.sa_id = b.sa_id
    INNER JOIN ci_prem_char pc ON pc.prem_id = a.mailing_prem_id
        AND pc.char_type_cd = 'CM_NOCS'
    INNER JOIN ci_char_val_l vl ON vl.char_val = pc.char_val
    WHERE vl.descr = :nocsName
    GROUP BY a.acct_id, vl.descr
) account_balances
GROUP BY account_balances.descr
