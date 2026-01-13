-- CRP-CPC List - FAST VERSION (Without Billing Status)
-- Get list of CRP customers with their CPC count only
-- Billing status removed for performance - can be calculated on-demand
-- Parameters: :search (optional), :limit, :offset
-- Search works with both CRP Account ID and CPC Customer ID

WITH DISTINCT_CRP AS (
    SELECT /*+ INDEX(cpr_ref) */ DISTINCT
        cpr_ref.adhoc_char_val AS CPR_CUSTOMER_ID
    FROM d1_sp_char cpr_ref
    WHERE cpr_ref.char_type_cd = 'CM_CPRLA'
        AND (
            :search IS NULL
            OR UPPER(cpr_ref.adhoc_char_val) LIKE UPPER('%' || :search || '%')
            OR EXISTS (
                -- Also search by CPC customer ID
                SELECT 1
                FROM d1_sp_char cpc_search
                WHERE cpc_search.d1_sp_id = cpr_ref.d1_sp_id
                    AND cpc_search.char_type_cd = 'CM_LEGCY'
                    AND UPPER(cpc_search.adhoc_char_val) LIKE UPPER('%' || :search || '%')
            )
        )
    ORDER BY cpr_ref.adhoc_char_val
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
)
SELECT
    crp.CPR_CUSTOMER_ID AS CRP_ID,
    crp.CPR_CUSTOMER_ID AS CRP_ACCOUNT_NO,
    COUNT(DISTINCT cpc_cust.adhoc_char_val) AS TOTAL_CPC_COUNT,
    0 AS BILLED_THIS_MONTH,
    0 AS NOT_BILLED_THIS_MONTH
FROM DISTINCT_CRP crp
LEFT JOIN d1_sp_char cpr_ref ON cpr_ref.adhoc_char_val = crp.CPR_CUSTOMER_ID
    AND cpr_ref.char_type_cd = 'CM_CPRLA'
LEFT JOIN d1_sp_char cpc_cust ON cpc_cust.d1_sp_id = cpr_ref.d1_sp_id
    AND cpc_cust.char_type_cd = 'CM_LEGCY'
GROUP BY crp.CPR_CUSTOMER_ID
ORDER BY crp.CPR_CUSTOMER_ID
