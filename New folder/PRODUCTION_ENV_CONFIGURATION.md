# Production Environment Configuration Guide

## Recent Changes (Dec 10, 2025)

### 1. Fixed Circular JSON Error in Logger
**Problem:** Logger was crashing when trying to log error objects with circular references (e.g., TLSSocket objects).

**Solution:** Updated `backend/src/config/logger.js` to safely stringify objects with circular references using WeakSet.

**Files Modified:**
- `backend/src/config/logger.js` - Added `safeStringify()` function
- `backend/src/schedulers/teams-reports.scheduler.js` - Updated error logging to use `error.message` instead of full error object

---

### 2. Telegram Bot - Development Only

**Problem:** Telegram bot was running in production, but it's only needed for development/testing.

**Solution:** Made Telegram bot initialization conditional based on environment variable.

**Configuration:**

#### For Production (Disable Telegram):
```bash
# In production .env file
ENABLE_TELEGRAM=false
```

#### For Development (Enable Telegram):
```bash
# In .env.development file
ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

**Files Modified:**
- `backend/src/server.js` - Telegram initialization now checks `ENABLE_TELEGRAM` env variable
- `backend/.env.example` - Added `ENABLE_TELEGRAM=false` documentation
- `backend/.env.development` - Added `ENABLE_TELEGRAM=true` for development

---

## Production Deployment Checklist

### Environment Variables for Production

Create/update your production `.env` file with these settings:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000

# PostgreSQL (Production Database)
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=5432
POSTGRES_DB=dpdc_ami_production
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password

# Oracle Database (Read Only)
DB_USER=cisread
DB_PASSWORD=your_oracle_password
DB_HOST=your_oracle_host
DB_PORT=1521
DB_SERVICE_NAME=your_service_name
DB_CONNECT_STRING=host:port/service

# JWT Configuration
JWT_SECRET=your_production_jwt_secret_change_this
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_production_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=10

# Telegram Bot (DISABLED IN PRODUCTION)
ENABLE_TELEGRAM=false
# TELEGRAM_BOT_TOKEN is not needed if disabled
```

---

## Testing the Changes

### 1. Test Circular JSON Fix

Start the backend and check logs for any circular reference errors. The errors should now be logged properly without crashing.

### 2. Test Telegram Bot Configuration

**Production (Telegram Disabled):**
```bash
# Set environment variable
ENABLE_TELEGRAM=false

# Start backend
npm start

# Check logs - should see:
# ℹ️  Telegram Bot disabled (set ENABLE_TELEGRAM=true to enable)
```

**Development (Telegram Enabled):**
```bash
# Set environment variable
ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=your_bot_token

# Start backend
npm start

# Check logs - should see:
# ✅ Telegram Bot initialized and ready at @DPDC_customerInfo_bot
```

---

## Verification Steps

1. ✅ **Logger Fixed** - No more "Converting circular structure to JSON" errors
2. ✅ **Telegram Disabled in Production** - Set `ENABLE_TELEGRAM=false` in production .env
3. ✅ **Telegram Enabled in Development** - Set `ENABLE_TELEGRAM=true` in development
4. ✅ **All Other Features Working** - NOCS Balance Summary, Teams Reports, etc.

---

## Quick Deployment Commands

```bash
# 1. Pull latest changes from Git
git pull origin main

# 2. Navigate to backend
cd backend

# 3. Install dependencies (if any new ones)
npm install

# 4. Verify production .env has ENABLE_TELEGRAM=false
cat .env | grep ENABLE_TELEGRAM

# 5. Restart the backend using PM2
pm2 restart dpdc-backend

# 6. Check logs
pm2 logs dpdc-backend --lines 50
```

---

## Important Notes

⚠️ **TELEGRAM BOT TOKEN**: The Telegram bot token in `.env.development` is for the bot `@DPDC_customerInfo_bot`. This token should NEVER be committed to Git. It's only included in the local development file.

✅ **PRODUCTION SAFETY**: In production, Telegram bot is completely disabled to avoid unnecessary connections and potential security issues.

✅ **BACKWARD COMPATIBLE**: If `ENABLE_TELEGRAM` is not set in .env, it defaults to disabled (false).

---

## Troubleshooting

### Issue: Backend crashes with circular JSON error
**Solution:** Make sure you've pulled the latest changes with the logger fix.

### Issue: Telegram bot still running in production
**Solution:** Check your production `.env` file and ensure `ENABLE_TELEGRAM=false` is set, then restart the backend.

### Issue: Telegram bot not working in development
**Solution:**
1. Check `.env.development` has `ENABLE_TELEGRAM=true`
2. Verify `TELEGRAM_BOT_TOKEN` is set correctly
3. Check logs for initialization messages

---

**Last Updated:** December 10, 2025
**Applied to:** Production Server
