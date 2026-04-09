@echo off
echo Starting Smart Ration Shop with ML Integration...
echo.

echo Starting Node.js Server...
start "Node.js Server" cmd /k "cd /d %~dp0 && npm install && node server.js"

echo.
echo Starting Python ML Service...
timeout /t 3 /nobreak > nul
start "ML Service" cmd /k "cd /d %~dp0 && pip install -r ml/requirements.txt && python ml_service.py"

echo.
echo Both servers are starting...
echo Node.js: http://localhost:3000
echo ML Service: http://localhost:5001
echo.
echo Press any key to exit...
pause > nul