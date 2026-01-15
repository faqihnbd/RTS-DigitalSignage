#!/bin/bash

# ==============================================
# Wisse Digital Signage - Development Script
# ==============================================
# This script starts development environment
# Usage: ./dev.sh [command]
# Commands: start, stop, restart, logs, clean

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

COMMAND=${1:-start}

case $COMMAND in
    start)
        print_info "Starting development environment..."
        
        # Copy dev env if .env doesn't exist
        if [ ! -f .env ]; then
            cp .env.development .env
            print_success ".env created from .env.development"
        fi
        
        # Start backend with Docker
        print_info "Starting backend..."
        docker-compose -f docker-compose.dev.yml up -d
        
        print_success "Backend started on http://localhost:3001"
        print_info "Start frontend manually:"
        echo "  cd frontend-admin && npm run dev"
        echo "  cd frontend-central && npm run dev"
        echo "  cd frontend-display && npm run dev"
        ;;
        
    stop)
        print_info "Stopping development environment..."
        docker-compose -f docker-compose.dev.yml down
        print_success "Development environment stopped"
        ;;
        
    restart)
        print_info "Restarting development environment..."
        docker-compose -f docker-compose.dev.yml restart
        print_success "Development environment restarted"
        ;;
        
    logs)
        print_info "Viewing logs..."
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
        
    clean)
        print_warning "This will remove all development containers and volumes!"
        read -p "Are you sure? (yes/no): " CONFIRM
        if [ "$CONFIRM" = "yes" ]; then
            docker-compose -f docker-compose.dev.yml down -v
            print_success "Development environment cleaned"
        fi
        ;;
        
    *)
        echo "Usage: ./dev.sh [command]"
        echo "Commands:"
        echo "  start   - Start development environment"
        echo "  stop    - Stop development environment"
        echo "  restart - Restart development environment"
        echo "  logs    - View logs"
        echo "  clean   - Remove all containers and volumes"
        ;;
esac
