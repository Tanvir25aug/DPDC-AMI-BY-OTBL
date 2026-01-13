-- CRP-CPC List - Filtered by CRP Accounts AND Search Term
-- Get CRP details for specific account numbers with additional search filtering
-- Parameters: :crp_accounts (comma-separated CRP account numbers), :search (CRP or CPC search term)

WITH CRP_LIST AS (
    -- Parse comma-separated CRP accounts
    SELECT DISTINCT
        TRIM(REGEXP_SUBSTR(:crp_accounts, '[^,]+', 1, LEVEL)) AS CPR_CUSTOMER_ID
    FROM DUAL
    CONNECT BY LEVEL <= REGEXP_COUNT(:crp_accounts, ',') + 1
)
SELECT
    crp.CPR_CUSTOMER_ID AS CRP_ID,
    crp.CPR_CUSTOMER_ID AS CRP_ACCOUNT_NO,
    COUNT(DISTINCT cpc_cust.adhoc_char_val) AS TOTAL_CPC_COUNT,
    0 AS BILLED_THIS_MONTH,
    0 AS NOT_BILLED_THIS_MONTH
FROM CRP_LIST crp
LEFT JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
    AND cpr_ref.char_type_cd = 'CM_CPRLA'
LEFT JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
    AND cpc_cust.char_type_cd = 'CM_LEGCY'
WHERE (
    :search IS NULL
    OR UPPER(crp.CPR_CUSTOMER_ID) LIKE UPPER('%' || :search || '%')
    OR EXISTS (
        -- Also search by CPC customer ID within this CRP
        SELECT 1
        FROM d1_sp_char cpc_search
        WHERE cpc_search.d1_sp_id = cpr_ref.d1_sp_id
            AND cpc_search.char_type_cd = 'CM_LEGCY'
            AND UPPER(cpc_search.adhoc_char_val) LIKE UPPER('%' || :search || '%')
    )
)
GROUP BY crp.CPR_CUSTOMER_ID
ORDER BY crp.CPR_CUSTOMER_ID
