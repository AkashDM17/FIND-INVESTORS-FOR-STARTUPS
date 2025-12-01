@echo off
setlocal

echo ============================================
echo Starting Find Investors for Startups
echo ============================================
echo.
echo Starting both Frontend and Backend servers...
echo.
echo Frontend will run on: http://localhost:5173 (or next available port)
echo Backend will run on: http://localhost:5000
echo.
echo Press Ctrl+C to stop all servers
echo ============================================
echo.

echo If you encounter any issues, please refer to HOW_TO_START.txt for manual start instructions.
echo.

rem Try to use concurrently first
npm run start:all
