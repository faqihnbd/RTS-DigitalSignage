Device Status Real-Time Fix

## Masalah

Ketika device di-reset (database browser dihapus) dan diminta connect ulang dengan memasukkan license key, statusnya di frontend-admin masih menampilkan "active/online", padahal seharusnya status berubah menjadi "offline".

### Root Cause

1. Device yang sudah di-reset berhenti mengirim heartbeat karena menampilkan AuthScreen
2. Backend tidak otomatis mengupdate status device menjadi offline
3. Backend hanya menyimpan status di field `status` database, tidak mengecek `last_heartbeat` secara real-time
4. Admin panel menampilkan status berdasarkan field `status` yang masih tersimpan sebagai "online"

## Solusi

Mengubah logika penentuan status device dari berdasarkan field `status` di database menjadi **real-time calculation** berdasarkan `last_heartbeat`.

### Logika Baru

- **Online**: Device mengirim heartbeat dalam 2 menit terakhir
- **Offline**: Device tidak mengirim heartbeat dalam 2 menit terakhir ATAU `last_heartbeat` = null

### File yang Diubah

#### 1. `backend/routes/device.js`

**Endpoint GET /devices**

- Menambahkan logika untuk menghitung status real-time berdasarkan `last_heartbeat`
- Jika `last_heartbeat` lebih dari 2 menit yang lalu → status = "offline"
- Jika `last_heartbeat` dalam 2 menit terakhir → status = "online"
- Jika `last_heartbeat` = null → status = "offline"

```javascript
// Update device status based on last_heartbeat in real-time
const HEARTBEAT_TIMEOUT = 120; // 2 minutes in seconds
const now = new Date();

const devicesWithStatus = devices.map((device) => {
  const deviceData = device.toJSON();

  // Calculate real-time status based on last_heartbeat
  if (deviceData.last_heartbeat) {
    const lastHeartbeat = new Date(deviceData.last_heartbeat);
    const timeDiff = (now - lastHeartbeat) / 1000; // in seconds

    // If last heartbeat is older than 2 minutes, device is offline
    if (timeDiff > HEARTBEAT_TIMEOUT) {
      deviceData.status = "offline";
    } else {
      deviceData.status = "online";
    }
  } else {
    // No heartbeat recorded = offline
    deviceData.status = "offline";
  }

  return deviceData;
});

res.json(devicesWithStatus);
```

**Endpoint GET /devices/stats**

- Menghitung online devices berdasarkan `last_heartbeat` dalam 2 menit terakhir
- Menggunakan query SQL dengan `Op.gte` untuk filtering

```javascript
const HEARTBEAT_TIMEOUT = 120; // 2 minutes in seconds
const now = new Date();
const cutoffTime = new Date(now.getTime() - HEARTBEAT_TIMEOUT * 1000);

const totalDevices = await Device.count({ where: whereClause });

// Count devices with recent heartbeat (within last 2 minutes) as online
const onlineDevices = await Device.count({
  where: {
    ...whereClause,
    last_heartbeat: {
      [Op.gte]: cutoffTime,
    },
  },
});

const offlineDevices = totalDevices - onlineDevices;
```

#### 2. `backend/routes/monitor.js`

**Endpoint GET /monitor/summary**

- Mengupdate perhitungan `activeDevice` menggunakan `last_heartbeat`

**Endpoint GET /monitor/devices**

- Menambahkan filter berdasarkan `last_heartbeat` ketika query status=active/online/offline
- Menambahkan logika real-time status calculation pada response

## Testing

### Skenario Testing

1. **Device Online Normal**

   - Buka frontend-display dengan device yang sudah ter-register
   - Cek status di frontend-admin → harus "online" (hijau)

2. **Device Reset (Database Cleared)**

   - Buka frontend-display yang sudah online
   - Clear browser storage/database (F12 → Application → Clear storage)
   - Refresh page → muncul AuthScreen
   - Cek status di frontend-admin → **harus berubah menjadi "offline" dalam max 2 menit**

3. **Device Reconnect**

   - Dari AuthScreen, masukkan device_id dan license_key
   - Submit dan device connect
   - Cek status di frontend-admin → harus kembali "online"

4. **Device Timeout**
   - Buka frontend-display yang sudah online
   - Matikan komputer/close browser
   - Tunggu 2 menit
   - Cek status di frontend-admin → harus berubah menjadi "offline"

### Expected Results

- ✅ Status device di admin panel update real-time berdasarkan heartbeat
- ✅ Device yang di-reset langsung menampilkan status "offline" di admin (dalam 2 menit)
- ✅ Device yang reconnect langsung menampilkan status "online" di admin
- ✅ Stats dashboard menampilkan jumlah online/offline yang akurat
- ✅ Tidak ada delay atau keterlambatan update status

## Keuntungan Solusi Ini

1. **Real-time Accuracy**: Status selalu akurat berdasarkan heartbeat terakhir
2. **No Background Job**: Tidak perlu cron job atau worker untuk update status
3. **Efficient**: Perhitungan dilakukan on-demand saat request
4. **Scalable**: Tidak membebani database dengan update status terus-menerus
5. **Consistent**: Semua endpoint menggunakan logika yang sama

## Catatan Teknis

- **Heartbeat Timeout**: 120 detik (2 menit)
- **Heartbeat Interval**: 60 detik (dari PlayerService)
- Device dianggap offline jika tidak mengirim heartbeat dalam 2 menit terakhir
- Field `status` di database masih ada tapi tidak digunakan untuk display, hanya untuk internal tracking

## Restart Server

Setelah melakukan perubahan, **restart backend server**:

```bash
cd backend
npm run dev
```

Atau gunakan task "Start Backend Server" di VS Code.

## Troubleshooting

### Status masih menampilkan "online" padahal device sudah offline

**Penyebab**: Backend belum di-restart atau browser cache

**Solusi**:

1. Restart backend server
2. Hard refresh frontend-admin (Ctrl+F5)
3. Cek console log di backend untuk memastikan logika berjalan

### Stats dashboard tidak akurat

**Penyebab**: Endpoint `/devices/stats` belum menggunakan logika baru

**Solusi**:

1. Pastikan perubahan di `backend/routes/device.js` sudah ter-save
2. Restart backend server
3. Refresh frontend-admin

### Device tidak mengirim heartbeat

**Penyebab**: PlayerService tidak berjalan atau ada error

**Solusi**:

1. Cek console log di browser frontend-display
2. Pastikan device sudah authenticated
3. Cek network tab untuk request `/api/player/heartbeat`
4. Cek backend log untuk melihat apakah heartbeat diterima

---

**Dibuat**: 12 Januari 2026
**Status**: ✅ Implemented & Tested
