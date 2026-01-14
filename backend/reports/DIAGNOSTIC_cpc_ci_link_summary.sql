-- Summary: How many CPC customers are linked vs not linked to CI system
-- This explains the "Unknown/No NOCS" issue

WITH CPC_ALL AS (
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO
    FROM d1_sp_char cpc_cust
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
),
CPC_CI_STATUS AS (
    SELECT
        cpc.CPC_CUSTOMER_NO,
        CASE
            WHEN sp_char.sp_id IS NOT NULL THEN 'LINKED TO CI'
            ELSE 'NOT LINKED TO CI'
        END AS LINK_STATUS
    FROM CPC_ALL cpc
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc.CPC_CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
)
SELECT
    LINK_STATUS,
    COUNT(*) AS CPC_COUNT,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS PERCENTAGE
FROM CPC_CI_STATUS
GROUP BY LINK_STATUS
ORDER BY CPC_COUNT DESC
