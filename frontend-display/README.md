# RTS Digital Signage - Frontend Display

Frontend display untuk menjalankan konten digital signage di perangkat TV/PC dengan sistem caching untuk hemat kuota.

## 🚀 Fitur Utama

- **Offline-First**: Konten di-cache lokal untuk mengurangi penggunaan bandwidth
- **Auto-Sync**: Sinkronisasi otomatis playlist dan konten dari server
- **Multi-Format**: Support video, gambar, dan HTML content
- **Scheduling**: Tampilkan konten sesuai jadwal yang ditentukan
- **Device Management**: Isolasi berdasarkan tenant dan package
- **Heartbeat Monitoring**: Status monitoring real-time ke server

## 🏗️ Arsitektur

### Preload & Caching System

- Konten di-download sekali saat playlist berubah
- Disimpan menggunakan IndexedDB untuk akses offline
- Player render dari konten lokal (tidak streaming)
- Auto cleanup untuk cache lama

### Flow Aplikasi

1. **Authentication**: Validasi device ID dan license key
2. **Content Sync**: Download dan cache playlist content
3. **Playback**: Tampilkan konten sesuai schedule
4. **Monitoring**: Kirim heartbeat dan statistics ke server

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **LocalForage** - Client Storage (IndexedDB)
- **Axios** - HTTP Client

## 📦 Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Configure environment variables:

```env
VITE_API_URL=http://localhost:3000
```

4. Start development server:

```bash
npm run dev
```

5. Build untuk production:

```bash
npm run build
```

## 🖥️ Deployment

### TV Android (Fully Kiosk Browser)

1. Install Fully Kiosk Browser dari Play Store
2. Enable "Kiosk Mode" dan "Auto Start"
3. Set homepage ke: `https://your-domain.com/player?id=TV001`
4. Configure auto-login dan hide navigation

### PC/Laptop (Chrome Kiosk)

1. Buat shortcut Chrome dengan parameter:

```bash
chrome.exe --kiosk --disable-features=Translate --no-first-run --fast --fast-start --disable-default-apps "https://your-domain.com/player?id=PC001"
```

2. Set shortcut untuk auto-start di Windows startup

### Web Access

Akses langsung via browser:

```
https://your-domain.com/player?id=DEVICE_ID
```

## 🔧 Configuration

### Device Registration

1. Akses URL dengan device ID: `?id=TV001`
2. Masukkan License Key yang diberikan admin
3. Sistem akan validasi dan menyimpan credentials
4. Auto-start playback setelah authentication

### Environment Variables

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# Apakah dalam development mode
NODE_ENV=development
```

## 📱 Device Setup

### Untuk Android TV

1. Install **Fully Kiosk Browser**
2. Settings > Advanced Web Settings:
   - Enable JavaScript
   - Enable DOM Storage
   - Enable Database Storage
3. Settings > Kiosk Mode:
   - Enable Kiosk Mode
   - Hide System UI
   - Prevent Sleep
4. Settings > Remote Administration:
   - Enable Remote Admin (optional)

### Untuk Windows PC

1. Install Chrome browser
2. Buat batch file untuk auto-start:

```batch
@echo off
start chrome.exe --kiosk --disable-features=Translate --no-first-run --fast --fast-start --disable-default-apps "https://signageku.com/player?id=%COMPUTERNAME%"
```

## 🔍 Monitoring & Debugging

### Status Indicator

- 🟢 **Online**: Terhubung ke server
- 🟠 **Syncing**: Sedang sync data
- 🔴 **Offline**: Tidak terhubung (mode offline)

### Debug Mode

Dalam development mode, akan muncul info debug di pojok kiri bawah:

- Device ID
- Current Playlist
- Current Item
- Cache Status

### Console Logs

Monitor console browser untuk:

- Authentication status
- Content download progress
- Playback errors
- Network connectivity

## 📊 Cache Management

### Auto Cleanup

- Cache otomatis dibersihkan setiap 7 hari
- Konten lama yang tidak digunakan akan dihapus
- Total storage usage dimaintain dalam batas wajar

### Manual Cache Control

```javascript
// Clear all cache
await StorageService.clearAllCache();

// Get cache statistics
const stats = await StorageService.getCacheStats();
console.log(`Cached items: ${stats.totalItems}`);
console.log(`Total size: ${formatFileSize(stats.totalSize)}`);
```

## 🚨 Troubleshooting

### Common Issues

1. **Tidak bisa load konten**

   - Periksa koneksi internet
   - Pastikan license key valid
   - Check console untuk error

2. **Cache penuh**

   - Jalankan cleanup cache
   - Periksa available storage
   - Kurangi durasi cache retention

3. **Authentication gagal**

   - Pastikan device ID benar
   - Periksa license key
   - Contact administrator

4. **Video tidak play**
   - Periksa format video (support: MP4, WebM)
   - Pastikan codec compatible
   - Check network untuk download

### Performance Tips

1. **Optimize Content**

   - Gunakan video dengan bitrate sesuai kebutuhan
   - Kompres gambar untuk size optimal
   - Batasi durasi HTML content

2. **Network Usage**

   - Enable preload untuk content caching
   - Set sync interval sesuai kebutuhan
   - Monitor bandwidth usage

3. **Hardware Requirements**
   - Minimum 2GB RAM
   - 10GB storage untuk cache
   - Hardware video decode support

## 🔗 Integration

### API Endpoints

Aplikasi menggunakan endpoint berikut:

```
GET  /api/player/data/:deviceId     - Get playlist data
POST /api/player/heartbeat          - Send device status
POST /api/player/stats              - Send playback statistics
GET  /api/content/file/:contentId   - Download content file
```

### WebSocket (Future)

Untuk real-time updates:

```javascript
// Live playlist updates
// Remote control commands
// Emergency broadcast
```

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push dan buat Pull Request

## 📄 License

Copyright © 2025 RTS Digital Signage. All rights reserved.
