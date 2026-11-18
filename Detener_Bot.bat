@echo off
title Detener Nebula Bot
color 0C

cls
echo ====================================================================
echo   DETENIENDO NEBULA BOT - NEBULA DEV STUDIOS
echo ====================================================================
echo.

powershell -NoProfile -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' }; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; Write-Host '[OK] Nebula Bot ha sido detenido con exito.' -ForegroundColor Green } else { Write-Host '[INFO] No habia ninguna instancia de Nebula Bot en ejecucion.' -ForegroundColor Yellow }"

echo.
echo Presiona cualquier tecla para salir...
pause >nul