@echo off
echo.
echo  ============================
echo   StudyFlow - Study Planner
echo  ============================
echo.
echo  Starting Backend Server...
start "StudyFlow Backend" cmd /k "cd /d "%~dp0server" && node server.js"
timeout /t 2 /nobreak >nul
echo  Starting Frontend...
start "StudyFlow Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"
echo.
echo  App launching...
echo  Frontend: http://localhost:3000
echo  Backend:  http://localhost:5000
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000
