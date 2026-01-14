-- Check if NOCS is stored in D1 tables instead of CI tables
-- If NOCS is in d1_sp_char, we should use that instead of going through CI path

-- Query 1: Check if NOCS exists in d1_sp_char
SELECT
    'NOCS in D1 Tables' AS SOURCE,
    COUNT(DISTINCT d1_sp_id) AS SP_WITH_NOCS,
    COUNT(DISTINCT adhoc_char_val) AS UNIQUE_NOCS_VALUES
FROM d1_sp_char
WHERE char_type_cd = 'CM_NOCS'

UNION ALL

-- Query 2: Sample NOCS values from d1_sp_char
SELECT
    'Sample Values' AS SOURCE,
    TO_NUMBER(NULL) AS SP_WITH_NOCS,
    TO_NUMBER(NULL) AS UNIQUE_NOCS_VALUES
FROM dual
WHERE 1=0

UNION ALL

SELECT DISTINCT
    adhoc_char_val AS SOURCE,
    TO_NUMBER(NULL) AS SP_WITH_NOCS,
    TO_NUMBER(NULL) AS UNIQUE_NOCS_VALUES
FROM d1_sp_char
WHERE char_type_cd = 'CM_NOCS'
    AND ROWNUM <= 10;

-- Query 3: Check if we can get NOCS descriptions
-- SELECT
--     nocs.adhoc_char_val AS NOCS_CODE,
--     nocs_desc.descr AS NOCS_NAME,
--     COUNT(DISTINCT nocs.d1_sp_id) AS SP_COUNT
-- FROM d1_sp_char nocs
-- LEFT JOIN ci_char_val_l nocs_desc ON nocs_desc.char_val = nocs.adhoc_char_val
--     AND nocs_desc.char_type_cd = 'CM_NOCS'
-- WHERE nocs.char_type_cd = 'CM_NOCS'
-- GROUP BY nocs.adhoc_char_val, nocs_desc.descr
-- ORDER BY SP_COUNT DESC;
