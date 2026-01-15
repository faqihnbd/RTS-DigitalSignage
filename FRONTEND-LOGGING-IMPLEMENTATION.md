# Frontend Logging System

## Overview

Sistem logging frontend telah diimplementasikan untuk menangkap aksi penting dan error di semua aplikasi frontend. Log dikirim ke backend dan disimpan di folder `backend/logs/` dengan subfolder untuk masing-masing frontend.

## Struktur Log Files

```
backend/
├── logs/
│   ├── frontend-admin/
│   │   ├── application-2026-01-15.log
│   │   ├── error-2026-01-15.log
│   │   └── combined-2026-01-15.log
│   ├── frontend-central/
│   │   ├── application-2026-01-15.log
│   │   ├── error-2026-01-15.log
│   │   └── combined-2026-01-15.log
│   └── frontend-display/
│       ├── application-2026-01-15.log
│       ├── error-2026-01-15.log
│       └── combined-2026-01-15.log
```

## Log Levels

- **debug**: Detail debugging (hanya di development)
- **info**: Informasi aktivitas normal
- **warn**: Peringatan/warning
- **error**: Error yang terjadi (dikirim segera)

## Fitur Utama

### 1. Batch Logging

Log dikumpulkan dalam queue dan dikirim secara batch setiap 5 detik untuk mengoptimalkan network usage.

### 2. Immediate Error Logging

Error level logs dikirim segera tanpa menunggu batch interval.

### 3. Offline Support (Display Only)

Frontend Display menyimpan log ke localStorage saat offline dan mengirimnya saat kembali online.

### 4. Auto Flush on Page Unload

Log yang pending otomatis dikirim menggunakan `navigator.sendBeacon()` saat user meninggalkan halaman.

### 5. Global Error Catching

Error yang tidak tertangkap (uncaught exceptions dan unhandled promise rejections) otomatis di-log.

### 6. ErrorBoundary Integration

React ErrorBoundary sudah terintegrasi dengan logger untuk menangkap error rendering.

## Cara Penggunaan

### Import Logger

```javascript
import logger from "./utils/logger";
```

### Basic Logging

```javascript
// Basic logs
logger.debug("Debug message", { extra: "data" });
logger.info("Info message", { userId: 123 });
logger.warn("Warning message", { code: "W001" });
logger.error("Error message", { stack: error.stack });
```

### Helper Methods

#### Frontend Admin

```javascript
// Authentication
logger.logAuth("Login Attempt", true, { email: "user@example.com" });
logger.logAuth("Login Failed", false, { reason: "Invalid password" });

// Navigation
logger.logNavigation("Dashboard Page");

// User Actions
logger.logAction("Button Clicked", { button: "Save" });

// Content Operations
logger.logContent("Content Uploaded", { filename: "video.mp4", size: 1024 });

// Playlist Operations
logger.logPlaylist("Playlist Created", { playlistId: 1, name: "My Playlist" });

// Device Operations
logger.logDevice("Device Registered", { deviceId: "ABC123" });

// Payment Operations
logger.logPayment("Payment Initiated", { amount: 100000, package: "Premium" });

// API Errors
logger.logApiError("/api/contents", error, { method: "POST" });

// Exceptions
logger.logException(error, "While saving content");
```

#### Frontend Central

```javascript
// Tenant Management
logger.logTenant("Tenant Created", { tenantId: 1, name: "Tenant A" });

// User Management
logger.logUser("User Activated", { userId: 1 });

// Package Management
logger.logPackage("Package Updated", { packageId: 1 });

// Monitoring
logger.logMonitor("Health Check", { status: "healthy" });

// Export
logger.logExport("Report Exported", { format: "pdf", dateRange: "..." });
```

#### Frontend Display

```javascript
// Device
logger.logDevice("Device Authenticated", { deviceId: "ABC123" });

// Playback
logger.logPlayback("Content Started", { contentId: 1, type: "video" });
logger.logPlayback("Content Ended", { contentId: 1, duration: 30 });

// Content Loading
logger.logContent("Content Cached", { contentId: 1, size: 1024 });

// Connection
logger.logConnection("connected", { event: "online" });
logger.logConnection("disconnected", { event: "offline" });

// Display Mode
logger.logDisplayMode("fullscreen", { triggered: "auto" });

// Zone
logger.logZone("Zone Changed", { zoneId: "main", layout: "single" });

// Sync
logger.logSync("Playlist Synced", { playlistId: 1, itemCount: 10 });

// Media Errors
logger.logMediaError("video", error, { contentId: 1 });
```

### Manual Flush

```javascript
// Flush pending logs (e.g., before logout)
await logger.flush();
```

## Backend API Endpoints

### Single Log

```
POST /api/frontend-logs
Content-Type: application/json

{
  "source": "frontend-admin",
  "level": "info",
  "message": "User logged in",
  "metadata": {
    "userId": 123,
    "email": "user@example.com"
  }
}
```

### Batch Logs

```
POST /api/frontend-logs/batch
Content-Type: application/json

{
  "source": "frontend-admin",
  "logs": [
    {
      "level": "info",
      "message": "Navigation to Dashboard",
      "metadata": { "page": "dashboard" },
      "timestamp": "2026-01-15T10:00:00.000Z"
    },
    {
      "level": "info",
      "message": "Content Uploaded",
      "metadata": { "filename": "video.mp4" },
      "timestamp": "2026-01-15T10:01:00.000Z"
    }
  ]
}
```

## Log Retention

| Log Type           | Retention |
| ------------------ | --------- |
| application-\*.log | 14 days   |
| error-\*.log       | 30 days   |
| combined-\*.log    | 7 days    |

All log files are:

- Rotated daily
- Auto-compressed (gzip)
- Max 20MB per file

## Metadata yang Dicatat

Setiap log entry otomatis mencakup:

### Frontend Admin & Central

- `userId`: ID user yang login
- `tenantId`: ID tenant (admin only)
- `role`: Role user
- `hasToken`: Apakah user authenticated
- `url`: Full URL halaman
- `path`: Path halaman
- `ip`: IP address (ditambah backend)
- `userAgent`: Browser user agent

### Frontend Display

- `deviceId`: ID device
- `tenantId`: ID tenant pemilik device
- `displayId`: ID display
- `hasToken`: Apakah device authenticated
- `screenWidth`: Lebar layar
- `screenHeight`: Tinggi layar
- `url`: Full URL
- `userAgent`: Browser/device user agent

## Troubleshooting

### Logs Tidak Muncul

1. Pastikan backend sudah running
2. Check CORS settings di backend
3. Check VITE_API_BASE_URL di .env frontend

### Error "Failed to send logs"

1. Check network connectivity
2. Check backend endpoint `/api/frontend-logs`
3. Logs akan di-queue dan dikirim ulang saat koneksi pulih

### LocalStorage Full (Display)

Display akan membatasi queue ke 50 entries untuk mencegah localStorage penuh.
