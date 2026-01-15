# 🚀 Wisse Digital Signage - Deployment Guide

Panduan lengkap untuk deploy aplikasi Wisse Digital Signage ke VPS menggunakan Docker.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Update & Maintenance](#update--maintenance)
- [Troubleshooting](#troubleshooting)
- [SSL/HTTPS Setup](#sslhttps-setup)

---

## ✅ Prerequisites

Sebelum memulai, pastikan VPS Anda memiliki:

### System Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: Minimum 2GB (Recommended 4GB+)
- **Storage**: Minimum 20GB free space
- **CPU**: 2 cores minimum

### Software Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For pulling updates
- **Bash**: For running deployment scripts

---

## 🚀 Quick Start

### 1. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/your-username/wisse-digital-signage.git
cd wisse-digital-signage

# Or if already cloned, pull latest
git pull origin main
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Minimal configuration yang HARUS diubah:**

```env
# Server configuration
SERVER_HOST=your-vps-ip-or-domain
HTTP_PORT=8080

# Database
DB_PASS=your_secure_database_password
MYSQL_ROOT_PASSWORD=your_secure_database_password

# JWT Secret (generate random string)
JWT_SECRET=your_random_jwt_secret_key_here

# Midtrans (if using payment)
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

### 4. Deploy

```bash
# Make scripts executable
chmod +x deploy.sh update.sh

# Run deployment
./deploy.sh
```

Tunggu beberapa menit hingga semua container selesai di-build dan running.

### 5. Access Applications

Setelah deployment selesai, akses aplikasi di:

- **Admin Panel**: `http://your-vps-ip:8080/admin`
- **Central Panel**: `http://your-vps-ip:8080/central`
- **Display App**: `http://your-vps-ip:8080/display`
- **API**: `http://your-vps-ip:8080/api`

---

## 📝 Detailed Setup

### Environment Variables Explained

#### Application Settings
```env
NODE_ENV=production          # Environment mode
APP_NAME=Wisse Digital Signage
APP_VERSION=1.0.0
```

#### Server Configuration
```env
SERVER_HOST=69.62.84.122     # Your VPS IP or domain
HTTP_PORT=8080               # HTTP port (default 8080)
HTTPS_PORT=8443              # HTTPS port (default 8443)
```

#### Backend Configuration
```env
BACKEND_PORT=3001            # Internal backend port
```

#### Database Configuration
```env
DB_HOST=mysql                # Docker service name (don't change)
DB_PORT=3306                 # MySQL port
DB_NAME=rts_digital_signage_prod
DB_USER=root
DB_PASS=your_password        # CHANGE THIS!
MYSQL_ROOT_PASSWORD=your_password  # CHANGE THIS!
```

#### Midtrans Payment Gateway
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx  # From Midtrans dashboard
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx  # From Midtrans dashboard
MIDTRANS_IS_PRODUCTION=false           # true for production
```

#### JWT Configuration
```env
JWT_SECRET=your_random_secret_key  # Generate random string
JWT_EXPIRES_IN=24h                 # Token expiration
```

#### Logging
```env
LOG_LEVEL=info              # debug, info, warn, error
LOG_MAX_FILES=14d           # Keep logs for 14 days
LOG_MAX_SIZE=20m            # Max log file size
```

#### Storage
```env
UPLOAD_DIR=./uploads        # Upload directory
MAX_UPLOAD_SIZE=100         # Max upload size in MB
```

---

## 🔧 Configuration

### Port Configuration

Jika port 8080 sudah digunakan, ubah di `.env`:

```env
HTTP_PORT=9090  # Ganti dengan port yang available
```

### Database Configuration

Untuk menggunakan external database:

```env
DB_HOST=your-db-host.com
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASS=your_db_password
```

Kemudian comment service `mysql` di `docker-compose.yml`.

### CORS Configuration

Jika perlu menambah allowed origins:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://your-domain.com
```

---

## 🚀 Deployment

### First Time Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-username/wisse-digital-signage.git
cd wisse-digital-signage

# 2. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 3. Make scripts executable
chmod +x deploy.sh update.sh

# 4. Deploy
./deploy.sh
```

### Deployment Process

Script `deploy.sh` akan:

1. ✅ Check Docker & Docker Compose installation
2. ✅ Check `.env` file exists
3. ✅ Create necessary directories
4. ✅ Stop existing containers
5. ✅ Build Docker images
6. ✅ Start containers
7. ✅ Wait for services to be healthy
8. ✅ Show deployment info

### Manual Deployment

Jika prefer manual:

```bash
# Build containers
docker-compose build --parallel

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🔄 Update & Maintenance

### Update from GitHub

```bash
# Pull latest changes and redeploy
./update.sh
```

Atau manual:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --parallel
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f frontend_admin

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart nginx
```

### Stop Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: deletes database!)
docker-compose down -v
```

### Backup Database

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} < backup_20240115_120000.sql
```

### Backup Uploads

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/

# Restore uploads
tar -xzf uploads_backup_20240115_120000.tar.gz
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs mysql

# Restart specific container
docker-compose restart backend
```

### Database Connection Error

```bash
# Check MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8080

# Kill process using port
sudo kill -9 <PID>

# Or change port in .env
nano .env  # Change HTTP_PORT
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker system
docker system prune -a

# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune
```

### Frontend Not Loading

```bash
# Rebuild frontend containers
docker-compose build frontend_admin frontend_central frontend_display

# Restart nginx
docker-compose restart nginx

# Check nginx logs
docker-compose logs nginx
```

### Backend API Errors

```bash
# Check backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Check environment variables
docker-compose exec backend env | grep DB_
```

---

## 🔒 SSL/HTTPS Setup

### Option 1: Self-Signed Certificate (Testing)

```bash
# Create certs directory
mkdir -p nginx/certs

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/server.key \
  -out nginx/certs/server.crt \
  -subj "/CN=${SERVER_HOST}"

# Enable HTTPS in .env
nano .env
# Set: ENABLE_HTTPS=true

# Restart nginx
docker-compose restart nginx
```

Access via: `https://your-vps-ip:8443/admin`

**Note**: Browser akan warning karena self-signed. Klik "Advanced" → "Proceed".

### Option 2: Let's Encrypt (Production)

```bash
# Install certbot
sudo apt install certbot

# Get certificate (requires domain)
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/certs/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/certs/server.key

# Enable HTTPS
nano .env
# Set: ENABLE_HTTPS=true
# Set: SERVER_HOST=your-domain.com

# Restart
docker-compose restart nginx
```

### Option 3: Cloudflare (Recommended)

1. Point domain to VPS IP di Cloudflare DNS
2. Enable "Flexible SSL" di Cloudflare
3. Access via: `https://your-domain.com/admin`

Cloudflare akan handle SSL, tidak perlu setup di server.

---

## 📊 Monitoring

### Check Service Health

```bash
# Check all containers
docker-compose ps

# Check health status
docker-compose ps | grep healthy

# Check resource usage
docker stats
```

### Check Application Health

```bash
# Backend health
curl http://localhost:${BACKEND_PORT}/

# Nginx health
curl http://localhost:${HTTP_PORT}/health

# Check API
curl http://localhost:${HTTP_PORT}/api/
```

---

## 🔐 Security Best Practices

1. **Change Default Passwords**
   - Update `DB_PASS` dan `MYSQL_ROOT_PASSWORD`
   - Generate strong `JWT_SECRET`

2. **Use Firewall**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 8080/tcp  # HTTP
   sudo ufw allow 8443/tcp  # HTTPS
   sudo ufw enable
   ```

3. **Regular Updates**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Update application
   ./update.sh
   ```

4. **Backup Regularly**
   - Database: Daily
   - Uploads: Weekly
   - Configuration: After changes

5. **Monitor Logs**
   ```bash
   # Check for errors
   docker-compose logs --tail=100 | grep -i error
   ```

---

## 📞 Support

Jika mengalami masalah:

1. Check logs: `docker-compose logs -f`
2. Check documentation: `README.md`
3. Check GitHub issues
4. Contact support team

---

## 📄 License

Copyright © 2024 Wisse Digital Signage. All rights reserved.
