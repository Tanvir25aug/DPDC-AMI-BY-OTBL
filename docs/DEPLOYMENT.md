# Deployment Guide - DPDC AMI by OTBL

This guide explains how to deploy the DPDC AMI application to a production Ubuntu 24 LTS server.

## Prerequisites

- Ubuntu 24 LTS server with root access
- Domain name (optional, for SSL)
- Oracle database credentials (read-only user)
- Minimum 2GB RAM, 20GB disk space

## Step 1: Initial Server Setup

### 1.1 Run the Setup Script

```bash
# Download or upload the setup script
cd /opt
sudo bash /path/to/setup-vm.sh
```

This script will install:
- Node.js 20 LTS
- PostgreSQL 16
- Nginx
- PM2
- Firewall configuration

### 1.2 Install Oracle Instant Client

Download Oracle Instant Client from Oracle's website:
https://www.oracle.com/database/technologies/instant-client/downloads.html

```bash
# Install dependencies
sudo apt install -y alien libaio1

# Convert and install RPM packages
sudo alien -i oracle-instantclient-basic-*.rpm
sudo alien -i oracle-instantclient-sqlplus-*.rpm

# Verify installation
sqlplus -version
```

## Step 2: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE dpdc_ami_prod;
CREATE USER app_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_prod TO app_user;
\c dpdc_ami_prod
GRANT ALL ON SCHEMA public TO app_user;
\q
```

## Step 3: Deploy Application Code

### 3.1 Clone Repository

```bash
cd /opt
sudo mkdir dpdc-ami
sudo chown $USER:$USER dpdc-ami
cd dpdc-ami
git clone <your-repository-url> .
```

### 3.2 Setup Backend

```bash
cd backend

# Install dependencies
npm install --production

# Create production environment file
cp .env.example .env.production

# Edit environment file
nano .env.production
```

**Configure the following in `.env.production`:**

```env
NODE_ENV=production
PORT=3000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dpdc_ami_prod
POSTGRES_USER=app_user
POSTGRES_PASSWORD=your_strong_password_here

# Oracle
DB_USER=your_oracle_readonly_user
DB_PASSWORD="your_oracle_password"
DB_HOST=oracle_host
DB_PORT=1521
DB_SERVICE_NAME=service_name
DB_CONNECT_STRING=oracle_host:1521/service_name

# JWT (generate strong random keys)
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=another_long_random_string
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Run database migrations:**

```bash
NODE_ENV=production npx sequelize-cli db:migrate
NODE_ENV=production npx sequelize-cli db:seed:all
```

### 3.3 Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create production environment file
cp .env.example .env.production

# Edit environment file
nano .env.production
```

**Configure `.env.production`:**

```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_APP_NAME=DPDC AMI by OTBL
```

**Build the frontend:**

```bash
npm run build
```

This creates the `dist` folder with production-ready files.

## Step 4: Configure Nginx

### 4.1 Copy Configuration

```bash
sudo cp /opt/dpdc-ami/deployment/nginx.conf /etc/nginx/sites-available/dpdc-ami

# Edit with your domain name
sudo nano /etc/nginx/sites-available/dpdc-ami

# Replace 'your-domain.com' with your actual domain
```

### 4.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/dpdc-ami /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Step 6: Start Application with PM2

```bash
cd /opt/dpdc-ami/backend

# Start with PM2
pm2 start /opt/dpdc-ami/deployment/ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown

# Check status
pm2 status
pm2 logs dpdc-ami-api
```

## Step 7: Setup Automated Backups

```bash
# Copy backup script
sudo cp /opt/dpdc-ami/deployment/backup-database.sh /opt/scripts/
sudo chmod +x /opt/scripts/backup-database.sh

# Test backup script
sudo /opt/scripts/backup-database.sh

# Add to crontab (runs daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /opt/scripts/backup-database.sh >> /var/log/postgres-backup.log 2>&1
```

## Step 8: Verify Deployment

1. **Check Backend API:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check Frontend:**
   Visit https://your-domain.com

3. **Test Login:**
   - Username: `admin`
   - Password: `Admin@123`
   - **Change this immediately!**

4. **Check PM2 Status:**
   ```bash
   pm2 status
   pm2 monit
   ```

5. **Check Logs:**
   ```bash
   pm2 logs dpdc-ami-api
   sudo tail -f /var/log/nginx/dpdc-ami-access.log
   sudo tail -f /var/log/nginx/dpdc-ami-error.log
   ```

## Maintenance

### Update Application

```bash
cd /opt/dpdc-ami

# Pull latest changes
git pull

# Update backend
cd backend
npm install --production
NODE_ENV=production npx sequelize-cli db:migrate
pm2 restart dpdc-ami-api

# Update frontend
cd ../frontend
npm install
npm run build
```

### Restart Services

```bash
# Restart API
pm2 restart dpdc-ami-api

# Reload Nginx
sudo systemctl reload nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### View Logs

```bash
# PM2 logs
pm2 logs dpdc-ami-api

# Application logs
tail -f /opt/dpdc-ami/backend/logs/app.log
tail -f /opt/dpdc-ami/backend/logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/dpdc-ami-access.log
sudo tail -f /var/log/nginx/dpdc-ami-error.log
```

### Restore Database from Backup

```bash
# List available backups
ls -lh /opt/backups/postgres/

# Restore from backup
gunzip -c /opt/backups/postgres/dpdc_ami_prod_20240101_020000.sql.gz | \
  psql -U app_user -h localhost dpdc_ami_prod
```

## Troubleshooting

### Backend won't start

```bash
# Check Node.js version
node --version  # Should be 20.x

# Check environment file
cat /opt/dpdc-ami/backend/.env.production

# Check database connection
psql -U app_user -d dpdc_ami_prod -h localhost

# Check Oracle connection
cd /opt/dpdc-ami/backend
node -e "require('./src/config/oracle').initializeOraclePool()"
```

### Frontend showing errors

```bash
# Rebuild frontend
cd /opt/dpdc-ami/frontend
npm run build

# Check Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /opt/dpdc-ami/frontend/dist
```

### Cannot connect to Oracle

```bash
# Verify Oracle Instant Client
sqlplus -version

# Test connection string
sqlplus readonly_user/password@hostname:1521/service_name

# Check environment variables
echo $LD_LIBRARY_PATH
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Strong passwords for all database users
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] SSL certificate installed
- [ ] Database backups running
- [ ] Application logs being monitored
- [ ] PostgreSQL not exposed to internet
- [ ] Environment files have correct permissions (600)
- [ ] Regular system updates scheduled

## Support

For issues or questions, contact the development team or refer to the main README.md file.
