# Setup Guide - RTS Digital Signage Frontend Display

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend-display
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` file:

```env
VITE_API_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run Backend Migration (if not already done)

```bash
cd ../backend
npm run migrate
```

### 4. Create Demo Devices

```bash
cd ../backend
node scripts/create_demo_devices.js
```

### 5. Start Frontend Display

```bash
cd ../frontend-display
npm run dev
```

## 🧪 Testing

### Test Authentication

1. Open browser: `http://localhost:5174/`
2. Add device ID parameter: `http://localhost:5174/?id=TV001`
3. Enter license key from demo devices script output
4. Should redirect to player screen

### Test Different Devices

- TV001: `http://localhost:5174/?id=TV001`
- TV002: `http://localhost:5174/?id=TV002`
- PC001: `http://localhost:5174/?id=PC001`

### Test Caching

1. Upload content via frontend-admin
2. Create playlist with the content
3. Set schedule for current time
4. Device should download and cache content
5. Check browser DevTools > Application > IndexedDB

## 🔧 Development

### Hot Reload

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Debug Mode

Set `NODE_ENV=development` in `.env` to see:

- Debug info overlay
- Console logs
- Device status indicators

## 📱 Device Deployment

### Android TV (Fully Kiosk Browser)

1. Install from Play Store
2. Settings > Kiosk Mode: Enable
3. Homepage: `https://your-domain.com/?id=TV001`
4. Auto-start and hide system UI

### Windows PC (Chrome Kiosk)

Create `start_signage.bat`:

```batch
@echo off
chrome.exe --kiosk --disable-features=Translate --no-first-run --fast --fast-start --disable-default-apps "https://your-domain.com/?id=PC001"
```

### Smart TV (Web Browser)

1. Open built-in browser
2. Navigate to: `https://your-domain.com/?id=TV001`
3. Enter fullscreen mode
4. Bookmark for easy access

## 🔍 Troubleshooting

### Common Issues

1. **"No token provided" error**

   - Check if device_id exists in database
   - Verify license_key is correct
   - Ensure device status is 'active'

2. **Content not loading**

   - Check backend content endpoint: `/api/content/file/:id`
   - Verify uploads folder permissions
   - Check browser network tab for 404 errors

3. **Caching not working**

   - Check browser support for IndexedDB
   - Verify localforage initialization
   - Check available storage space

4. **Video not playing**
   - Ensure video format is supported (MP4, WebM)
   - Check codec compatibility
   - Verify Content-Range headers for streaming

### Debug Commands

Check device status:

```bash
curl -H "Authorization: Bearer YOUR_LICENSE_KEY" \
  http://localhost:3000/api/player/validate/TV001
```

Get player data:

```bash
curl -H "Authorization: Bearer YOUR_LICENSE_KEY" \
  http://localhost:3000/api/player/data/TV001
```

Test content endpoint:

```bash
curl -I http://localhost:3000/api/content/file/1
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   Display       │────│    API          │────│   PostgreSQL    │
│                 │    │                 │    │                 │
│ - React Player  │    │ - Player Routes │    │ - Devices       │
│ - IndexedDB     │    │ - Content API   │    │ - Playlists     │
│ - LocalForage   │    │ - File Serving  │    │ - Content       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Data Flow

1. **Authentication**: Device ID + License Key → Token validation
2. **Sync**: Get playlists and schedules from backend
3. **Cache**: Download content files to IndexedDB
4. **Playback**: Render content from local cache
5. **Monitoring**: Send heartbeat and stats to backend

## 🔐 Security

- Device authentication via license keys
- Tenant isolation (devices only see own content)
- Content access control
- HTTPS required for production
- Token validation on every request

## 🚀 Performance

- **Offline-first**: Content cached locally
- **Lazy loading**: Only download needed content
- **Range requests**: Efficient video streaming
- **Auto cleanup**: Remove old cached content
- **Heartbeat**: Minimal network usage

## 📈 Monitoring

- Device status: Online/Offline/Syncing
- Cache usage: Storage and bandwidth
- Playback stats: Content views and duration
- Error reporting: Automatic error logging

## 🔄 Updates

- **Automatic sync**: Every 5 minutes
- **Content updates**: On playlist changes
- **Schedule updates**: Real-time schedule checking
- **Error recovery**: Auto-retry on failures
