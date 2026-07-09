@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo WindowOFHonor Windows 部署脚本
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-windows.ps1"
if errorlevel 1 (
    echo.
    echo 部署失败，请检查上方错误信息。
    pause
    exit /b 1
)
pause
