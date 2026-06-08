@echo off
echo ========================================
echo   News Aggregator - Frontend Start
echo ========================================
echo.

cd /d "%~dp0frontend"

if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting frontend dev server on http://localhost:3000
echo.
npm run dev

pause
