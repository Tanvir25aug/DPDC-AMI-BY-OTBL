#!/bin/bash

# Script to update Nginx timeout configuration for DPDC AMI
# This script adds 5-minute timeout settings to nginx configuration

echo "=================================================="
echo "DPDC AMI - Nginx Timeout Configuration Updater"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    echo "   Usage: sudo bash update-nginx-timeout.sh"
    exit 1
fi

# Find nginx config file
echo "🔍 Looking for nginx configuration file..."

NGINX_CONFIG=""

# Common locations
CONFIG_LOCATIONS=(
    "/etc/nginx/sites-available/dpdc-ami"
    "/etc/nginx/sites-available/default"
    "/etc/nginx/conf.d/dpdc-ami.conf"
    "/etc/nginx/nginx.conf"
)

for config in "${CONFIG_LOCATIONS[@]}"; do
    if [ -f "$config" ]; then
        echo "   Found: $config"
        NGINX_CONFIG="$config"
        break
    fi
done

if [ -z "$NGINX_CONFIG" ]; then
    echo "❌ Could not find nginx configuration file"
    echo "   Please manually specify the location:"
    read -p "   Enter nginx config file path: " NGINX_CONFIG

    if [ ! -f "$NGINX_CONFIG" ]; then
        echo "❌ File not found: $NGINX_CONFIG"
        exit 1
    fi
fi

echo "✅ Using nginx config: $NGINX_CONFIG"
echo ""

# Backup original config
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup: $BACKUP_FILE"
cp "$NGINX_CONFIG" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully"
else
    echo "❌ Failed to create backup"
    exit 1
fi

echo ""
echo "⚠️  IMPORTANT: This script will add timeout settings to your nginx config"
echo "   The following timeouts will be set to 5 minutes (300 seconds):"
echo "   - proxy_connect_timeout"
echo "   - proxy_send_timeout"
echo "   - proxy_read_timeout"
echo ""
read -p "   Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled by user"
    exit 1
fi

# Check if timeout settings already exist
if grep -q "proxy_read_timeout.*300s" "$NGINX_CONFIG"; then
    echo "✅ Timeout settings already configured"
    echo "   Skipping configuration update"
else
    echo "📝 Adding timeout settings..."
    echo ""
    echo "   Please manually add these lines to your location /api/ block:"
    echo ""
    echo "   location /api/ {"
    echo "       proxy_pass http://localhost:3000;"
    echo "       proxy_connect_timeout 300s;"
    echo "       proxy_send_timeout 300s;"
    echo "       proxy_read_timeout 300s;"
    echo "       proxy_buffering on;"
    echo "       proxy_buffer_size 128k;"
    echo "       proxy_buffers 8 128k;"
    echo "       proxy_busy_buffers_size 256k;"
    echo "       proxy_set_header Host \$host;"
    echo "       proxy_set_header X-Real-IP \$remote_addr;"
    echo "       proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "       proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "       proxy_http_version 1.1;"
    echo "       proxy_set_header Connection \"\";"
    echo "   }"
    echo ""
    read -p "   Press Enter to open the config file in nano..."
    nano "$NGINX_CONFIG"
fi

echo ""
echo "🔍 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo ""
    read -p "   Restart nginx now? (y/n): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Restarting nginx..."
        systemctl restart nginx

        if [ $? -eq 0 ]; then
            echo "✅ Nginx restarted successfully"

            # Check nginx status
            if systemctl is-active --quiet nginx; then
                echo "✅ Nginx is running"
            else
                echo "❌ Nginx is not running!"
                echo "   Restoring backup..."
                cp "$BACKUP_FILE" "$NGINX_CONFIG"
                systemctl restart nginx
                exit 1
            fi
        else
            echo "❌ Failed to restart nginx"
            echo "   Restoring backup..."
            cp "$BACKUP_FILE" "$NGINX_CONFIG"
            systemctl restart nginx
            exit 1
        fi
    else
        echo "⚠️  Remember to restart nginx later:"
        echo "   sudo systemctl restart nginx"
    fi
else
    echo "❌ Nginx configuration has syntax errors"
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Nginx timeout configuration update complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Pull latest backend code: git pull origin main"
echo "2. Restart backend: pm2 restart backend"
echo "3. Test with large NOCS in production"
echo ""
echo "Backup saved at: $BACKUP_FILE"
echo ""
