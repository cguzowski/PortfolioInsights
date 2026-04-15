@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

if not exist "%BACKEND_DIR%\gradlew.bat" (
    echo Backend launcher not found at "%BACKEND_DIR%\gradlew.bat".
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo Frontend package.json not found at "%FRONTEND_DIR%\package.json".
    exit /b 1
)

echo Starting backend on http://localhost:8080 ...
start "Atlas Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && gradlew.bat bootRun"

echo Starting frontend on http://localhost:4200 ...
start "Atlas Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npx ng serve"

echo Both services are launching in separate windows.
echo Backend:  http://localhost:8080/api/portfolio
echo Frontend: http://localhost:4200

endlocal
