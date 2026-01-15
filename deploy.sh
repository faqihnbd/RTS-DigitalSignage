#!/bin/bash

# ==============================================
# Wisse Digital Signage - Deployment Script
# ==============================================
# This script automates the deployment process
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Please copy .env.example to .env and configure it:"
        print_info "  cp .env.example .env"
        print_info "  nano .env"
        exit 1
    fi
    print_success ".env file found"
}

# Load environment variables
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
        print_success "Environment variables loaded"
    fi
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        print_info "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed!"
        print_info "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p nginx/logs
    mkdir -p nginx/certs
    print_success "Directories created"
}

# Stop existing containers
stop_containers() {
    print_info "Stopping existing containers..."
    docker-compose down || true
    print_success "Containers stopped"
}

# Build containers
build_containers() {
    print_info "Building Docker containers..."
    docker-compose build --parallel
    print_success "Containers built successfully"
}

# Start containers
start_containers() {
    print_info "Starting containers..."
    docker-compose up -d
    print_success "Containers started"
}

# Wait for services to be healthy
wait_for_services() {
    print_info "Waiting for services to be healthy..."
    
    # Wait for MySQL
    print_info "Waiting for MySQL..."
    timeout=60
    counter=0
    until docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} --silent &> /dev/null; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "MySQL failed to start within ${timeout} seconds"
            exit 1
        fi
    done
    print_success "MySQL is ready"
    
    # Wait for Backend
    print_info "Waiting for Backend..."
    counter=0
    until curl -f http://localhost:${BACKEND_PORT:-3001}/ &> /dev/null; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "Backend failed to start within ${timeout} seconds"
            exit 1
        fi
    done
    print_success "Backend is ready"
    
    # Wait for Nginx
    print_info "Waiting for Nginx..."
    counter=0
    until curl -f http://localhost:${HTTP_PORT:-8080}/health &> /dev/null; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "Nginx failed to start within ${timeout} seconds"
            exit 1
        fi
    done
    print_success "Nginx is ready"
}

# Show deployment info
show_deployment_info() {
    print_header "Deployment Complete!"
    echo ""
    print_success "All services are running!"
    echo ""
    print_info "Access your applications:"
    echo -e "  ${GREEN}Admin Panel:${NC}   http://${SERVER_HOST}:${HTTP_PORT}/admin"
    echo -e "  ${GREEN}Central Panel:${NC} http://${SERVER_HOST}:${HTTP_PORT}/central"
    echo -e "  ${GREEN}Display App:${NC}   http://${SERVER_HOST}:${HTTP_PORT}/display"
    echo -e "  ${GREEN}API:${NC}           http://${SERVER_HOST}:${HTTP_PORT}/api"
    echo ""
    print_info "Useful commands:"
    echo "  View logs:        docker-compose logs -f"
    echo "  Stop services:    docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  View status:      docker-compose ps"
    echo ""
}

# Main deployment process
main() {
    print_header "Wisse Digital Signage Deployment"
    
    # Pre-flight checks
    print_header "Pre-flight Checks"
    check_docker
    check_docker_compose
    check_env_file
    load_env
    
    # Prepare environment
    print_header "Preparing Environment"
    create_directories
    
    # Deploy
    print_header "Deploying Application"
    stop_containers
    build_containers
    start_containers
    
    # Wait for services
    print_header "Waiting for Services"
    wait_for_services
    
    # Show info
    show_deployment_info
}

# Run main function
main
