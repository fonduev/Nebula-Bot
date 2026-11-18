@echo off
setlocal EnableDelayedExpansion
title Nebula Bot - Centro de Control
color 0B

set "BOT_DIR=C:\Users\renee\Documents\Nebula-Bot"
set "NODE_BIN=node"
if exist "C:\Program Files\nodejs\node.exe" set "NODE_BIN=C:\Program Files\nodejs\node.exe"

:MENU
cls
echo ====================================================================
echo   NEBULA DEV STUDIOS - PANEL DE CONTROL DE NEBULA BOT
echo ====================================================================
echo.

powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' }; if ($p) { exit 100 } else { exit 0 }" >nul 2>&1
if "%ERRORLEVEL%"=="100" (
    echo   [ESTADO]  ONLINE - Bot en ejecucion activa
) else (
    echo   [ESTADO]  OFFLINE - Bot detenido
)
echo.
echo   [1] Iniciar Bot (Ventana activa con registro en vivo)
echo   [2] Iniciar Bot en segundo plano (Ventana minimizada)
echo   [3] Detener Bot (Apagar proceso)
echo   [4] Reiniciar Bot
echo   [5] Sincronizar / Actualizar Comandos Slash
echo   [6] Ver Estado detallado y procesos
echo   [0] Salir
echo.
echo ====================================================================
set /p OPCION="Selecciona una opcion [0-6]: "

if "%OPCION%"=="1" goto INICIAR_VIVO
if "%OPCION%"=="2" goto INICIAR_FONDO
if "%OPCION%"=="3" goto DETENER
if "%OPCION%"=="4" goto REINICIAR
if "%OPCION%"=="5" goto DEPLOY
if "%OPCION%"=="6" goto ESTADO
if "%OPCION%"=="0" goto SALIR

echo.
echo [!] Opcion invalida. Intenta de nuevo.
ping 127.0.0.1 -n 2 >nul
goto MENU

:INICIAR_VIVO
cls
echo ====================================================================
echo   INICIANDO NEBULA BOT (CONSOLA ACTIVA)
echo   Presiona CTRL+C para detener el bot.
echo ====================================================================
echo.
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' } | Stop-Process -Force" >nul 2>&1
cd /d "%BOT_DIR%"
title Nebula Bot - Consola Activa
"%NODE_BIN%" src/index.js
echo.
echo [INFO] El proceso de Nebula Bot ha finalizado.
pause
title Nebula Bot - Centro de Control
goto MENU

:INICIAR_FONDO
echo.
echo Cerrando instancias anteriores e iniciando en segundo plano...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' } | Stop-Process -Force" >nul 2>&1
cd /d "%BOT_DIR%"
start "Nebula Bot (Instancia)" /min cmd /c "title Nebula Bot (Instancia) & \"%NODE_BIN%\" src/index.js"
ping 127.0.0.1 -n 3 >nul
goto MENU

:DETENER
echo.
echo Deteniendo procesos de Nebula Bot...
powershell -NoProfile -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' }; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; Write-Host '[OK] Nebula Bot ha sido detenido correctamente.' -ForegroundColor Green } else { Write-Host '[INFO] No habia ninguna instancia del bot en ejecucion.' -ForegroundColor Yellow }"
ping 127.0.0.1 -n 2 >nul
goto MENU

:REINICIAR
echo.
echo Reiniciando Nebula Bot...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' } | Stop-Process -Force" >nul 2>&1
ping 127.0.0.1 -n 2 >nul
cd /d "%BOT_DIR%"
start "Nebula Bot (Instancia)" /min cmd /c "title Nebula Bot (Instancia) & \"%NODE_BIN%\" src/index.js"
echo [OK] Bot reiniciado correctamente en segundo plano.
ping 127.0.0.1 -n 3 >nul
goto MENU

:DEPLOY
cls
echo ====================================================================
echo   REGISTRANDO / DESPLEGANDO COMANDOS SLASH
echo ====================================================================
echo.
cd /d "%BOT_DIR%"
"%NODE_BIN%" src/deploy-commands.js
echo.
pause
goto MENU

:ESTADO
cls
echo ====================================================================
echo   ESTADO DETALLADO DE NEBULA BOT
echo ====================================================================
echo.
powershell -NoProfile -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -like '*src/index.js*' }; if ($procs) { Write-Host 'ESTADO: ONLINE' -ForegroundColor Green; foreach ($p in $procs) { Write-Host ('- PID: ' + $p.ProcessId + ' | Inicio: ' + $p.CreationDate) } } else { Write-Host 'ESTADO: OFFLINE (No hay procesos activos)' -ForegroundColor Red }"
echo.
pause
goto MENU

:SALIR
exit /b