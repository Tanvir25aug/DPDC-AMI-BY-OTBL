-- DIAGNOSTIC: Check alternative paths to get NOCS
-- NOCS might be stored in different tables

WITH CPC_SAMPLE AS (
    SELECT DISTINCT
        cpc_cust.adhoc_char_val AS CPC_CUSTOMER_NO,
        cpc_cust.d1_sp_id
    FROM d1_sp_char cpc_cust
    WHERE cpc_cust.char_type_cd = 'CM_LEGCY'
        AND ROWNUM <= 10  -- Small sample
)
SELECT
    cpc.CPC_CUSTOMER_NO,

    -- Path 1: Through D1 Service Point (d1_sp_char)
    d1_nocs.adhoc_char_val AS NOCS_FROM_D1_SP,

    -- Path 2: Through CI Service Point characteristics
    ci_sp_nocs.char_val AS NOCS_FROM_CI_SP_CHAR,

    -- Path 3: Through Account Premise (current path)
    prem_nocs.char_val AS NOCS_FROM_PREM,

    -- Path 4: Through Service Point premise (sp.prem_id instead of acc.mailing_prem_id)
    sp_prem_nocs.char_val AS NOCS_FROM_SP_PREM

FROM CPC_SAMPLE cpc

-- Path 1: Check if NOCS is stored in d1_sp_char
LEFT JOIN d1_sp_char d1_nocs ON d1_nocs.d1_sp_id = cpc.d1_sp_id
    AND d1_nocs.char_type_cd = 'CM_NOCS'

-- Path 2: Through CI Service Point
LEFT JOIN ci_sp_char sp_char ON sp_char.adhoc_char_val = cpc.CPC_CUSTOMER_NO
    AND sp_char.char_type_cd = 'CM_LEGCY'
LEFT JOIN ci_sp sp ON sp.sp_id = sp_char.sp_id
LEFT JOIN ci_sp_char ci_sp_nocs ON ci_sp_nocs.sp_id = sp.sp_id
    AND ci_sp_nocs.char_type_cd = 'CM_NOCS'

-- Path 3: Current path (through account mailing premise)
LEFT JOIN ci_sa_sp sa_sp ON sa_sp.sp_id = sp.sp_id
LEFT JOIN ci_sa sa ON sa.sa_id = sa_sp.sa_id
    AND sa.sa_type_cd = 'PPD'
LEFT JOIN ci_acct acc ON acc.acct_id = sa.acct_id
LEFT JOIN ci_prem prem ON prem.prem_id = acc.mailing_prem_id
LEFT JOIN ci_prem_char prem_nocs ON prem_nocs.prem_id = prem.prem_id
    AND prem_nocs.char_type_cd = 'CM_NOCS'

-- Path 4: Through service point premise directly
LEFT JOIN ci_prem sp_prem ON sp_prem.prem_id = sp.prem_id
LEFT JOIN ci_prem_char sp_prem_nocs ON sp_prem_nocs.prem_id = sp_prem.prem_id
    AND sp_prem_nocs.char_type_cd = 'CM_NOCS'
