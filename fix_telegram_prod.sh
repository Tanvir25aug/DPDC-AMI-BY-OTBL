#!/bin/bash

# Quick Fix Script for Telegram Bot in Production
# Run this on your production server

echo "========================================="
echo "DPDC AMI - Telegram Bot Quick Fix"
echo "========================================="
echo ""

# Navigate to backend directory
cd /opt/dpdc-ami/backend || { echo "Error: Backend directory not found"; exit 1; }

echo "✓ Current directory: $(pwd)"
echo ""

# Backup current .env
echo "Creating backup of .env file..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"
echo ""

# Show current settings
echo "Current Configuration:"
echo "---------------------"
grep -E 'NODE_ENV|ENABLE_TELEGRAM|TELEGRAM_BOT_TOKEN' .env
echo ""

# Update NODE_ENV to production
echo "Updating NODE_ENV to production..."
if grep -q "^NODE_ENV=" .env; then
    sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' .env
else
    echo "NODE_ENV=production" >> .env
fi
echo "✓ NODE_ENV updated"

# Update ENABLE_TELEGRAM to true
echo "Enabling Telegram bot..."
if grep -q "^ENABLE_TELEGRAM=" .env; then
    sed -i 's/^ENABLE_TELEGRAM=.*/ENABLE_TELEGRAM=true/' .env
else
    echo "ENABLE_TELEGRAM=true" >> .env
fi
echo "✓ ENABLE_TELEGRAM updated"

# Check if TELEGRAM_BOT_TOKEN exists
if ! grep -q "^TELEGRAM_BOT_TOKEN=" .env; then
    echo ""
    echo "⚠️  WARNING: TELEGRAM_BOT_TOKEN not found!"
    echo "Please add it manually:"
    echo "TELEGRAM_BOT_TOKEN=your_bot_token_here"
    echo ""
fi

echo ""
echo "New Configuration:"
echo "-----------------"
grep -E 'NODE_ENV|ENABLE_TELEGRAM|TELEGRAM_BOT_TOKEN' .env
echo ""

# Restart PM2
echo "Restarting application with PM2..."
pm2 restart all

echo ""
echo "Waiting 5 seconds for server to start..."
sleep 5

echo ""
echo "Checking logs..."
echo "================"
pm2 logs --lines 20 --nostream | grep -A 5 -B 5 -i telegram

echo ""
echo "========================================="
echo "Done! Check the logs above for Telegram initialization."
echo ""
echo "Expected message:"
echo "✅ Telegram Bot initialized and ready at @DPDC_customerInfo_bot"
echo ""
echo "If you don't see it, check full logs with:"
echo "pm2 logs dpdc-ami --lines 50"
echo "========================================="
