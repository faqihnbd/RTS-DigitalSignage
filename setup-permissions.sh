#!/bin/bash

# ==============================================
# Setup Permissions for All Scripts
# ==============================================
# This script makes all .sh files executable
# Usage: ./setup-permissions.sh

echo "🔧 Setting up permissions for all scripts..."

# Make all .sh files executable
chmod +x *.sh

echo "✅ All scripts are now executable!"
echo ""
echo "Available scripts:"
echo "  ./deploy.sh        - Deploy application"
echo "  ./update.sh        - Update from GitHub"
echo "  ./dev.sh           - Development environment"
echo "  ./backup.sh        - Backup database & uploads"
echo "  ./restore.sh       - Restore from backup"
echo "  ./logs.sh          - View logs"
echo "  ./generate-ssl.sh  - Generate SSL certificate"
