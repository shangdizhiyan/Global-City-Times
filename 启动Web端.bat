@echo off
cd /d "%~dp0"
start "Trade API" cmd /k "cd /d %~dp0 && npm run api"
timeout /t 2 /nobreak >nul
start "Trade Web" cmd /k "cd /d %~dp0 && python -m http.server 4173 --bind 127.0.0.1 --directory dist"
timeout /t 3 /nobreak >nul
start http://127.0.0.1:4173
