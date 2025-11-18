-- Get NOCS-wise due summary with both positive (due) and negative (credit) balances
-- Parameter: :nocsName

SELECT
    :nocsName AS NOCS_NAME,
    COUNT(DISTINCT a.acct_id) AS TOTAL_ACCOUNTS,
    COUNT(DISTINCT CASE WHEN total_balance > 0 THEN a.acct_id END) AS ACCOUNTS_WITH_DUE,
    COUNT(DISTINCT CASE WHEN total_balance < 0 THEN a.acct_id END) AS ACCOUNTS_WITH_CREDIT,
    COUNT(DISTINCT CASE WHEN total_balance = 0 THEN a.acct_id END) AS ACCOUNTS_ZERO_BALANCE,
    SUM(CASE WHEN total_balance > 0 THEN total_balance ELSE 0 END) AS TOTAL_DUE,
    SUM(CASE WHEN total_balance < 0 THEN total_balance ELSE 0 END) AS TOTAL_CREDIT,
    SUM(total_balance) AS NET_BALANCE,
    AVG(CASE WHEN total_balance > 0 THEN total_balance END) AS AVG_DUE_PER_ACCOUNT,
    MAX(CASE WHEN total_balance > 0 THEN total_balance END) AS MAX_DUE,
    MIN(CASE WHEN total_balance < 0 THEN total_balance END) AS MAX_CREDIT
FROM (
    SELECT
        a.acct_id,
        SUM(ft.tot_amt) AS total_balance
    FROM
        ci_acct a
        INNER JOIN ci_acct_char xy ON a.acct_id = xy.acct_id
        INNER JOIN ci_sa b ON a.acct_id = b.acct_id
        INNER JOIN ci_sa_sp c ON b.sa_id = c.sa_id
        INNER JOIN ci_sp d ON c.sp_id = d.sp_id
        INNER JOIN ci_sp_char e ON d.sp_id = e.sp_id
        INNER JOIN d1_sp_char f ON e.adhoc_char_val = f.adhoc_char_val
        INNER JOIN d1_sp s2 ON f.d1_sp_id = s2.d1_sp_id
        INNER JOIN d1_sp_identifier s3 ON s2.d1_sp_id = s3.d1_sp_id
        INNER JOIN CI_PREM_CHAR p ON s3.ID_VALUE = p.PREM_ID
        INNER JOIN ci_char_val_l l ON p.char_val = l.char_val
        INNER JOIN ci_ft ft ON b.sa_id = ft.sa_id
    WHERE
        xy.char_type_cd = 'CM_MTDIS'
        AND xy.CHAR_VAL = 'Y'
        AND b.sa_type_cd = 'PPD'
        AND b.sa_status_flg = '20'
        AND e.char_type_cd = 'CM_LEGCY'
        AND f.char_type_cd = 'CM_LEGCY'
        AND s3.SP_ID_TYPE_FLG = 'D1EP'
        AND p.char_type_cd = 'CM_NOCS'
        AND l.descr = :nocsName
    GROUP BY
        a.acct_id
) account_balances
GROUP BY
    :nocsName
