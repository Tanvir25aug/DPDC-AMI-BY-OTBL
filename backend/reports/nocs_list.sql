-- Get list of all NOCS names
SELECT DISTINCT
    l.char_val AS NOCS_CODE,
    l.descr AS NOCS_NAME
FROM
    ci_char_val_l l
WHERE
    l.char_type_cd = 'CM_NOCS'
    AND l.descr IS NOT NULL
ORDER BY
    l.descr ASC
