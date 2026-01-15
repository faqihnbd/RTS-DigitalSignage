# ✅ Deployment Checklist

Checklist lengkap untuk memastikan deployment berjalan lancar.

---

## 📋 Pre-Deployment Checklist

### Local Development

- [ ] Semua fitur sudah di-test di local
- [ ] Tidak ada error di console
- [ ] Database migrations sudah dibuat
- [ ] Environment variables sudah dikonfigurasi
- [ ] `.gitignore` sudah benar
- [ ] Sensitive data tidak di-commit

### Code Quality

- [ ] Code sudah di-review
- [ ] Tidak ada hardcoded URLs/passwords
- [ ] Logging sudah diimplementasikan
- [ ] Error handling sudah proper
- [ ] Comments untuk code yang kompleks

### Documentation

- [ ] README.md updated
- [ ] API documentation updated (jika ada perubahan)
- [ ] Deployment guide reviewed
- [ ] Environment variables documented

---

## 🔧 VPS Preparation

### System Requirements

- [ ] VPS dengan minimal 2GB RAM
- [ ] Minimal 20GB free disk space
- [ ] Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- [ ] Root atau sudo access

### Software Installation

- [ ] Docker installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] Git installed
- [ ] Firewall configured

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 8080/tcp

# Allow HTTPS (optional)
sudo ufw allow 8443/tcp

# Enable firewall
sudo ufw enable
```

- [ ] Port 22 (SSH) allowed
- [ ] Port 8080 (HTTP) allowed
- [ ] Port 8443 (HTTPS) allowed (optional)
- [ ] Firewall enabled

---

## 📦 Repository Setup

### GitHub

- [ ] Repository created di GitHub
- [ ] Local repository initialized
- [ ] `.gitignore` configured
- [ ] First commit pushed
- [ ] SSH key setup (recommended)

### VPS Git Setup

- [ ] Git installed di VPS
- [ ] Repository cloned ke VPS
- [ ] SSH key setup di VPS (recommended)

---

## ⚙️ Configuration

### Environment Variables

Edit `.env` dan pastikan semua sudah diisi:

- [ ] `SERVER_HOST` - IP atau domain VPS
- [ ] `HTTP_PORT` - Port untuk HTTP (default: 8080)
- [ ] `DB_PASS` - Password database yang kuat
- [ ] `MYSQL_ROOT_PASSWORD` - Password MySQL root
- [ ] `JWT_SECRET` - Random string untuk JWT
- [ ] `MIDTRANS_SERVER_KEY` - Midtrans server key (jika pakai payment)
- [ ] `MIDTRANS_CLIENT_KEY` - Midtrans client key (jika pakai payment)

### Generate JWT Secret

```bash
openssl rand -base64 32
```

- [ ] JWT_SECRET generated dan diisi

### Verify Configuration

```bash
# Check .env file
cat .env | grep -v '^#' | grep -v '^$'
```

- [ ] Semua required variables sudah diisi
- [ ] Tidak ada placeholder values
- [ ] Passwords sudah diganti

---

## 🚀 Deployment

### Pre-Deployment

- [ ] `.env` file configured
- [ ] Scripts executable (`chmod +x *.sh`)
- [ ] Disk space sufficient
- [ ] Ports available

### Run Deployment

```bash
./deploy.sh
```

- [ ] Deployment script executed
- [ ] No errors during build
- [ ] All containers started
- [ ] Health checks passed

### Verify Deployment

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs --tail=50
```

- [ ] All containers running
- [ ] No error logs
- [ ] Services healthy

---

## 🧪 Testing

### Backend API

```bash
# Test backend health
curl http://localhost:3001/

# Test API endpoint
curl http://localhost:8080/api/
```

- [ ] Backend responding
- [ ] API accessible

### Frontend Applications

- [ ] Admin Panel accessible: `http://your-vps-ip:8080/admin`
- [ ] Central Panel accessible: `http://your-vps-ip:8080/central`
- [ ] Display App accessible: `http://your-vps-ip:8080/display`

### Database

```bash
# Test database connection
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

- [ ] Database accessible
- [ ] Tables created

### Nginx

```bash
# Test nginx
curl http://localhost:8080/health
```

- [ ] Nginx responding
- [ ] Reverse proxy working

---

## 🔐 Security

### Passwords

- [ ] Database password changed from default
- [ ] MySQL root password changed
- [ ] JWT secret is random and strong
- [ ] Default admin password will be changed after first login

### Firewall

- [ ] Firewall enabled
- [ ] Only necessary ports open
- [ ] SSH port secured (consider changing from 22)

### SSL/HTTPS (Optional but Recommended)

- [ ] SSL certificate generated or obtained
- [ ] HTTPS enabled in nginx
- [ ] Certificate auto-renewal setup (if using Let's Encrypt)

---

## 📊 Monitoring

### Logs

```bash
# View all logs
./logs.sh all

