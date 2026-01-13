-- CRP-CPC List - Filtered by Specific CRP Accounts
-- Get CRP details for specific account numbers (after filtering in PostgreSQL)
-- Parameters: :crp_accounts (comma-separated list of CRP account numbers)

SELECT
    crp.CPR_CUSTOMER_ID AS CRP_ID,
    crp.CPR_CUSTOMER_ID AS CRP_ACCOUNT_NO,
    COUNT(DISTINCT cpc_cust.adhoc_char_val) AS TOTAL_CPC_COUNT,
    0 AS BILLED_THIS_MONTH,
    0 AS NOT_BILLED_THIS_MONTH
FROM (
    -- Parse comma-separated CRP accounts
    SELECT DISTINCT
        TRIM(REGEXP_SUBSTR(:crp_accounts, '[^,]+', 1, LEVEL)) AS CPR_CUSTOMER_ID
    FROM DUAL
    CONNECT BY LEVEL <= REGEXP_COUNT(:crp_accounts, ',') + 1
) crp
LEFT JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
    AND cpr_ref.char_type_cd = 'CM_CPRLA'
LEFT JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
    AND cpc_cust.char_type_cd = 'CM_LEGCY'
GROUP BY crp.CPR_CUSTOMER_ID
ORDER BY crp.CPR_CUSTOMER_ID
