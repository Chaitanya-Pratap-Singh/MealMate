@echo off
echo Installing project dependencies...

REM Install backend dependencies
echo Setting up Flask backend...
cd flask-server

REM Create uploads directory
if not exist "uploads" mkdir uploads

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment. Make sure Python is installed.
        exit /b 1
    )
)

REM Activate and install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
deactivate
cd ..

REM Install frontend dependencies
echo Setting up Next.js frontend...
cd client
call npm install
cd ..

echo Dependencies installation completed!

echo.
echo IMPORTANT: Make sure you have set up your environment files:
echo - flask-server\.env
echo - client\.env.local
echo.
echo See the README.md for required environment variables.
echo.
echo To run the project, use: run.bat 