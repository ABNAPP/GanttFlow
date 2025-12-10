@echo off
echo Starting Projektplanering Gantt App...
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server (Vite will automatically open Chrome)
echo Starting Vite development server...
echo Chrome will open automatically...
echo.
echo Note: If you're using PowerShell, run: npm run dev
echo.
call npm run dev

