#!/bin/bash

# ==============================================
# Wisse Digital Signage - Logs Viewer
# ==============================================
# Quick script to view logs
# Usage: ./logs.sh [service] [lines]

SERVICE=${1:-all}
LINES=${2:-100}

if [ "$SERVICE" = "all" ]; then
    echo "📋 Viewing logs for all services (last $LINES lines)..."
    docker-compose logs --tail=$LINES -f
elif [ "$SERVICE" = "backend" ]; then
    echo "📋 Viewing backend logs (last $LINES lines)..."
    docker-compose logs --tail=$LINES -f backend
elif [ "$SERVICE" = "mysql" ]; then
    echo "📋 Viewing MySQL logs (last $LINES lines)..."
    docker-compose logs --tail=$LINES -f mysql
elif [ "$SERVICE" = "nginx" ]; then
    echo "📋 Viewing Nginx logs (last $LINES lines)..."
    docker-compose logs --tail=$LINES -f nginx
elif [ "$SERVICE" = "admin" ]; then
    echo "📋 Viewing Frontend Admin logs (last $LINES lines)..."
    docker-compose logs --tail=$LINES -f frontend_admin
elif [ "$SERVICE" = "central" ]; then
    echo "📋 Viewing Frontend Central logs (last $LINES lines)..."
    docker-compose logs --tail=$LINES -f frontend_central
elif [ "$SERVICE" = "display" ]; then
    echo "📋 Viewing Frontend Display logs (last $LINES lines)..."
    docker-compose logs --tail=$LINES -f frontend_display
else
    echo "❌ Unknown service: $SERVICE"
    echo "Available services: all, backend, mysql, nginx, admin, central, display"
    exit 1
fi
