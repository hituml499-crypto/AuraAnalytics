@echo off
title AuraAnalytics Suite Runner
echo ====================================================
echo               AuraAnalytics Project Runner
echo ====================================================
echo.

echo [1/4] Installing and verifying Python dependencies...
python -m pip install pandas numpy scikit-learn
if %errorlevel% neq 0 (
    echo Python package installation failed. Please verify Python is installed and added to PATH.
    pause
    exit /b %errorlevel%
)
echo.

echo [2/4] Executing Data Science Pipeline...
echo Running generator.py...
python pipeline/generator.py
if %errorlevel% neq 0 (
    echo generator.py failed.
    pause
    exit /b %errorlevel%
)

echo Running analyzer.py...
python pipeline/analyzer.py
if %errorlevel% neq 0 (
    echo analyzer.py failed.
    pause
    exit /b %errorlevel%
)

echo Running ml_models.py...
python pipeline/ml_models.py
if %errorlevel% neq 0 (
    echo ml_models.py failed.
    pause
    exit /b %errorlevel%
)
echo.

echo [3/4] Copying data output to React dashboard...
if not exist "dashboard\src\data" mkdir "dashboard\src\data"
copy /Y pipeline\data\*.json dashboard\src\data\
if %errorlevel% neq 0 (
    echo File copy failed.
    pause
    exit /b %errorlevel%
)
echo.

echo [4/4] Starting React dashboard dev server...
cd dashboard
echo Installing node modules...
call npm install
echo.
echo Launching dev server...
echo Please open http://localhost:5173 in your browser.
call npm run dev
if %errorlevel% neq 0 (
    echo Dev server failed to start.
    pause
    exit /b %errorlevel%
)

pause
