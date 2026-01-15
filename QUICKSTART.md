# ⚡ Quick Start Guide

Panduan cepat untuk deploy Wisse Digital Signage dalam 5 menit!

## 🎯 Prerequisites

- VPS dengan Ubuntu 20.04+ / Debian 11+
- Minimal 2GB RAM, 20GB storage
- Akses SSH ke VPS

---

## 🚀 Deployment Steps

### 1. Install Docker (jika belum ada)

```bash
# Login ke VPS via SSH
ssh root@your-vps-ip

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

### 2. Clone & Configure

```bash
# Clone repository
git clone https://github.com/your-username/wisse-digital-signage.git
cd wisse-digital-signage

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Minimal yang HARUS diubah di `.env`:**

```env
# Ganti dengan IP VPS Anda
SERVER_HOST=69.62.84.122

# Ganti dengan password yang kuat
DB_PASS=password_database_anda
MYSQL_ROOT_PASSWORD=password_database_anda

# Generate random string untuk JWT
JWT_SECRET=random_string_panjang_untuk_jwt

# Jika pakai Midtrans, isi ini (optional)
MIDTRANS_SERVER_KEY=your_key
MIDTRANS_CLIENT_KEY=your_key
```

**Cara generate JWT_SECRET:**
```bash
# Generate random string
openssl rand -base64 32
```

### 3. Deploy!

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Tunggu 5-10 menit untuk build dan start semua container.

### 4. Access Applications

Setelah deployment selesai:

- **Admin Panel**: `http://your-vps-ip:8080/admin`
- **Central Panel**: `http://your-vps-ip:8080/central`
- **Display App**: `http://your-vps-ip:8080/display`

---

## 🔑 Default Login

### Super Admin (Central Panel)
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ PENTING: Ganti password setelah login pertama!**

### Tenant Admin (Admin Panel)
Buat tenant baru dari Central Panel terlebih dahulu.

---

## 📝 Common Tasks

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### Update Application
```bash
./update.sh
```

### Backup Database
```bash
./backup.sh
```

---

## 🐛 Troubleshooting

### Port 8080 sudah digunakan?

Edit `.env`:
```env
HTTP_PORT=9090  # Ganti dengan port lain
```

Lalu restart:
```bash
docker-compose down
docker-compose up -d
```

### Container tidak start?

Check logs:
```bash
docker-compose logs backend
docker-compose logs mysql
```

### Database connection error?

Pastikan password di `.env` sama untuk `DB_PASS` dan `MYSQL_ROOT_PASSWORD`.

### Frontend tidak loading?

Rebuild frontend:
```bash
docker-compose build frontend_admin frontend_central frontend_display
docker-compose restart nginx
```

---

## 🔒 Enable HTTPS (Optional)

### Self-Signed Certificate (untuk testing)

```bash
./generate-ssl.sh
```

Akses via: `https://your-vps-ip:8443/admin`

### Let's Encrypt (untuk production dengan domain)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/certs/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/certs/server.key

# Restart nginx
docker-compose restart nginx
```

---

## 📊 Next Steps

1. **Setup Super Admin**
   - Login ke Central Panel
   - Ganti password default
   - Buat tenant pertama

2. **Create Tenant**
   - Buka Central Panel → Tenants
   - Klik "Add Tenant"
   - Isi data tenant

3. **Setup Package**
   - Buka Central Panel → Packages
   - Buat paket berlangganan
   - Set harga dan limits

4. **Register Device**
   - Login ke Admin Panel sebagai tenant
   - Buka Devices → Register Device
   - Copy Device ID dan License Key

5. **Upload Content**
   - Buka Upload Content
   - Upload video/image
   - Buat playlist

6. **Assign to Device**
   - Buka Playlist Management
   - Assign playlist ke device

7. **Open Display**
   - Buka Display App di browser
   - Masukkan Device ID dan License Key
   - Content akan otomatis play!

---

## 📞 Need Help?

- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Full README**: [README.md](README.md)
- **Issues**: GitHub Issues
- **Email**: support@wisse.com

---

## ✅ Checklist

- [ ] Docker & Docker Compose installed
- [ ] Repository cloned
- [ ] `.env` configured
- [ ] `deploy.sh` executed
- [ ] Applications accessible
- [ ] Default password changed
- [ ] First tenant created
- [ ] First device registered
- [ ] Content uploaded
- [ ] Display working

---

**🎉 Selamat! Aplikasi Anda sudah running!**
