# Test script untuk API endpoints frontend-display
# Usage: .\test_player_api.ps1 [LICENSE_KEY]

param(
    [string]$LicenseKey = "DEMO-TV001-TESTKEY123"
)

$BaseUrl = "http://localhost:3000"
$DeviceId = "TV001"

Write-Host "=== Testing RTS Digital Signage Player API ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl"
Write-Host "License Key: $LicenseKey"
Write-Host "Device ID: $DeviceId"
Write-Host ""

# Test health endpoint
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/player/health" -Method Get
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test device validation
Write-Host "2. Testing Device Validation..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $LicenseKey"
    }
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/player/validate/$DeviceId" -Method Get -Headers $headers
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test player data
Write-Host "3. Testing Player Data..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $LicenseKey"
    }
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/player/data/$DeviceId" -Method Get -Headers $headers
    Write-Host "Device: $($response.device.name)"
    Write-Host "Playlists: $($response.playlists.Count)"
    Write-Host "Settings: Refresh interval = $($response.settings.refresh_interval)ms"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test heartbeat
Write-Host "4. Testing Heartbeat..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $LicenseKey"
        "Content-Type" = "application/json"
    }
    $body = @{
        device_id = $DeviceId
        status = "online"
        player_info = @{
            user_agent = "PowerShell Test"
            screen_resolution = "1920x1080"
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/player/heartbeat" -Method Post -Headers $headers -Body $body
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test stats
Write-Host "5. Testing Statistics..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $LicenseKey"
        "Content-Type" = "application/json"
    }
    $body = @{
        device_id = $DeviceId
        playlist_id = 1
        content_id = 1
        event_type = "play_start"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/player/stats" -Method Post -Headers $headers -Body $body
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test content file access
Write-Host "6. Testing Content File Access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/content/file/1" -Method Head
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Content-Type: $($response.Headers['Content-Type'])"
    Write-Host "Content-Length: $($response.Headers['Content-Length'])"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== API Testing Complete ===" -ForegroundColor Green
