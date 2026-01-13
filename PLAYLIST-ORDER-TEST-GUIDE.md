# Playlist Order Synchronization Test

## 🧪 Testing Playlist Order Synchronization

### Test Scenario

Mengubah urutan item di playlist sampletest secara berulang dan memastikan zone playlist di frontend-display menampilkan urutan yang benar.

### Test Steps

#### 1. Initial Setup Check

```bash
# Backend - Verify current playlist order
cd backend
node check_playlist_order.js
```

**Expected Result**: Sequential order (1,2,3,4,5) without duplicates

#### 2. Frontend Admin - Change Playlist Order

1. Buka http://localhost:3001/admin/playlists
2. Klik "Kelola" pada playlist Sampletest
3. Drag & drop untuk mengubah urutan items
4. Tunggu beberapa detik untuk perubahan tersimpan

#### 3. Frontend Display - Verify Synchronization

1. Buka http://localhost:5174
2. Login dengan device TV002
3. Observe playlist zone (zona bawah kanan di split screen horizontal)
4. Tunggu 30 detik untuk auto-refresh
5. Verify urutan cycling sesuai dengan perubahan di admin

#### 4. Repeat Test

Ulangi langkah 2-3 beberapa kali dengan urutan yang berbeda.

### Expected Behaviors

#### ✅ Frontend Display Features

- **Auto Sorting**: Items selalu diurutkan berdasarkan order field
- **Change Detection**: Deteksi perubahan urutan playlist otomatis
- **Zone Reset**: Reset ke item pertama ketika urutan berubah
- **Auto Refresh**: Data playlist refresh setiap 30 detik
- **Consistent Cycling**: Item cycling mengikuti urutan database

#### ✅ Debug Logs

Frontend console harus menampilkan:

```
[DEBUG] Playlist order changed for zone 88
[DEBUG] Old version: 9:1,8:2,11:3,6:4,7:5
[DEBUG] New version: 8:1,9:2,11:3,6:4,7:5
[DEBUG] Reset playlist zone 88 to first item: gojek.png
```

#### ✅ Visual Confirmation

- Playlist zone langsung menampilkan item pertama dari urutan baru
- Cycling berlanjut dengan urutan yang benar
- Tidak ada gap atau item yang terlewat

### Troubleshooting

#### Issue: Zone tidak update setelah perubahan admin

**Solution**: Tunggu maksimal 30 detik untuk auto-refresh

#### Issue: Order masih salah setelah refresh

**Solution**: Check backend order dengan:

```bash
cd backend
node debug_playlist_data.js
```

#### Issue: Frontend console error

**Solution**: Check console untuk error messages dan restart dev server jika perlu

### Test Status: ✅ READY FOR TESTING

Semua komponen telah diperbaiki:

- ✅ Database order conflicts resolved
- ✅ Frontend sorting implemented
- ✅ Change detection mechanism added
- ✅ Auto refresh polling implemented
- ✅ Zone reset logic implemented
