@echo off
echo Starting MealMate application...

REM Kill any processes running on the needed ports
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

REM Start the Flask server
echo Starting Flask server...
cd flask-server
if not exist "venv" (
    echo Virtual environment not found. Please run install_dependencies.bat first
    exit /b 1
)

REM Start Flask in the background
start /B cmd /c "venv\Scripts\activate.bat && set FLASK_APP=app.py && set FLASK_ENV=development && python app.py"
cd ..

REM Start the Next.js server
echo Starting Next.js server...
cd client
if not exist "node_modules" (
    echo Installing Next.js dependencies...
    call npm install
)

REM Start Next.js in the background
start /B cmd /c "npm run dev"
cd ..

echo.
echo ✨ Both servers are now running!
echo - Next.js Frontend: http://localhost:3000
echo - Flask Backend: http://localhost:5000/api/status
echo - Press Ctrl+C to stop both servers
echo.

REM Keep the script running
:loop
timeout /t 1 >nul
goto loop 