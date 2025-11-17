#!/bin/bash
# DPDC AMI by OTBL - VM Setup Script for Ubuntu 24 LTS
# Run as: sudo bash setup-vm.sh

set -e

echo "====================================="
echo "DPDC AMI by OTBL - VM Setup"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

echo -e "${GREEN}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version

echo -e "${GREEN}Step 3: Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
echo -e "${GREEN}PostgreSQL installed and started${NC}"

echo -e "${GREEN}Step 4: Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo -e "${GREEN}Nginx installed and started${NC}"

echo -e "${GREEN}Step 5: Installing PM2...${NC}"
npm install -g pm2
pm2 --version

echo -e "${GREEN}Step 6: Installing Oracle Instant Client...${NC}"
echo -e "${YELLOW}Note: You need to download Oracle Instant Client manually from:${NC}"
echo "https://www.oracle.com/database/technologies/instant-client/downloads.html"
echo ""
echo "After downloading, run:"
echo "1. apt install -y alien libaio1"
echo "2. alien -i oracle-instantclient-basic-*.rpm"
echo "3. alien -i oracle-instantclient-sqlplus-*.rpm"
echo ""

echo -e "${GREEN}Step 7: Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
ufw status

echo -e "${GREEN}Step 8: Creating application directory...${NC}"
mkdir -p /opt/dpdc-ami
mkdir -p /opt/dpdc-ami/logs
mkdir -p /opt/backups/postgres
mkdir -p /opt/scripts

echo -e "${GREEN}Step 9: Creating application user...${NC}"
if id "appuser" &>/dev/null; then
    echo "User appuser already exists"
else
    useradd -m -s /bin/bash appuser
    echo "User appuser created"
fi

# Set permissions
chown -R appuser:appuser /opt/dpdc-ami

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}VM Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Setup PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE dpdc_ami_prod;"
echo "   CREATE USER app_user WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_prod TO app_user;"
echo ""
echo "2. Clone your repository:"
echo "   cd /opt/dpdc-ami"
echo "   git clone <your-repo-url> ."
echo ""
echo "3. Setup backend:"
echo "   cd /opt/dpdc-ami/backend"
echo "   npm install --production"
echo "   cp .env.example .env.production"
echo "   # Edit .env.production with your credentials"
echo "   npm run migrate"
echo "   npm run seed"
echo ""
echo "4. Setup frontend:"
echo "   cd /opt/dpdc-ami/frontend"
echo "   npm install"
echo "   npm run build"
echo ""
echo "5. Configure Nginx:"
echo "   cp /opt/dpdc-ami/deployment/nginx.conf /etc/nginx/sites-available/dpdc-ami"
echo "   # Edit the file with your domain name"
echo "   ln -s /etc/nginx/sites-available/dpdc-ami /etc/nginx/sites-enabled/"
echo "   nginx -t"
echo "   systemctl reload nginx"
echo ""
echo "6. Setup SSL with Let's Encrypt:"
echo "   apt install -y certbot python3-certbot-nginx"
echo "   certbot --nginx -d your-domain.com"
echo ""
echo "7. Start the application with PM2:"
echo "   cd /opt/dpdc-ami/backend"
echo "   pm2 start /opt/dpdc-ami/deployment/ecosystem.config.js --env production"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo -e "${GREEN}Done!${NC}"
