@echo off
cls
echo ============================================
echo   Find Investors for Startups - Quick Start
echo ============================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing frontend dependencies...
    call npm install
    echo.
) else (
    echo [1/3] Frontend dependencies already installed ✓
    echo.
)

REM Check if server/node_modules exists
if not exist "server\node_modules" (
    echo [2/3] Installing backend dependencies...
    cd server
    call npm install
    cd ..
    echo.
) else (
    echo [2/3] Backend dependencies already installed ✓
    echo.
)

echo [3/3] Starting application...
echo.
echo ============================================
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ============================================
echo.
echo Press Ctrl+C to stop all servers
echo.

npm run start:all
