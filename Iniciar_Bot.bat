@echo off
title Nebula Bot - Consola en Vivo
color 0B

echo ====================================================================
echo   INICIANDO NEBULA BOT - NEBULA DEV STUDIOS
echo ====================================================================
echo.

powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' } | Stop-Process -Force" >nul 2>&1

set "NODE_BIN=node"
if exist "C:\Program Files\nodejs\node.exe" set "NODE_BIN=C:\Program Files\nodejs\node.exe"

cd /d "C:\Users\renee\Documents\Nebula-Bot"

echo Conectando con Discord...
echo Puedes dejar esta ventana abierta para ver los comandos en vivo.
echo Para detener el bot, presiona CTRL+C o cierra esta ventana.
echo.

"%NODE_BIN%" src/index.js

echo.
echo ====================================================================
echo   [INFO] El proceso de Nebula Bot ha finalizado.
echo ====================================================================
echo Presiona cualquier tecla para salir...
pause >nul