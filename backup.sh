#!/bin/bash

# ==============================================
# Wisse Digital Signage - Backup Script
# ==============================================
# This script backs up database and uploads
# Usage: ./backup.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

print_info "Creating backup in: $BACKUP_DIR"

# Backup database
print_info "Backing up database..."
docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > $BACKUP_DIR/database.sql
print_success "Database backed up"

# Backup uploads
print_info "Backing up uploads..."
tar -czf $BACKUP_DIR/uploads.tar.gz backend/uploads/
print_success "Uploads backed up"

# Backup .env
print_info "Backing up configuration..."
cp .env $BACKUP_DIR/.env
print_success "Configuration backed up"

# Create backup info file
cat > $BACKUP_DIR/backup_info.txt << EOF
Wisse Digital Signage Backup
=============================
Date: $(date)
Database: ${DB_NAME}
Server: ${SERVER_HOST}
Version: ${APP_VERSION:-1.0.0}
EOF

print_success "Backup completed successfully!"
print_info "Backup location: $BACKUP_DIR"
print_info "Files:"
echo "  - database.sql"
echo "  - uploads.tar.gz"
echo "  - .env"
echo "  - backup_info.txt"
