#!/bin/bash
# Quick Deployment Script - Run on Production Server
# Copy this entire script and paste into your SSH session

set -e
cd ~/DPDC-AMI-BY-OTBL

echo "🔄 Starting deployment..."

# Backup
echo "📦 Creating backup..."
cp -r ~/DPDC-AMI-BY-OTBL ~/DPDC-backup-$(date +%Y%m%d-%H%M%S)

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install

# Setup database
echo "🗄️ Setting up database..."
node SETUP_MONITORING_TABLE.js

# Restart server
echo "🔄 Restarting server..."
pm2 restart dpdc-ami-backend || pm2 restart all

# Show status
echo "✅ Deployment complete!"
pm2 status
pm2 logs dpdc-ami-backend --lines 20
