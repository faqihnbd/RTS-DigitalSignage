#!/bin/bash

# ==============================================
# Wisse Digital Signage - SSL Certificate Generator
# ==============================================
# This script generates self-signed SSL certificates
# Usage: ./generate-ssl.sh [domain-or-ip]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Get domain/IP from argument or .env
if [ -n "$1" ]; then
    DOMAIN=$1
else
    # Try to load from .env
    if [ -f .env ]; then
        export $(cat .env | grep SERVER_HOST | xargs)
        DOMAIN=${SERVER_HOST}
    else
        print_warning "No domain/IP provided and .env not found"
        read -p "Enter your domain or IP address: " DOMAIN
    fi
fi

print_info "Generating SSL certificate for: $DOMAIN"

# Create certs directory
mkdir -p nginx/certs

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/certs/server.key \
    -out nginx/certs/server.crt \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Wisse/OU=IT/CN=${DOMAIN}"

print_success "SSL certificate generated successfully!"
print_info "Certificate location: nginx/certs/server.crt"
print_info "Private key location: nginx/certs/server.key"
print_warning "This is a self-signed certificate. Browsers will show a warning."
print_info "For production, use Let's Encrypt or a commercial certificate."
