@echo off
for %%P in (4173 8787) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    taskkill /PID %%I /F >nul 2>nul
  )
)
echo Web and API ports closed if they were running.
