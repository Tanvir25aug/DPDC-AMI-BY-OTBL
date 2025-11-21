-- Get detailed customer information by meter number
-- Used for export enrichment
-- Parameter: :meter_no

SELECT DISTINCT
    s1.adhoc_char_val AS CUSTOMER_NO,
    l.descr AS NOCS,
    r1.id_value AS FEEDER,
    r2.descr100 AS FEEDER_DESCRIPTION,
    (p1.address1 || ', ' || p1.address2 || ', ' || p1.address3 || ', ' || p1.address4) AS ADDRESS,
    mob.contact_value AS PHONE_NO
FROM d1_dvc_identifier d2
INNER JOIN d1_dvc_cfg d1 ON d1.d1_device_id = d2.d1_device_id
INNER JOIN d1_install_evt e1 ON e1.device_config_id = d1.device_config_id
    AND e1.d1_removal_dttm IS NULL
INNER JOIN d1_sp_char s1 ON s1.d1_sp_id = e1.d1_sp_id
    AND s1.char_type_cd = 'CM_LEGCY'
INNER JOIN d1_sp s2 ON s2.d1_sp_id = s1.d1_sp_id
INNER JOIN d1_sp_identifier s3 ON s3.d1_sp_id = s2.d1_sp_id
    AND s3.sp_id_type_flg = 'D1EP'
INNER JOIN ci_prem_char p ON p.prem_id = s3.id_value
    AND p.char_type_cd = 'CM_NOCS'
INNER JOIN ci_char_val_l l ON l.char_val = p.char_val
INNER JOIN ci_prem p1 ON p1.prem_id = s3.id_value
INNER JOIN d1_sp_facility f2 ON f2.d1_sp_id = s1.d1_sp_id
INNER JOIN D1_FACILITY_IDENTIFIER f1 ON f1.facility_id = f2.facility_id
INNER JOIN d1_facility f3 ON f3.facility_id = f1.facility_id
    AND f3.bus_obj_cd = 'D1-Transformer'
INNER JOIN D1_NW_LOC n1 ON n1.facility_id = f1.facility_id
INNER JOIN D1_NW_NODE n2 ON n2.network_location_id = n1.network_location_id
INNER JOIN D1_FACILITY_IDENTIFIER r1 ON r1.facility_id = n2.network_node
INNER JOIN D1_FACILITY_L r2 ON r2.facility_id = r1.facility_id
LEFT JOIN d1_sp_identifier s4 ON s4.d1_sp_id = s2.d1_sp_id
    AND s4.sp_id_type_flg = 'D1EI'
LEFT JOIN ci_sp sp ON sp.sp_id = s4.id_value
LEFT JOIN ci_sa_sp sasp ON sasp.sp_id = sp.sp_id
LEFT JOIN ci_sa sa ON sa.sa_id = sasp.sa_id
    AND sa.sa_status_flg = '20'
LEFT JOIN ci_acct_per ap ON ap.acct_id = sa.acct_id
    AND ap.main_cust_sw = 'Y'
LEFT JOIN c1_per_contdet mob ON mob.per_id = ap.per_id
    AND mob.comm_rte_type_cd = 'CELLPHONE'
    AND mob.cnd_primary_flg = 'C1YS'
WHERE d2.id_value = :meter_no
  AND d2.dvc_id_type_flg = 'D1SN'
