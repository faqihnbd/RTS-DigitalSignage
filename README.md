# 🎬 Wisse Digital Signage

> Modern, scalable, and efficient digital signage solution with multi-tenant architecture

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 📋 Overview

Wisse Digital Signage adalah sistem manajemen konten digital signage yang powerful dengan arsitektur multi-tenant. Sistem ini memungkinkan pengelolaan konten video, gambar, dan teks untuk ditampilkan di berbagai perangkat display secara terpusat.

### ✨ Key Features

- 🏢 **Multi-Tenant Architecture** - Isolasi data per tenant dengan manajemen paket berlangganan
- 📱 **Responsive Admin Panel** - Interface modern untuk mengelola konten dan perangkat
- 🎨 **Layout Builder** - Buat layout multi-zone untuk display yang kompleks
- 📺 **Offline-First Display** - Cache-first strategy menghemat 99% bandwidth
- 💳 **Payment Integration** - Integrasi Midtrans untuk pembayaran otomatis
- 📊 **Analytics & Monitoring** - Real-time monitoring device dan statistik
- 🔐 **Secure Authentication** - JWT-based auth dengan session management
- 🚀 **Easy Deployment** - One-command deployment dengan Docker

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx Proxy                          │
│                    (Reverse Proxy & SSL)                     │
└────────┬──────────────┬──────────────┬──────────────────────┘
         │              │              │
    ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
    │ Frontend│    │ Frontend│   │ Frontend│
    │  Admin  │    │ Central │   │ Display │
    └────┬────┘    └────┬────┘   └────┬────┘
         │              │              │
         └──────────────┴──────────────┘
                        │
                   ┌────▼────┐
                   │ Backend │
                   │   API   │
                   └────┬────┘
                        │
                   ┌────▼────┐
                   │  MySQL  │
                   │Database │
                   └─────────┘
```

### Components

1. **Backend API** (Node.js + Express)
   - RESTful API dengan JWT authentication
   - Multi-tenant data isolation
   - File upload & processing
   - Payment gateway integration
   - Real-time device monitoring

2. **Frontend Admin** (React + Vite)
   - Tenant admin portal
   - Content management
   - Playlist & layout builder
   - Device registration
   - Payment & subscription

3. **Frontend Central** (React + Vite)
   - Super admin portal
   - Tenant management
   - Global monitoring
   - Analytics & reports
   - User management

4. **Frontend Display** (React + Vite + PWA)
   - Display player application
   - Offline-first architecture
   - Auto-sync & caching
   - Multi-zone layout support
   - Heartbeat monitoring

5. **MySQL Database**
   - Relational data storage
   - Multi-tenant isolation
   - Automated backups

6. **Nginx**
   - Reverse proxy
   - SSL/TLS termination
   - Static file serving
   - Load balancing

---

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 2GB+ RAM
- 20GB+ free disk space

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-username/wisse-digital-signage.git
cd wisse-digital-signage

# 2. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 3. Deploy
chmod +x deploy.sh
./deploy.sh
```

### Access Applications

After deployment:

- **Admin Panel**: `http://your-server:8080/admin`
- **Central Panel**: `http://your-server:8080/central`
- **Display App**: `http://your-server:8080/display`
- **API**: `http://your-server:8080/api`

---

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](docs/API.md) - API endpoints reference
- [User Guide](docs/USER_GUIDE.md) - How to use the system
- [Developer Guide](docs/DEVELOPER.md) - Development setup

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Authentication**: JWT
- **File Processing**: FFmpeg, Multer
- **Payment**: Midtrans
- **Logging**: Winston

### Frontend
- **Framework**: React 19+
- **Build Tool**: Vite 7+
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Hooks
- **PWA**: Vite PWA Plugin
- **Storage**: IndexedDB (LocalForage)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx
- **SSL**: Let's Encrypt / Self-signed

---

## 📦 Project Structure

