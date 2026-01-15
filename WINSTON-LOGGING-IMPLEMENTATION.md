# Winston Logging System Implementation

## Overview

Sistem logging telah diimplementasikan menggunakan **Winston** dengan rotasi file harian untuk menangkap semua aksi penting dan error dalam aplikasi Digital Signage.

## Fitur Logging

### 1. **Multiple Log Files**

Sistem menghasilkan beberapa file log dengan rotasi otomatis:

- **`application-YYYY-MM-DD.log`** - Log semua level (info, warn, error)
  - Retensi: 14 hari
  - Max size: 20MB per file
- **`error-YYYY-MM-DD.log`** - Hanya error log
  - Retensi: 30 hari (lebih lama untuk tracking error)
  - Max size: 20MB per file
- **`combined-YYYY-MM-DD.log`** - Kombinasi semua log dengan format lengkap
  - Retensi: 7 hari
  - Max size: 20MB per file

### 2. **Automatic Log Rotation**

- File log dirotasi setiap hari (daily rotation)
- File lama otomatis di-zip untuk menghemat ruang
- File log dihapus otomatis setelah periode retensi

### 3. **Structured Logging**

Setiap log entry mencakup:

- Timestamp (YYYY-MM-DD HH:mm:ss)
- Level (INFO, WARN, ERROR)
- Message
- Metadata (user_id, tenant_id, IP address, dll)
- Stack trace (untuk error)

## Implementasi

### File Struktur

```
backend/
├── utils/
│   └── logger.js          # Konfigurasi Winston
├── routes/
│   └── loggingMiddleware.js  # HTTP logging middleware
├── logs/                   # Direktori log files (auto-created)
│   ├── application-2026-01-15.log
│   ├── error-2026-01-15.log
│   └── combined-2026-01-15.log
└── index.js               # Main app with logger integration
```

### Logger Helper Methods

#### 1. **logRequest** - Log HTTP Request

```javascript
logger.logRequest(req, "User action performed", { additionalData: "value" });
```

#### 2. **logError** - Log Error dengan Context

```javascript
try {
  // code
} catch (error) {
  logger.logError(error, req, { action: "What was being done" });
}
```

#### 3. **logAuth** - Log Authentication Events

```javascript
logger.logAuth("Login Attempt", true, req, {
  email: "user@example.com",
  userId: 123,
});
```

#### 4. **logPayment** - Log Payment Transactions

```javascript
logger.logPayment("Payment Successful", req, {
  orderId: "ORD-123",
  amount: 100000,
});
```

#### 5. **logContent** - Log Content Operations

```javascript
logger.logContent("Content Uploaded", req, {
  filename: "video.mp4",
  sizeMB: 25.5,
});
```

#### 6. **logPlaylist** - Log Playlist Operations

```javascript
logger.logPlaylist("Playlist Created", req, {
  playlistId: 456,
  itemCount: 10,
});
```

#### 7. **logDevice** - Log Device Operations

```javascript
logger.logDevice("Device Registered", req, {
  deviceId: 789,
  deviceName: "Display-01",
});
```

## Middleware Integration

### 1. **Request Logging Middleware**

Otomatis log setiap HTTP request dengan:

- Method (GET, POST, PUT, DELETE)
- URL
- IP Address
- User ID (jika authenticated)
- Request duration
- Response status code

**Sensitive Data Filtering**: Password, token, dan API key otomatis di-redact dari log.

### 2. **Error Logging Middleware**

Otomatis menangkap semua error yang tidak tertangani dan mencatat:

- Error message
- Stack trace
- Request context
- User information

## Routes dengan Logging

Logging telah diimplementasikan di:

✅ **Authentication** (`routes/auth.js`)

- Login attempts (success & failed)
- Invalid password attempts
- Tenant suspension blocks
- Package expiry warnings

✅ **Content Management** (`routes/content.js`)

- Content upload/delete
- Storage operations
- File serving errors
- Video duration detection

✅ **Playlist Management** (`routes/playlist.js`)

- Playlist operations
- Order fixes and updates

✅ **Payment Processing** (`index.js`)

- Midtrans webhook events
- Payment status updates
- Package activation

✅ **System Events** (`index.js`)

- Server startup/shutdown
- Database connection
- Scheduled tasks (tenant expiry check)

## Configuration

### Environment Variables

```env
LOG_LEVEL=info          # Default log level (info, warn, error, debug)
NODE_ENV=production     # Set to production to disable console logs
```

