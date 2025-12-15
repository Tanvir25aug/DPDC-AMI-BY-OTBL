# Telegram Bot Troubleshooting Guide

## Issue: Telegram Bot Not Working in Production

The Telegram bot requires **BOTH** conditions to be true:
1. `NODE_ENV=production`
2. `ENABLE_TELEGRAM=true`

---

## Step 1: Check Production Server Environment

### Connect to Production Server
```bash
ssh username@172.18.42.200
```

### Navigate to Backend Directory
```bash
cd /opt/dpdc-ami/backend
# Or wherever your backend is deployed
```

### Check Current Environment Variables
```bash
# Check NODE_ENV
node -e "require('dotenv').config(); console.log('NODE_ENV:', process.env.NODE_ENV)"

# Check ENABLE_TELEGRAM
node -e "require('dotenv').config(); console.log('ENABLE_TELEGRAM:', process.env.ENABLE_TELEGRAM)"

# Check TELEGRAM_BOT_TOKEN
node -e "require('dotenv').config(); console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET')"

# Or check all at once
cat .env | grep -E 'NODE_ENV|ENABLE_TELEGRAM|TELEGRAM_BOT_TOKEN'
```

---

## Step 2: Fix Production .env File

### Edit the .env file on production server
```bash
cd /opt/dpdc-ami/backend
nano .env
```

### Ensure these lines are present:
```bash
# Node Environment - MUST BE production
NODE_ENV=production

# Telegram Bot - MUST BE true
ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=8575870159:AAHupxIlKBLpBS_7PEY9t41qfeNLdl8tobk
```

**Important:**
- `NODE_ENV` must be exactly `production` (lowercase, no spaces)
- `ENABLE_TELEGRAM` must be exactly `true` (lowercase, no quotes)
- `TELEGRAM_BOT_TOKEN` must be the actual token (no quotes needed)

### Save the file
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

---

## Step 3: Restart the Server

### If using PM2:
```bash
pm2 restart all
# or
pm2 restart dpdc-ami

# Check status
pm2 status

# View logs
pm2 logs dpdc-ami --lines 50
```

### If using systemd:
```bash
sudo systemctl restart dpdc-ami
sudo systemctl status dpdc-ami
```

### If running manually:
```bash
# Stop current process (Ctrl+C)
# Then restart
npm start
```

---

## Step 4: Check Server Logs

### Look for Telegram initialization message:
```bash
# If using PM2
pm2 logs dpdc-ami | grep -i telegram

# If using systemd
sudo journalctl -u dpdc-ami -n 100 | grep -i telegram

# If logs are in file
tail -f /opt/dpdc-ami/backend/logs/app.log | grep -i telegram
```

### Expected Success Messages:
```
========================================
Initializing Telegram Bot...
✅ Telegram Bot initialized and ready at @DPDC_customerInfo_bot
========================================
```

### If You See This (Problem):
```
ℹ️  Telegram Bot disabled in development
```
**Solution:** `NODE_ENV` is not set to `production`

### If You See This (Problem):
```
ℹ️  Telegram Bot disabled (set ENABLE_TELEGRAM=true to enable)
```
**Solution:** `ENABLE_TELEGRAM` is not set to `true`

---

## Step 5: Test the Bot

### Test on Telegram:
1. Open Telegram app
2. Search for `@DPDC_customerInfo_bot`
3. Send `/start`
4. Bot should respond with welcome message

### If bot doesn't respond:
Check bot token is valid:
```bash
# Test bot token (replace with your token)
curl -X GET "https://api.telegram.org/bot8575870159:AAHupxIlKBLpBS_7PEY9t41qfeNLdl8tobk/getMe"
```

**Expected response:**
```json
{"ok":true,"result":{"id":8575870159,"is_bot":true,"first_name":"DPDC Customer Info",...}}
```

**If error:**
- Token is invalid or expired
- Get new token from @BotFather on Telegram

---

## Quick Fix Commands (Copy & Paste)

### On Production Server:

```bash
# 1. Navigate to backend
cd /opt/dpdc-ami/backend

# 2. Backup current .env
cp .env .env.backup

# 3. Update NODE_ENV
sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env

# 4. Update ENABLE_TELEGRAM
sed -i 's/ENABLE_TELEGRAM=.*/ENABLE_TELEGRAM=true/' .env

# 5. Verify changes
cat .env | grep -E 'NODE_ENV|ENABLE_TELEGRAM'

# 6. Restart with PM2
pm2 restart all

# 7. Check logs
pm2 logs --lines 30
```

---

## Common Issues

### Issue 1: "Telegram Bot disabled in development"
**Cause:** `NODE_ENV` is not `production`
**Fix:** Set `NODE_ENV=production` in `.env`

### Issue 2: "Telegram Bot disabled (set ENABLE_TELEGRAM=true)"
**Cause:** `ENABLE_TELEGRAM` is not `true`
**Fix:** Set `ENABLE_TELEGRAM=true` in `.env`

### Issue 3: Bot starts but doesn't respond
**Cause:** Invalid bot token
**Fix:**
1. Get new token from @BotFather
2. Update `TELEGRAM_BOT_TOKEN` in `.env`
3. Restart server

### Issue 4: Error "polling_error"
**Cause:** Another instance is running or webhook is set
**Fix:**
```bash
# Delete webhook
curl -X GET "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"

# Restart server
pm2 restart all
```

### Issue 5: Server crashes on startup
**Cause:** Syntax error or missing dependencies
**Fix:**
```bash
# Check logs
pm2 logs dpdc-ami --err

# Reinstall dependencies if needed
cd /opt/dpdc-ami/backend
npm install
pm2 restart all
```

---

## Verification Checklist

After making changes, verify:

- [ ] `NODE_ENV=production` in server's `.env` file
- [ ] `ENABLE_TELEGRAM=true` in server's `.env` file
- [ ] `TELEGRAM_BOT_TOKEN` is set with valid token
- [ ] Server restarted successfully
- [ ] Logs show "✅ Telegram Bot initialized"
- [ ] Bot responds to `/start` on Telegram
- [ ] Bot can fetch customer data

---

## Still Not Working?

### Check server logs for errors:
```bash
pm2 logs dpdc-ami --err --lines 100
```

### Check if process is running:
```bash
pm2 status
# or
ps aux | grep node
```

### Check network connectivity:
```bash
# Can server reach Telegram API?
ping api.telegram.org

# Test HTTPS connection
curl https://api.telegram.org
```

### Check database connections:
The bot needs both PostgreSQL and Oracle databases. Check if they're connected in the logs.

---

## Contact Support

If issue persists, provide:
1. Output of `cat .env | grep -E 'NODE_ENV|ENABLE_TELEGRAM'`
2. PM2 logs: `pm2 logs dpdc-ami --lines 50`
3. Error messages if any

---

**Last Updated:** December 14, 2025
