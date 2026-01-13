-- CRP-CPC List Total Count - Optimized
-- Get total count for pagination
-- Parameters: :search (optional)
-- Search works with both CRP Account ID and CPC Customer ID

SELECT COUNT(DISTINCT cpr_ref.adhoc_char_val) AS total
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
