# Quick Production Deployment - NOCS Balance Summary

## 🚀 Fast Track (5 Minutes)

### 1. Backup Database
```bash
pg_dump -U dpdc_user -d dpdc_ami_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Pull & Install
```bash
cd /path/to/DPDC-AMI-BY-OTBL
git pull origin main
cd backend
npm install
```

### 3. Run Migrations
```bash
cd backend
npx sequelize-cli db:migrate
```

Expected output:
```
== 20250201000003-create-nocs-balance-summary: migrating =======
== 20250201000003-create-nocs-balance-summary: migrated (0.123s)
== 20250201000004-rename-balance-columns: migrating =======
== 20250201000004-rename-balance-columns: migrated (0.045s)
```

### 4. Restart Backend
```bash
# Using PM2:
pm2 restart dpdc-ami-backend
pm2 logs dpdc-ami-backend --lines 50

# Using systemd:
sudo systemctl restart dpdc-ami-backend
sudo journalctl -u dpdc-ami-backend -f

# Using Docker:
docker-compose restart backend
docker-compose logs -f backend
```

### 5. Verify
```bash
# Check table exists:
psql -U dpdc_user -d dpdc_ami_db -c "\d nocs_balance_summary"

# Wait 5-10 minutes for initial data load, then check:
psql -U dpdc_user -d dpdc_ami_db -c "SELECT COUNT(*) FROM nocs_balance_summary;"
# Expected: 17 rows

# Test API:
curl http://localhost:3000/api/reports/nocs_balance_summary
```

---

## 📋 What These Migrations Do

1. **Migration 1**: Creates `nocs_balance_summary` table with 12 columns
2. **Migration 2**: Renames columns (positive→credit, negative→due)

---

## ⚠️ Important Notes

- **Initial Load**: First refresh takes 5-10 minutes (230K+ customers)
- **Hourly Updates**: Automatic refresh every 60 minutes
- **Zero Downtime**: Migrations don't affect existing features
- **Rollback**: Easy to reverse if needed

---

## 🔧 Troubleshooting

**No data after 10 min?**
```bash
# Check scheduler logs:
pm2 logs dpdc-ami-backend | grep "NOCS Balance"

# Look for:
# ✅ "[NOCS Balance Scheduler] Starting NOCS Balance Scheduler"
# ✅ "[NOCS Balance Scheduler] Scheduler started successfully"
# ✅ "[NOCS Balance Scheduler] Oracle query completed"
```

**Migration failed?**
```bash
# Check status:
npx sequelize-cli db:migrate:status

# Rollback and retry:
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate
```

**Need to rollback?**
```bash
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate:undo
pm2 restart dpdc-ami-backend
```

---

## ✅ Success Indicators

- [ ] Migrations show "migrated" status
- [ ] Backend logs show scheduler started
- [ ] Table has 17 NOCS rows after 10 min
- [ ] API returns data: `GET /api/reports/nocs_balance_summary`
- [ ] Frontend shows chart and table

---

## 📞 Need Help?

See full guide: `PRODUCTION_DB_SETUP.md`
