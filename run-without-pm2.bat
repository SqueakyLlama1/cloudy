@echo off
cd /d "%~dp0"
call npm run start-no-pm2
call npm list
pause