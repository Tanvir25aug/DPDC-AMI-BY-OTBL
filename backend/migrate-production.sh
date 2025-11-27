#!/bin/bash

# NOCS Balance Summary - Production Migration Script
# This script will automatically run all database migrations

set -e  # Exit on any error

echo "================================================"
echo "NOCS Balance Summary - Production Migration"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this from the backend directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found backend directory${NC}"
echo ""

# Step 2: Load environment variables
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

echo "Loading PostgreSQL database credentials from .env..."
source .env

# Use PostgreSQL specific variables (not Oracle!)
DB_USER=${POSTGRES_USER:-${PG_USER:-postgres}}
DB_PASSWORD=${POSTGRES_PASSWORD:-${PG_PASSWORD}}
DB_NAME=${POSTGRES_DB:-${PG_DB:-dpdc_ami_db}}
DB_HOST=${POSTGRES_HOST:-${PG_HOST:-localhost}}
DB_PORT=${POSTGRES_PORT:-${PG_PORT:-5432}}

echo -e "${GREEN}✓ Database credentials loaded${NC}"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Host: $DB_HOST"
echo ""

# Step 3: Test database connection
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed!${NC}"
    echo "Please check your database credentials in .env"
    exit 1
fi
echo ""

# Step 4: Backup existing config
echo "Backing up config.json..."
if [ -f "src/config/config.json" ]; then
    cp src/config/config.json src/config/config.json.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Config backed up${NC}"
fi
echo ""

# Step 5: Create/Update config.json
echo "Updating config.json with production credentials..."
cat > src/config/config.json << EOF
{
  "development": {
    "username": "$DB_USER",
    "password": "$DB_PASSWORD",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "port": $DB_PORT,
    "dialect": "postgres",
    "logging": false
  },
  "production": {
    "username": "$DB_USER",
    "password": "$DB_PASSWORD",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "port": $DB_PORT,
    "dialect": "postgres",
    "logging": false
  }
}
EOF

echo -e "${GREEN}✓ Config.json updated${NC}"
echo ""

# Step 6: Check migration status
echo "Checking current migration status..."
npx sequelize-cli db:migrate:status
echo ""

# Step 7: Run migrations
echo "Running database migrations..."
echo -e "${YELLOW}This will create the nocs_balance_summary table...${NC}"
echo ""

npx sequelize-cli db:migrate

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓✓✓ Migrations completed successfully! ✓✓✓${NC}"
else
    echo ""
    echo -e "${RED}✗ Migration failed!${NC}"
    exit 1
fi
echo ""

# Step 8: Verify table creation
echo "Verifying table creation..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d nocs_balance_summary" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Table 'nocs_balance_summary' created successfully${NC}"

    # Show table structure
    echo ""
    echo "Table structure:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d nocs_balance_summary"
else
    echo -e "${RED}✗ Table verification failed${NC}"
    exit 1
fi
echo ""

# Step 9: Show final status
echo "Final migration status:"
npx sequelize-cli db:migrate:status
echo ""

echo "================================================"
echo -e "${GREEN}✓ MIGRATION COMPLETED SUCCESSFULLY!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Restart your backend server (pm2 restart dpdc-ami-backend)"
echo "2. Wait 5-10 minutes for initial data load"
echo "3. Verify data: SELECT COUNT(*) FROM nocs_balance_summary;"
echo "   (Should return 17 rows)"
echo ""
echo "The scheduler will automatically populate the data."
echo ""
