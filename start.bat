@echo off
start http://localhost:8000
wsl -d Ubuntu-24.04 -- bash -lc "cd ~/myworkspace/personal-dashboard && python3 -m http.server 8000"
pause