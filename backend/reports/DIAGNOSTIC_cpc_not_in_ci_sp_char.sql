-- Find CPC customers where customer number is NOT found in ci_sp_char
-- These customers cannot be linked to CI system tables (sp, sa, account, premise)
-- This is why they show as "Unknown/No NOCS"

WITH CPC_ALL AS (
    -- Get all unique CPC customers from D1
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO,
        cpc_cust.d1_sp_id
    FROM d1_sp_char cpc_cust
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
),
CPC_WITH_METER AS (
    -- Get meter numbers for these CPC customers
    SELECT
        cpc.CPC_CUSTOMER_NO,
        cpc.d1_sp_id,
        MAX(mtr.id_value) AS METER_NO
    FROM CPC_ALL cpc
    LEFT JOIN d1_install_evt evt ON evt.d1_sp_id = cpc.d1_sp_id
        AND evt.d1_removal_dttm IS NULL
    LEFT JOIN d1_dvc_cfg cfg ON cfg.device_config_id = evt.device_config_id
    LEFT JOIN d1_dvc_identifier mtr ON mtr.d1_device_id = cfg.d1_device_id
        AND mtr.dvc_id_type_flg = 'D1SN'
        AND LENGTH(mtr.id_value) = 8
    GROUP BY cpc.CPC_CUSTOMER_NO, cpc.d1_sp_id
),
CPC_NOT_IN_CI AS (
    -- Find CPC customers NOT found in ci_sp_char
    SELECT
        cpc.CPC_CUSTOMER_NO,
        cpc.d1_sp_id,
        cpc.METER_NO,
        CASE WHEN sp_char.sp_id IS NULL THEN 'NOT FOUND' ELSE 'FOUND' END AS CI_STATUS
    FROM CPC_WITH_METER cpc
    LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc.CPC_CUSTOMER_NO
        AND sp_char.char_type_cd = 'CM_LEGCY'
    WHERE sp_char.sp_id IS NULL  -- Only those NOT found
)
SELECT
    CPC_CUSTOMER_NO,
    COALESCE(METER_NO, 'No Meter') AS METER_NO,
    CI_STATUS
FROM CPC_NOT_IN_CI
ORDER BY CPC_CUSTOMER_NO

-- Summary Count
-- SELECT COUNT(*) AS TOTAL_CPC_NOT_IN_CI FROM CPC_NOT_IN_CI
