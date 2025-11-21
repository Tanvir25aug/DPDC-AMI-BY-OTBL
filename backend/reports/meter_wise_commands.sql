select
    vl.descr NOCS_NAME,
    i.id_value MSN,
    f.srch_char_val OLD_CONSUMER_ID,
    l.BUS_OBJ_CD COMMAND_TYPE,
    l.BO_STATUS_CD COMMAND_STATUS,
    To_CHAR(L.START_DTTM,'DD-MM-YYYY HH:MI:SS') DATE_OF_COMMAND_TRIGGER,
    sum(j.TOT_AMT) * (-1) PAYOFF_BALNCE
from ci_acct a
inner join ci_acct_char xy on a.acct_id=xy.acct_id and xy.char_type_cd='CM_MTDIS' AND xy.CHAR_VAL ='Y'
inner join ci_sa b on a.acct_id=b.acct_id and sa_type_cd='PPD' and sa_status_flg='20'
inner join ci_sa_sp c on c.sa_id=b.sa_id
inner join ci_ft j on j.sa_id=b.sa_id
inner join ci_sp d on d.sp_id = c.sp_id
inner join ci_sp_char e on e.sp_id=d.sp_id and e.char_type_cd='CM_LEGCY'
inner join d1_sp_char f on f.srch_char_val=e.srch_char_val and f.char_type_cd='CM_LEGCY'
inner join d1_install_evt g on g.d1_sp_id=f.d1_sp_id and g.d1_removal_dttm is null
inner join d1_dvc_cfg h on h.DEVICE_CONFIG_ID=g.DEVICE_CONFIG_ID
inner join d1_dvc_identifier i on i.D1_DEVICE_ID=h.D1_DEVICE_ID
inner join D1_ACTIVITY_REL_OBJ k on k.PK_VALUE1=h.D1_DEVICE_ID and k.MAINT_OBJ_CD='D1-DEVICE'
inner join ci_prem_char pc on pc.prem_id=a.mailing_prem_id and pc.char_type_cd = 'CM_NOCS'
inner join ci_char_val_l vl on vl.char_val=pc.char_val
inner join d1_activity partition(p2025NOV) l on l.D1_ACTIVITY_ID=k.D1_ACTIVITY_ID and l.activity_type_cd in ('REMOTEDISCONNECT','REMOTECONNECT')
where trunc(l.cre_dttm) = trunc(SYSDATE)
and l.BUS_OBJ_CD in ('D1-RemoteConnect', 'D1-RemoteDisconnect')
and l.BO_STATUS_CD in ('COMPLETED', 'COMINPROG', 'DISCARDED')
group by i.id_value, f.srch_char_val, a.acct_id, b.sa_id, l.BUS_OBJ_CD, l.ACTIVITY_TYPE_CD,
         l.start_dttm, l.END_DTTM, l.BO_STATUS_CD, l.d1_activity_id, vl.descr
order by l.start_dttm desc