# View specific service
./logs.sh backend
```

- [ ] Logs accessible
- [ ] No critical errors
- [ ] Log rotation configured

### Resource Usage

```bash
# Check disk space
df -h

# Check memory
free -h

# Check Docker stats
docker stats
```

- [ ] Sufficient disk space (>20% free)
- [ ] Memory usage normal (<80%)
- [ ] CPU usage normal

---

## 💾 Backup

### Initial Backup

```bash
./backup.sh
```

- [ ] Backup script executed
- [ ] Database backed up
- [ ] Uploads backed up
- [ ] Configuration backed up

### Backup Strategy

- [ ] Automated backup scheduled (cron job)
- [ ] Backup location decided
- [ ] Backup retention policy defined
- [ ] Restore procedure tested

### Setup Automated Backup (Optional)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/wisse-digital-signage && ./backup.sh
```

- [ ] Cron job configured
- [ ] Backup tested

---

## 👥 User Setup

### Super Admin

- [ ] Login to Central Panel
- [ ] Change default password
- [ ] Update admin profile

### First Tenant

- [ ] Create first tenant
- [ ] Assign package
- [ ] Create tenant admin user

### First Device

- [ ] Register first device
- [ ] Get Device ID and License Key
- [ ] Test device authentication

---

## 📱 Application Testing

### Admin Panel

- [ ] Login works
- [ ] Upload content works
- [ ] Create playlist works
- [ ] Assign playlist to device works
- [ ] Device management works

### Central Panel

- [ ] Login works
- [ ] Tenant management works
- [ ] Package management works
- [ ] Payment monitoring works
- [ ] Statistics displayed correctly

### Display App

- [ ] Device authentication works
- [ ] Playlist loads
- [ ] Content plays correctly
- [ ] Offline mode works
- [ ] Auto-sync works

---

## 🔄 Update Workflow

### Test Update Process

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test update workflow"
git push origin main

# On VPS, update
./update.sh
```

- [ ] Update script works
- [ ] Changes deployed successfully
- [ ] No downtime during update

---

## 📝 Documentation

### Internal Documentation

- [ ] Deployment process documented
- [ ] Configuration documented
- [ ] Troubleshooting guide created
- [ ] Contact information updated

### User Documentation

- [ ] User guide created/updated
- [ ] Admin guide created/updated
- [ ] FAQ created/updated

---

## 🎯 Post-Deployment

### Monitoring Setup

- [ ] Log monitoring configured
- [ ] Error alerting setup (optional)
- [ ] Performance monitoring (optional)
- [ ] Uptime monitoring (optional)

### Maintenance Plan

- [ ] Update schedule defined
- [ ] Backup schedule defined
- [ ] Security update plan
- [ ] Support contact established

### Performance Optimization

- [ ] Database indexes optimized
- [ ] Caching configured
- [ ] CDN setup (optional)
- [ ] Load testing performed (optional)

---

## 🐛 Troubleshooting Checklist

If something goes wrong:

- [ ] Check logs: `./logs.sh`
- [ ] Check container status: `docker-compose ps`
- [ ] Check disk space: `df -h`
- [ ] Check memory: `free -h`
- [ ] Check environment variables: `cat .env`
- [ ] Restart services: `docker-compose restart`
- [ ] Rebuild if needed: `docker-compose build --no-cache`

---

## ✅ Final Verification

### Functionality

- [ ] All core features working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] User experience smooth

### Security

- [ ] All passwords changed
- [ ] Firewall configured
- [ ] SSL enabled (recommended)
- [ ] Sensitive data not exposed

### Reliability

- [ ] Services auto-restart on failure
- [ ] Backups working
- [ ] Monitoring in place
- [ ] Update process tested

### Documentation

- [ ] All documentation complete
- [ ] Team trained (if applicable)
- [ ] Support process defined

---

## 🎉 Go Live!

Once all items are checked:

- [ ] Announce to team
- [ ] Monitor closely for first 24 hours
- [ ] Be ready for quick fixes
- [ ] Celebrate! 🎊

---

## 📞 Support Contacts

- **Technical Lead**: _________________
- **DevOps**: _________________
- **Support Email**: _________________
- **Emergency Contact**: _________________

---

## 📅 Maintenance Schedule

- **Daily**: Check logs, monitor performance
- **Weekly**: Review backups, check disk space
- **Monthly**: Security updates, performance review
- **Quarterly**: Full system audit, disaster recovery test

---

**✅ Deployment Complete!**

Date: _______________
Deployed by: _______________
Version: _______________
Notes: _______________
