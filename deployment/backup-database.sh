#!/bin/bash
# DPDC AMI - PostgreSQL Backup Script
# Place at: /opt/scripts/backup-database.sh
# Make executable: chmod +x /opt/scripts/backup-database.sh
# Add to crontab: 0 2 * * * /opt/scripts/backup-database.sh

BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="dpdc_ami_prod"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
echo "Starting backup of $DB_NAME..."
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${DB_NAME}_${DATE}.sql.gz"
else
    echo "Backup failed!"
    exit 1
fi

# Delete old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Show disk usage
echo "Current backup directory size:"
du -sh $BACKUP_DIR

echo "Backup process completed"
