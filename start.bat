@echo off
echo Starting Projektplanering Gantt App...
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server
echo Starting Vite development server...
echo Opening browser at http://localhost:3000...
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start npm dev and open browser
call npm run dev

REM Alternative: If you want to explicitly open browser after a delay
REM timeout /t 3 /nobreak >nul
REM start http://localhost:3000

