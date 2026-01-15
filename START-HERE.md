# 🚀 START HERE - Wisse Digital Signage Deployment

**Selamat datang!** File ini adalah starting point untuk deployment aplikasi Wisse Digital Signage Anda.

---

## 📋 Quick Navigation

Pilih sesuai kebutuhan Anda:

### 🎯 Saya ingin...

1. **Deploy ke VPS sekarang (5 menit)**
   → Baca: [QUICKSTART.md](QUICKSTART.md)

2. **Memahami sistem secara lengkap**
   → Baca: [README.md](README.md)

3. **Panduan deployment detail**
   → Baca: [DEPLOYMENT.md](DEPLOYMENT.md)

4. **Setup GitHub repository**
   → Baca: [GITHUB-SETUP.md](GITHUB-SETUP.md)

5. **Troubleshooting masalah**
   → Baca: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

6. **Checklist deployment**
   → Baca: [CHECKLIST.md](CHECKLIST.md)

7. **Ringkasan implementasi**
   → Baca: [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)

---

## ⚡ Super Quick Start (TL;DR)

```bash
# 1. Install Docker di VPS
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Clone repository
git clone https://github.com/your-username/wisse-digital-signage.git
cd wisse-digital-signage

# 3. Configure
cp .env.example .env
nano .env  # Edit SERVER_HOST, passwords

# 4. Deploy!
chmod +x *.sh
./deploy.sh

# 5. Access
# http://your-vps-ip:8080/admin
# http://your-vps-ip:8080/central
# http://your-vps-ip:8080/display
```

---

## 📚 Documentation Structure

```
📁 Documentation
├── START-HERE.md (You are here!)
├── QUICKSTART.md (5-minute setup)
├── README.md (Project overview)
├── DEPLOYMENT.md (Detailed guide)
├── GITHUB-SETUP.md (Git workflow)
├── TROUBLESHOOTING.md (Problem solving)
├── CHECKLIST.md (Deployment checklist)
├── IMPLEMENTATION-SUMMARY.md (What's implemented)
└── SUMMARY.md (Package summary)
```

---

## 🎯 What Has Been Implemented?

✅ **No More Hardcoded URLs**
- Semua konfigurasi dari `.env`
- Mudah ganti server/domain

✅ **Docker Containerization**
- 5 services: MySQL, Backend, 3 Frontends, Nginx
- One-command deployment

✅ **Automated Scripts**
- `./deploy.sh` - Deploy aplikasi
- `./update.sh` - Update dari GitHub
- `./backup.sh` - Backup database
- `./logs.sh` - View logs

✅ **Comprehensive Documentation**
- 10+ documentation files
- Step-by-step guides
- Troubleshooting tips

---

## 🔧 Prerequisites

Before you start, make sure you have:

- [ ] VPS dengan Ubuntu 20.04+ / Debian 11+
- [ ] Minimal 2GB RAM, 20GB storage
- [ ] Root atau sudo access
- [ ] Basic knowledge of Linux commands

---

## 📝 Configuration Required

Edit `.env` file dengan minimal configuration:

```env
# Your VPS IP or domain
SERVER_HOST=69.62.84.122

# Strong passwords
DB_PASS=your_secure_password
MYSQL_ROOT_PASSWORD=your_secure_password

# Random JWT secret
JWT_SECRET=your_random_jwt_secret

# Midtrans keys (optional)
MIDTRANS_SERVER_KEY=your_key
MIDTRANS_CLIENT_KEY=your_key
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

---

## 🚀 Deployment Steps

### Step 1: Prepare VPS

```bash
# SSH to VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### Step 2: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/your-username/wisse-digital-signage.git
cd wisse-digital-signage
```

### Step 3: Configure

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Edit these values:**
- `SERVER_HOST` - Your VPS IP
- `DB_PASS` - Strong password
- `MYSQL_ROOT_PASSWORD` - Strong password
- `JWT_SECRET` - Random string

### Step 4: Deploy

```bash
# Make scripts executable
chmod +x *.sh

# Run deployment
./deploy.sh
```

Wait 5-10 minutes for build and start.

### Step 5: Access Applications

- **Admin Panel**: `http://your-vps-ip:8080/admin`
- **Central Panel**: `http://your-vps-ip:8080/central`
- **Display App**: `http://your-vps-ip:8080/display`

---

## 🎓 Learning Path

### For Beginners

1. Read [QUICKSTART.md](QUICKSTART.md)
2. Follow step-by-step
3. Access applications
4. Read [README.md](README.md) for overview

### For Experienced Users

1. Read [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)
2. Review [DEPLOYMENT.md](DEPLOYMENT.md)
3. Configure `.env`
4. Run `./deploy.sh`

### For Developers

1. Read [GITHUB-SETUP.md](GITHUB-SETUP.md)
2. Setup development environment
3. Use `./dev.sh` for local development
4. Follow Git workflow

---

## 🔄 Update Workflow

### From Local to VPS

```bash
# 1. Local - make changes
git add .
git commit -m "Update feature"
git push origin main

# 2. VPS - update
./update.sh  # Auto pull & redeploy
```

---

## 🐛 Common Issues

### Port 8080 already in use?

```bash
# Change port in .env
HTTP_PORT=9090
```

### Container won't start?

```bash
# Check logs
./logs.sh backend

# Restart
docker-compose restart
```

### Database connection error?

```bash
# Check MySQL
docker-compose logs mysql

# Verify credentials
cat .env | grep DB_
```

**More solutions**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📊 Architecture Overview

```
Internet → Nginx (8080) → Backend (3001) → MySQL (3306)
                       ↓
                   Frontends
                   - Admin
                   - Central
                   - Display
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Generate random JWT_SECRET
- [ ] Enable firewall (ports 22, 8080, 8443)
- [ ] Setup SSL certificate (optional)
- [ ] Regular backups configured

---

## 📞 Need Help?

### Documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problem solving

### Commands
```bash
./logs.sh backend    # View logs
docker-compose ps    # Check status
./backup.sh          # Backup data
```

### Support
- GitHub Issues
- Email: support@wisse.com

---

## ✅ Success Checklist

After deployment, verify:

- [ ] All containers running (`docker-compose ps`)
- [ ] Admin Panel accessible
- [ ] Central Panel accessible
- [ ] Display App accessible
- [ ] Can login to Central Panel
- [ ] Can create tenant
- [ ] Can register device
- [ ] Can upload content

---

## 🎉 What's Next?

1. **Change default passwords**
2. **Create first tenant**
3. **Setup package**
4. **Register device**
5. **Upload content**
6. **Test display**

---

## 💡 Pro Tips

1. **Always backup before update**
   ```bash
   ./backup.sh
   ```

2. **Monitor logs regularly**
   ```bash
   ./logs.sh backend
   ```

3. **Use development environment for testing**
   ```bash
   ./dev.sh start
   ```

4. **Keep documentation handy**
   - Bookmark this repository
   - Print important pages

---

## 🏆 You're Ready!

Semua sudah siap untuk deployment. Pilih salah satu:

### 🚀 Quick Deploy (5 minutes)
→ [QUICKSTART.md](QUICKSTART.md)

### 📖 Learn More First
→ [README.md](README.md)

### 🔧 Detailed Setup
→ [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Good luck with your deployment! 🎊**

*If you have any questions, check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or create a GitHub issue.*
