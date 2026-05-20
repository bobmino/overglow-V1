@echo off
title Overglow V1 Launcher - Resource Optimized
echo ==========================================================
echo       OVERGLOW V1 - LAUNCHER WITH MEMORY LIMITS
echo ==========================================================
echo.
echo Limiting Node.js maximum RAM usage to 1024MB (1GB) per process...
echo This prevents memory leaks from crashing Windows.
echo.

set NODE_OPTIONS=--max-old-space-size=1024

echo Starting Backend server...
start "Overglow Backend - Port 5001" cmd /k "set NODE_OPTIONS=--max-old-space-size=1024 && echo Backend Dev Server (RAM Limit: 1GB) && echo. && npm run dev"

echo Starting Frontend Dev server...
start "Overglow Frontend - Port 5173" cmd /k "set NODE_OPTIONS=--max-old-space-size=1024 && echo Frontend Dev Server (RAM Limit: 1GB) && echo. && cd frontend && npm run dev"

echo.
echo ==========================================================
echo Dev servers launched! You can monitor them in the open windows.
echo Press any key to exit this launcher window.
echo ==========================================================
pause >nul
