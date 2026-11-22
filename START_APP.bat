@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo  CarPrice AI - starting Flask API and React dev server
echo ============================================================

if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYEXE=%~dp0backend\.venv\Scripts\python.exe"
) else (
    set "PYEXE=python"
)

echo [1/2] Starting Flask API on http://127.0.0.1:5000
start "CarPrice Flask API" /D "%~dp0backend" cmd /k ""%PYEXE%" app.py"

echo [2/2] Starting React UI on http://localhost:5173
if not exist "%~dp0frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd "%~dp0frontend"
    call npm install
    popd
)
start "CarPrice React UI" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting. Open http://localhost:5173 in your browser.
echo Close the two server windows to stop the app.
endlocal
