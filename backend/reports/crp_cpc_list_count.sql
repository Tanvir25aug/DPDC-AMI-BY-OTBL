-- CRP-CPC List Total Count - Optimized
-- Get total count for pagination
-- Parameters: :search (optional)

SELECT COUNT(DISTINCT cpr_ref.adhoc_char_val) AS total
FROM d1_sp_char cpr_ref
WHERE cpr_ref.char_type_cd = 'CM_CPRLA'
    AND (:search IS NULL OR UPPER(cpr_ref.adhoc_char_val) LIKE UPPER('%' || :search || '%'))
