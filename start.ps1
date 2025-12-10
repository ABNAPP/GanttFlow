# PowerShell script to start the app
Write-Host "Starting Projektplanering Gantt App..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start the development server
Write-Host "Starting Vite development server..." -ForegroundColor Green
Write-Host "Chrome will open automatically..." -ForegroundColor Green
Write-Host ""
npm run dev

