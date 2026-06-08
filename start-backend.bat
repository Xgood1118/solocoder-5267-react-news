@echo off
echo ========================================
echo   News Aggregator - Backend Start
echo ========================================
echo.

cd /d "%~dp0backend"

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo Installing dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
)

echo.
echo Starting backend server on http://localhost:8000
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