```
wisse-digital-signage/
├── backend/                 # Backend API
│   ├── config/             # Configuration files
│   ├── migrations/         # Database migrations
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── uploads/            # Uploaded files
│   ├── logs/               # Application logs
│   ├── Dockerfile          # Backend Docker config
│   └── index.js            # Entry point
│
├── frontend-admin/         # Admin panel
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utilities
│   │   └── App.jsx        # Main app
│   ├── Dockerfile         # Frontend Docker config
│   ├── nginx.conf         # Nginx config
│   └── vite.config.js     # Vite config
│
├── frontend-central/       # Central admin panel
│   └── ... (similar structure)
│
├── frontend-display/       # Display player
│   └── ... (similar structure)
│
├── nginx/                  # Nginx configuration
│   ├── nginx.conf         # Main config
│   ├── certs/             # SSL certificates
│   └── logs/              # Nginx logs
│
├── docker-compose.yml      # Docker Compose config
├── .env.example           # Environment template
├── deploy.sh              # Deployment script
├── update.sh              # Update script
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

---

## 🔧 Configuration

### Environment Variables

Key configuration in `.env`:

```env
# Server
SERVER_HOST=your-vps-ip
HTTP_PORT=8080

# Database
DB_PASS=your_secure_password
MYSQL_ROOT_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_random_secret

# Midtrans
MIDTRANS_SERVER_KEY=your_key
MIDTRANS_CLIENT_KEY=your_key
```

See [.env.example](.env.example) for complete configuration.

---

## 🔄 Update & Maintenance

### Update from GitHub

```bash
./update.sh
```

### Manual Update

```bash
git pull origin main
docker-compose down
docker-compose build --parallel
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f
```

### Backup Database

```bash
docker-compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > backup.sql
```

---

## 🎯 Use Cases

### 1. Restaurant Digital Menu
- Display menu items with images and prices
- Update menu in real-time
- Multiple displays in different locations

### 2. Corporate Communication
- Company announcements
- KPI dashboards
- Event schedules

### 3. Retail Advertising
- Product promotions
- Brand videos
- Dynamic pricing

### 4. Public Information
- News and weather
- Transportation schedules
- Emergency alerts

---

## 🌟 Key Advantages

### 1. Bandwidth Efficiency
- **99% bandwidth savings** with cache-first strategy
- One-time content download
- Offline playback capability
- Smart sync every 5 minutes

### 2. Multi-Tenant Architecture
- Complete data isolation
- Custom package limits
- Flexible pricing tiers
- Scalable infrastructure

### 3. Easy Management
- Intuitive admin interface
- Drag-and-drop layout builder
- Bulk device management
- Real-time monitoring

### 4. Developer Friendly
- Clean code structure
- Comprehensive documentation
- Docker-based deployment
- Easy to customize

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Change port in .env
HTTP_PORT=9090
```

**Database connection error**
```bash
# Check MySQL logs
docker-compose logs mysql
```

**Frontend not loading**
```bash
# Rebuild frontend
docker-compose build frontend_admin
docker-compose restart nginx
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more troubleshooting tips.

---

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention (Sequelize ORM)
- XSS protection headers
- CORS configuration
- Rate limiting (recommended)
- Regular security updates

---

## 📊 Performance

### Benchmarks

- **API Response Time**: < 100ms average
- **Page Load Time**: < 2s (first load)
- **Bandwidth Usage**: ~100MB initial, ~5MB/day ongoing
- **Concurrent Users**: 100+ per instance
- **Display Devices**: 1000+ per instance

### Optimization

- Gzip compression enabled
- Static asset caching
- Database query optimization
- CDN-ready architecture
- Lazy loading components

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

Copyright © 2024 Wisse Digital Signage. All rights reserved.

This is proprietary software. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## 📞 Support

- **Email**: support@wisse.com
- **Documentation**: [docs.wisse.com](https://docs.wisse.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/wisse-digital-signage/issues)

---

## 🙏 Acknowledgments

- React Team for the amazing framework
- Docker for containerization
- Nginx for reverse proxy
- All open-source contributors

---

**Made with ❤️ by Wisse Team**