### Log Levels

- **error**: Error yang perlu perhatian immediate
- **warn**: Warning yang perlu diperhatikan tapi tidak critical
- **info**: Informasi umum tentang operasi aplikasi (default)
- **debug**: Detail informasi untuk debugging (development only)

## Log Format Example

### Info Log

```
2026-01-15 10:30:45 [INFO]: Login Success {"method":"POST","url":"/api/auth/login","ip":"192.168.1.100","userId":123,"tenantId":1,"role":"tenant_admin","email":"admin@example.com"}
```

### Error Log

```
2026-01-15 10:35:22 [ERROR]: Application Error {"message":"Database connection failed","method":"POST","url":"/api/contents","ip":"192.168.1.100","userId":123,"tenantId":1,"action":"Upload Content"}
Error: Connection timeout
    at Database.connect (db.js:45:10)
    at ContentController.upload (content.js:78:15)
```

## Monitoring & Analysis

### Melihat Log Real-time

```bash
# Tail semua logs
tail -f backend/logs/combined-*.log

# Hanya error logs
tail -f backend/logs/error-*.log

# Hanya hari ini
tail -f backend/logs/application-2026-01-15.log
```

### Mencari Error Spesifik

```bash
# Cari semua login failures
grep "Login Failed" backend/logs/application-*.log

# Cari error dari tenant tertentu
grep "tenantId\":1" backend/logs/error-*.log

# Cari payment issues
grep "Payment" backend/logs/combined-*.log
```

### Filter by User

```bash
grep "userId\":123" backend/logs/application-*.log
```

## Best Practices

1. **Jangan Log Sensitive Data**

   - Password sudah otomatis di-filter
   - API keys dan tokens juga di-redact
   - Hati-hati dengan PII (Personal Identifiable Information)

2. **Use Appropriate Log Levels**

   - `error`: Critical issues yang butuh immediate action
   - `warn`: Potential issues yang perlu monitoring
   - `info`: Normal operations dan important events
   - `debug`: Detailed debugging info (development only)

3. **Include Context**

   - Selalu sertakan user_id dan tenant_id untuk traceability
   - Tambahkan action yang sedang dilakukan
   - Include relevant IDs (contentId, playlistId, dll)

4. **Don't Over-log**
   - Jangan log setiap line of code
   - Focus pada entry/exit points dan critical operations
   - Log state changes dan important decisions

## Maintenance

### Disk Space Management

- Log files otomatis dirotasi dan di-zip
- Old logs otomatis dihapus sesuai retention period
- Monitor disk usage secara berkala

### Log Retention

- Application logs: 14 hari
- Error logs: 30 hari
- Combined logs: 7 hari

Dapat diubah di `backend/utils/logger.js`:

```javascript
maxFiles: "30d"; // Keep for 30 days
```

### Backup Logs

Untuk analisis jangka panjang, pertimbangkan:

- Backup logs ke external storage
- Integrasi dengan log aggregation service (ELK, Splunk, dll)
- Export logs ke database untuk querying

## Troubleshooting

### Log Files Tidak Tergenerate

1. Check permissions di folder `backend/logs/`
2. Pastikan Winston terinstall: `npm list winston`
3. Check console untuk error saat startup

### Log Files Terlalu Besar

1. Reduce log level dari `debug` ke `info`
2. Kurangi retention period
3. Reduce max file size

### Missing Context in Logs

1. Pastikan middleware loggingMiddleware dipanggil sebelum routes
2. Check bahwa req.user tersedia (setelah authentication)

## Next Steps

Untuk peningkatan lebih lanjut, pertimbangkan:

1. **Log Aggregation**: Integrasi dengan ELK Stack atau Datadog
2. **Alerting**: Setup alerts untuk critical errors
3. **Dashboard**: Visualisasi logs dengan Kibana atau Grafana
4. **Log Analysis**: Automated analysis untuk detect anomalies
5. **Audit Trail**: Expand logging untuk compliance requirements

## Summary

✅ Winston logging dengan daily rotation
✅ Separate error logs dengan retention lebih lama  
✅ Automatic log rotation dan compression
✅ Sensitive data filtering
✅ Structured logging dengan context
✅ HTTP request/response logging
✅ Error tracking dengan stack traces
✅ Helper methods untuk common scenarios
✅ Implemented di semua critical routes
✅ Logs excluded dari git (.gitignore)

Sistem logging sekarang siap untuk production monitoring dan troubleshooting!
