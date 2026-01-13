@echo off
cd /d "C:\Users\USER\Documents\RTS-DigitalSignage\frontend-display"
echo Starting RTS Digital Signage Frontend Display...
echo.
echo Frontend Display will be available at:
echo   http://localhost:5174/
echo.
echo Test URLs with demo device IDs:
echo   http://localhost:5174/?id=TV001
echo   http://localhost:5174/?id=TV002  
echo   http://localhost:5174/?id=PC001
echo.
echo Use these license keys for testing:
echo   TV001: DEMO-TV001-9AXJ2KB63
echo   TV002: DEMO-TV002-DEKLI9LRG
echo   PC001: DEMO-PC001-J029U2CJA
echo.
npm run dev
pause
