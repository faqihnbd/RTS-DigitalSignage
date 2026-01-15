#!/bin/bash

# ==============================================
# Wisse Digital Signage - Update Script
# ==============================================
# This script pulls latest changes and redeploys
# Usage: ./update.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Main update process
main() {
    print_header "Wisse Digital Signage Update"
    
    # Pull latest changes
    print_info "Pulling latest changes from Git..."
    git pull origin main || git pull origin master
    print_success "Latest changes pulled"
    
    # Run deployment script
    print_info "Running deployment script..."
    ./deploy.sh
}

# Run main function
main
