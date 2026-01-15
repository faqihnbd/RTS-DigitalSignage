#!/bin/bash

# ==============================================
# Wisse Digital Signage - Restore Script
# ==============================================
# This script restores database and uploads from backup
# Usage: ./restore.sh <backup_directory>

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if backup directory provided
if [ -z "$1" ]; then
    print_error "Please provide backup directory"
    echo "Usage: ./restore.sh <backup_directory>"
    echo "Example: ./restore.sh backups/20240115_120000"
    exit 1
fi

BACKUP_DIR=$1

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

print_warning "This will restore data from: $BACKUP_DIR"
print_warning "Current data will be OVERWRITTEN!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Restore cancelled"
    exit 0
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Restore database
if [ -f "$BACKUP_DIR/database.sql" ]; then
    print_info "Restoring database..."
    docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} < $BACKUP_DIR/database.sql
    print_success "Database restored"
else
    print_warning "Database backup not found, skipping..."
fi

# Restore uploads
if [ -f "$BACKUP_DIR/uploads.tar.gz" ]; then
    print_info "Restoring uploads..."
    tar -xzf $BACKUP_DIR/uploads.tar.gz
    print_success "Uploads restored"
else
    print_warning "Uploads backup not found, skipping..."
fi

print_success "Restore completed successfully!"
print_info "Please restart services: docker-compose restart"
