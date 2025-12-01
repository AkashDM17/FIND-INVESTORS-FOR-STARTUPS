# PowerShell script to start both frontend and backend servers

Write-Host "============================================"
Write-Host "Starting Find Investors for Startups"
Write-Host "============================================"
Write-Host ""
Write-Host "Starting both Frontend and Backend servers..."
Write-Host ""
Write-Host "Frontend will run on: http://localhost:5173 (or next available port)"
Write-Host "Backend will run on: http://localhost:5000"
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers"
Write-Host "============================================"
Write-Host ""

# Start backend server in a new PowerShell process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\server'; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
npm run dev