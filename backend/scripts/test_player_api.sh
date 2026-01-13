#!/bin/bash

# Test script untuk API endpoints frontend-display
# Usage: ./test_api.sh [LICENSE_KEY]

BASE_URL="http://localhost:3000"
LICENSE_KEY="${1:-DEMO-TV001-TESTKEY123}"
DEVICE_ID="TV001"

echo "=== Testing RTS Digital Signage Player API ==="
echo "Base URL: $BASE_URL"
echo "License Key: $LICENSE_KEY"
echo "Device ID: $DEVICE_ID"
echo ""

# Test health endpoint
echo "1. Testing Health Check..."
curl -s "$BASE_URL/api/player/health" | echo "$(cat)" | head -5
echo ""

# Test device validation
echo "2. Testing Device Validation..."
curl -s -H "Authorization: Bearer $LICENSE_KEY" \
  "$BASE_URL/api/player/validate/$DEVICE_ID" | echo "$(cat)" | head -10
echo ""

# Test player data
echo "3. Testing Player Data..."
curl -s -H "Authorization: Bearer $LICENSE_KEY" \
  "$BASE_URL/api/player/data/$DEVICE_ID" | echo "$(cat)" | head -20
echo ""

# Test heartbeat
echo "4. Testing Heartbeat..."
curl -s -X POST \
  -H "Authorization: Bearer $LICENSE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "'$DEVICE_ID'",
    "status": "online",
    "player_info": {
      "user_agent": "Test Browser",
      "screen_resolution": "1920x1080"
    }
  }' \
  "$BASE_URL/api/player/heartbeat" | echo "$(cat)"
echo ""

# Test stats
echo "5. Testing Statistics..."
curl -s -X POST \
  -H "Authorization: Bearer $LICENSE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "'$DEVICE_ID'",
    "playlist_id": 1,
    "content_id": 1,
    "event_type": "play_start"
  }' \
  "$BASE_URL/api/player/stats" | echo "$(cat)"
echo ""

# Test content file (if content exists)
echo "6. Testing Content File Access..."
curl -I -s "$BASE_URL/api/content/file/1" | head -10
echo ""

echo "=== API Testing Complete ==="
