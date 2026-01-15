# 🔧 GitHub Setup Guide

Panduan untuk setup repository GitHub dan workflow deployment.

---

## 📋 Prerequisites

- Git installed di local machine
- GitHub account
- SSH key atau Personal Access Token

---

## 🚀 Setup Repository

### 1. Create GitHub Repository

1. Login ke GitHub
2. Click "New Repository"
3. Repository name: `wisse-digital-signage`
4. Description: "Multi-tenant Digital Signage System"
5. **JANGAN** centang "Initialize with README" (kita sudah punya)
6. Click "Create Repository"

### 2. Initialize Local Repository

```bash
# Di folder project
cd /path/to/wisse-digital-signage

# Initialize git (jika belum)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Docker deployment setup"

# Add remote
git remote add origin https://github.com/your-username/wisse-digital-signage.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🔐 Setup SSH Key (Recommended)

### Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Start ssh-agent
eval "$(ssh-agent -s)"

# Add key to ssh-agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

### Add to GitHub

1. Go to GitHub → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste public key
4. Click "Add SSH key"

### Change Remote to SSH

```bash
git remote set-url origin git@github.com:your-username/wisse-digital-signage.git
```

---

## 📝 .gitignore Configuration

File `.gitignore` sudah dibuat dengan konfigurasi yang tepat:

```gitignore
# Environment files (PENTING!)
.env
.env.local
.env.*.local

# Uploads (jangan commit user uploads)
backend/uploads/*
!backend/uploads/.gitkeep

# Logs
backend/logs/*
nginx/logs/*

# SSL certificates (jangan commit private keys!)
nginx/certs/*
!nginx/certs/.gitkeep

# Database data
mysql_data/

# Dependencies
node_modules/
```

**⚠️ PENTING**: File `.env` TIDAK akan di-commit ke GitHub (untuk keamanan).

---

## 🔄 Workflow: Local → GitHub → VPS

### Development Workflow

```bash
# 1. Make changes di local
nano backend/index.js

# 2. Test locally
./dev.sh start

# 3. Commit changes
git add .
git commit -m "Add new feature"

# 4. Push to GitHub
git push origin main
```

### Deployment Workflow

```bash
# Di VPS
cd /path/to/wisse-digital-signage

# Pull latest changes
git pull origin main

# Redeploy
./update.sh
```

Atau lebih simple:

```bash
# Di VPS
./update.sh  # Auto pull & redeploy
```

---

## 🌿 Branching Strategy

### Main Branch (Production)

```bash
# Main branch untuk production
git checkout main
git pull origin main
```

### Development Branch

```bash
# Create development branch
git checkout -b development

# Make changes
git add .
git commit -m "Development changes"

# Push to GitHub
git push origin development
```

### Feature Branches

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request di GitHub
# Merge ke development → test → merge ke main
```

---

## 📦 Release Management

### Create Release

```bash
# Tag version
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0

# Create release di GitHub
# Go to Releases → Create new release
```

---

## 🔧 Setup VPS for Git Pull

### Install Git di VPS

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git -y

# Verify
git --version
```

### Clone Repository di VPS

```bash
# Via HTTPS (akan diminta username/password)
git clone https://github.com/your-username/wisse-digital-signage.git

# Via SSH (jika sudah setup SSH key)
git clone git@github.com:your-username/wisse-digital-signage.git

# Enter directory
cd wisse-digital-signage
```

### Setup SSH Key di VPS (Recommended)

```bash
# Generate SSH key di VPS
ssh-keygen -t ed25519 -C "vps@your-server.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add ke GitHub (sama seperti local)
```

---

## 🚀 First Deployment to VPS

```bash
# 1. SSH ke VPS
ssh root@your-vps-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
git clone https://github.com/your-username/wisse-digital-signage.git
cd wisse-digital-signage

# 5. Configure
cp .env.example .env
nano .env  # Edit configuration

# 6. Deploy
chmod +x *.sh
./deploy.sh
```

---

## 🔄 Update Workflow

### Update dari GitHub

```bash
# Di VPS
cd /path/to/wisse-digital-signage

# Method 1: Using update script (recommended)
./update.sh

# Method 2: Manual
git pull origin main
docker-compose down
docker-compose build --parallel
docker-compose up -d
```

---

## 📊 Git Commands Cheat Sheet

### Basic Commands

```bash
# Check status
git status

# Add files
git add .
git add filename

# Commit
git commit -m "Commit message"

# Push
git push origin main

# Pull
git pull origin main

# View log
git log --oneline
```

### Branch Commands

```bash
# List branches
git branch

# Create branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# Delete branch
git branch -d branch-name

# Merge branch
git merge branch-name
```

### Undo Commands

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Discard local changes
git checkout -- filename
git restore filename
```

---

## 🔐 Security Best Practices

### 1. Never Commit Sensitive Data

```bash
# Files yang TIDAK boleh di-commit:
.env                    # Environment variables
backend/uploads/*       # User uploads
nginx/certs/*.key       # Private keys
node_modules/          # Dependencies
```

### 2. Use .gitignore

File `.gitignore` sudah dikonfigurasi dengan benar. Pastikan tidak di-edit!

### 3. Use Environment Variables

Semua sensitive data (passwords, API keys) harus di `.env`, BUKAN di code.

### 4. Review Before Commit

```bash
# Check what will be committed
git status
git diff

# Review staged changes
git diff --staged
```

---

## 🐛 Troubleshooting

### Git Pull Conflicts

```bash
# Stash local changes
git stash

# Pull latest
git pull origin main

# Apply stashed changes
git stash pop

# Resolve conflicts manually
nano conflicted-file

# Commit resolved conflicts
git add .
git commit -m "Resolve conflicts"
```

### Reset to Remote

```bash
# Discard ALL local changes
git fetch origin
git reset --hard origin/main
```

### Large Files Error

```bash
# If you accidentally committed large files
git rm --cached large-file
echo "large-file" >> .gitignore
git commit -m "Remove large file"
git push origin main
```

---

## 📝 Commit Message Guidelines

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```bash
git commit -m "feat: Add user authentication"
git commit -m "fix: Resolve database connection issue"
git commit -m "docs: Update deployment guide"
git commit -m "refactor: Optimize API endpoints"
```

---

## ✅ Checklist

- [ ] GitHub repository created
- [ ] Local repository initialized
- [ ] SSH key setup (optional but recommended)
- [ ] `.gitignore` configured
- [ ] First commit pushed
- [ ] VPS has Git installed
- [ ] Repository cloned to VPS
- [ ] `.env` configured on VPS
- [ ] First deployment successful
- [ ] Update workflow tested

---

## 📞 Need Help?

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com/
- **SSH Setup**: https://docs.github.com/en/authentication

---

**🎉 Repository setup complete! Ready for collaborative development!**
