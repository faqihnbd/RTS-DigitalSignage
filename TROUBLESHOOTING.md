# 🔧 Troubleshooting Guide

Panduan lengkap untuk mengatasi masalah umum pada Wisse Digital Signage.

---

## 📋 Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Container Issues](#container-issues)
- [Database Issues](#database-issues)
- [Network Issues](#network-issues)
- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [Performance Issues](#performance-issues)
- [Common Error Messages](#common-error-messages)

---

## 🚨 Quick Diagnostics

### Check System Status

```bash
# Check all containers
docker-compose ps

# Check logs
./logs.sh all

# Check disk space
df -h

# Check memory
free -h

# Check Docker stats
docker stats
```

### Quick Fixes

```bash
# Restart all services
docker-compose restart

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean Docker system
docker system prune -a
```

---

## 🐳 Container Issues

### Container Won't Start

**Symptoms**: Container status shows "Exited" or "Restarting"

**Diagnosis**:
```bash
# Check container logs
docker-compose logs backend
docker-compose logs mysql
docker-compose logs nginx

# Check container status
docker-compose ps
```

**Solutions**:

1. **Check logs for errors**
   ```bash
   docker-compose logs --tail=100 backend
   ```

2. **Restart container**
   ```bash
   docker-compose restart backend
   ```

3. **Rebuild container**
   ```bash
   docker-compose build --no-cache backend
   docker-compose up -d backend
   ```

4. **Check environment variables**
   ```bash
   docker-compose exec backend env
   ```

### Container Keeps Restarting

**Symptoms**: Container starts then immediately stops

**Common Causes**:
- Database not ready
- Missing environment variables
- Port already in use
- Configuration error

**Solutions**:

1. **Wait for dependencies**
   ```bash
   # MySQL might need time to initialize
   docker-compose logs mysql
   # Wait for "ready for connections"
   ```

2. **Check port conflicts**
   ```bash
   # Check if port is in use
   sudo lsof -i :8080
   sudo lsof -i :3001
   
   # Kill process if needed
   sudo kill -9 <PID>
   ```

3. **Verify configuration**
   ```bash
   # Check .env file
   cat .env | grep -v '^#' | grep -v '^$'
   ```

### Out of Memory

**Symptoms**: Container killed, "OOMKilled" in logs

**Solutions**:

1. **Check memory usage**
   ```bash
   docker stats
   free -h
   ```

2. **Increase swap space**
   ```bash
   # Create 2GB swap file
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **Limit container memory**
   Edit `docker-compose.yml`:
   ```yaml
   backend:
     mem_limit: 512m
     mem_reservation: 256m
   ```

---

## 💾 Database Issues

### Cannot Connect to Database

**Symptoms**: "ECONNREFUSED" or "Access denied" errors

**Diagnosis**:
```bash
# Check MySQL container
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD}
```

**Solutions**:

1. **Wait for MySQL to be ready**
   ```bash
   # MySQL needs 30-60 seconds to initialize
   docker-compose logs -f mysql
   # Wait for "ready for connections"
   ```

2. **Check credentials**
   ```bash
   # Verify .env file
   cat .env | grep DB_
   cat .env | grep MYSQL_
   ```

3. **Reset MySQL container**
   ```bash
   docker-compose down
   docker volume rm wisse-digital-signage_mysql_data
   docker-compose up -d
   ```

### Database Connection Pool Exhausted

**Symptoms**: "Too many connections" error

**Solutions**:

1. **Restart backend**
   ```bash
   docker-compose restart backend
   ```

2. **Increase max connections**
   Edit `docker-compose.yml`:
   ```yaml
   mysql:
     command: --max-connections=200
   ```

### Slow Database Queries

**Solutions**:

1. **Check slow query log**
   ```bash
   docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW VARIABLES LIKE 'slow_query%';"
   ```

2. **Optimize tables**
   ```bash
   docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} -e "OPTIMIZE TABLE tenants, devices, contents;"
   ```

---

## 🌐 Network Issues

### Cannot Access Application

**Symptoms**: Browser shows "Connection refused" or timeout

**Diagnosis**:
```bash
# Check if nginx is running
docker-compose ps nginx

# Check nginx logs
docker-compose logs nginx

# Test locally
curl http://localhost:8080/health
```

**Solutions**:

1. **Check firewall**
   ```bash
   # Check firewall status
   sudo ufw status
   
   # Allow port
   sudo ufw allow 8080/tcp
   ```

2. **Check nginx configuration**
   ```bash
   # Test nginx config
   docker-compose exec nginx nginx -t
   
   # Reload nginx
   docker-compose restart nginx
   ```

3. **Check port binding**
   ```bash
   # Check if port is bound
   sudo netstat -tulpn | grep 8080
   ```

### 502 Bad Gateway

**Symptoms**: Nginx returns 502 error

**Common Causes**:
- Backend not running
- Backend not responding
- Network issue between nginx and backend

**Solutions**:

1. **Check backend status**
   ```bash
   docker-compose ps backend
   docker-compose logs backend
   ```

2. **Restart backend**
   ```bash
   docker-compose restart backend
   ```

3. **Check backend health**
   ```bash
   curl http://localhost:3001/
   ```

### 504 Gateway Timeout

**Symptoms**: Request times out

**Solutions**:

1. **Increase timeout in nginx**
   Edit `nginx/nginx.conf`:
   ```nginx
   proxy_read_timeout 300s;
   proxy_connect_timeout 75s;
   ```

2. **Restart nginx**
   ```bash
   docker-compose restart nginx
   ```

---

## 🎨 Frontend Issues

### Frontend Not Loading

**Symptoms**: Blank page or 404 error

**Diagnosis**:
```bash
# Check frontend container
docker-compose ps frontend_admin

# Check nginx logs
docker-compose logs nginx

# Check browser console for errors
```

**Solutions**:

1. **Rebuild frontend**
   ```bash
   docker-compose build --no-cache frontend_admin
   docker-compose restart frontend_admin nginx
   ```

2. **Check nginx routing**
   ```bash
   # Test nginx config
   docker-compose exec nginx nginx -t
   ```

3. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear cache and cookies
   - Reload page

### API Calls Failing

**Symptoms**: "Network Error" or "CORS error" in console

**Solutions**:

1. **Check API URL**
   - Open browser console
   - Check if API URL is correct
   - Should be: `http://your-server:8080/api`

2. **Check CORS configuration**
   Edit `backend/index.js`:
   ```javascript
   app.use(cors({
     origin: [
       'http://your-server:8080',
       // Add your domains
     ],
     credentials: true,
   }));
   ```

3. **Restart backend**
   ```bash
   docker-compose restart backend
   ```

### Assets Not Loading

**Symptoms**: Images, CSS, or JS files return 404

**Solutions**:

1. **Check base path in vite.config.js**
   ```javascript
   export default defineConfig({
     base: '/admin/',  // Must match nginx routing
   });
   ```

2. **Rebuild frontend**
   ```bash
   docker-compose build --no-cache frontend_admin
   docker-compose up -d
   ```

---

## ⚙️ Backend Issues

### Backend Crashes

**Symptoms**: Backend container keeps restarting

**Diagnosis**:
```bash
# Check backend logs
docker-compose logs --tail=100 backend

# Check for errors
docker-compose logs backend | grep -i error
```

**Common Causes**:
- Uncaught exceptions
- Database connection issues
- Memory leaks
- Missing dependencies

**Solutions**:

1. **Check logs for stack trace**
   ```bash
   docker-compose logs backend | tail -50
   ```

2. **Restart with fresh state**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Check environment variables**
   ```bash
   docker-compose exec backend env | grep -E 'DB_|JWT_|MIDTRANS_'
   ```

### File Upload Fails

**Symptoms**: "File too large" or upload timeout

**Solutions**:

1. **Increase upload limit**
   Edit `backend/index.js`:
   ```javascript
   app.use(express.json({ limit: '100mb' }));
   app.use(express.urlencoded({ extended: true, limit: '100mb' }));
   ```

2. **Increase nginx limit**
   Edit `nginx/nginx.conf`:
   ```nginx
   client_max_body_size 100M;
   ```

3. **Restart services**
   ```bash
   docker-compose restart backend nginx
   ```

### JWT Token Issues

**Symptoms**: "Invalid token" or "Token expired"

**Solutions**:

1. **Check JWT_SECRET**
   ```bash
   cat .env | grep JWT_SECRET
   ```

2. **Clear browser storage**
   - Open browser console
   - Run: `localStorage.clear()`
   - Reload page

3. **Restart backend**
   ```bash
   docker-compose restart backend
   ```

---

## 🚀 Performance Issues

### Slow Response Times

**Diagnosis**:
```bash
# Check resource usage
docker stats

# Check disk I/O
iostat -x 1

# Check network
netstat -s
```

**Solutions**:

1. **Optimize database queries**
   - Add indexes
   - Use query caching
   - Optimize joins

2. **Enable caching**
   - Redis for session storage
   - Nginx caching for static assets

3. **Increase resources**
   - Add more RAM
   - Upgrade CPU
   - Use SSD storage

### High Memory Usage

**Solutions**:

1. **Check for memory leaks**
   ```bash
   docker stats
   ```

2. **Restart services**
   ```bash
   docker-compose restart
   ```

3. **Limit container memory**
   Edit `docker-compose.yml`:
   ```yaml
   backend:
     mem_limit: 1g
   ```

### Disk Space Full

**Symptoms**: "No space left on device"

**Solutions**:

1. **Check disk usage**
   ```bash
   df -h
   du -sh /var/lib/docker
   ```

2. **Clean Docker**
   ```bash
   docker system prune -a
   docker volume prune
   ```

3. **Clean logs**
   ```bash
   # Truncate logs
   truncate -s 0 backend/logs/*.log
   truncate -s 0 nginx/logs/*.log
   ```

4. **Clean old uploads**
   ```bash
   # Remove old uploads (be careful!)
   find backend/uploads -type f -mtime +30 -delete
   ```

---

## ❌ Common Error Messages

### "ECONNREFUSED"

**Meaning**: Cannot connect to service

**Solutions**:
- Check if service is running
- Check network connectivity
- Verify port numbers

### "EADDRINUSE"

**Meaning**: Port already in use

**Solutions**:
```bash
# Find process using port
sudo lsof -i :8080

# Kill process
sudo kill -9 <PID>

# Or change port in .env
```

### "Cannot find module"

**Meaning**: Missing dependency

**Solutions**:
```bash
# Rebuild container
docker-compose build --no-cache backend
docker-compose up -d
```

### "Permission denied"

**Meaning**: File permission issue

**Solutions**:
```bash
# Fix permissions
sudo chown -R $USER:$USER backend/uploads
sudo chmod -R 755 backend/uploads
```

### "Disk quota exceeded"

**Meaning**: Out of disk space

**Solutions**:
```bash
# Clean Docker
docker system prune -a

# Check disk usage
df -h
```

---

## 🔍 Advanced Debugging

### Enable Debug Logging

Edit `.env`:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

Restart:
```bash
docker-compose restart backend
```

### Access Container Shell

```bash
# Backend
docker-compose exec backend /bin/bash

# MySQL
docker-compose exec mysql /bin/bash

# Nginx
docker-compose exec nginx /bin/sh
```

### Check Container Logs in Real-Time

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# With timestamps
docker-compose logs -f --timestamps backend
```

### Network Debugging

```bash
# Check container network
docker network inspect wisse-digital-signage_wisse-network

# Test connectivity between containers
docker-compose exec backend ping mysql
docker-compose exec backend curl http://nginx
```

---

## 📞 Getting Help

If you still have issues:

1. **Collect Information**
   ```bash
   # System info
   uname -a
   docker --version
   docker-compose --version
   
   # Container status
   docker-compose ps
   
   # Recent logs
   docker-compose logs --tail=100 > logs.txt
   
   # Environment (remove sensitive data!)
   cat .env | grep -v 'PASS\|SECRET\|KEY' > env.txt
   ```

2. **Check Documentation**
   - README.md
   - DEPLOYMENT.md
   - This file

3. **Search GitHub Issues**
   - Check if issue already reported
   - Search for error message

4. **Create GitHub Issue**
   - Include system info
   - Include error logs
   - Describe steps to reproduce

5. **Contact Support**
   - Email: support@wisse.com
   - Include all collected information

---

## ✅ Prevention Tips

1. **Regular Backups**
   ```bash
   ./backup.sh
   ```

2. **Monitor Resources**
   ```bash
   docker stats
   df -h
   free -h
   ```

3. **Keep Updated**
   ```bash
   ./update.sh
   ```

4. **Review Logs**
   ```bash
   ./logs.sh backend
   ```

5. **Test Before Deploy**
   - Test in development first
   - Use staging environment
   - Have rollback plan

---

**🔧 Happy Troubleshooting!**

Remember: Most issues can be solved by checking logs and restarting services!
