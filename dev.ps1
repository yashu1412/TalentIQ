# Talent-IQ Dev Environment Start Script (Non-Docker)

# Ensure environments are initialized
if (!(Test-Path "frontend/.env.local") -or !(Test-Path "backend/.env")) {
    Write-Host "Running init.ps1 first..."
    .\init.ps1
}

# Run frontend and backend in separate terminals
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn src.main:app --reload --port 8000"

Write-Host "Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services are starting in new windows. Happy coding!"
