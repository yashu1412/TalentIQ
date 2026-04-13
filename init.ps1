# Talent-IQ Project Initializer

# Create frontend .env.local if not exists
if (-not (Test-Path "frontend/.env.local")) {
    Write-Host "Creating frontend/.env.local..."
    New-Item -ItemType File -Path "frontend/.env.local"
    Add-Content -Path "frontend/.env.local" -Value "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder"
    Add-Content -Path "frontend/.env.local" -Value "CLERK_SECRET_KEY=sk_test_placeholder"
    Add-Content -Path "frontend/.env.local" -Value "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in"
    Add-Content -Path "frontend/.env.local" -Value "NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up"
    Add-Content -Path "frontend/.env.local" -Value "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard"
    Add-Content -Path "frontend/.env.local" -Value "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding"
    Add-Content -Path "frontend/.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:8000"
}

# Create backend .env if not exists
if (-not (Test-Path "backend/.env")) {
    Write-Host "Creating backend/.env..."
    New-Item -ItemType File -Path "backend/.env"
    Add-Content -Path "backend/.env" -Value "CLERK_SECRET_KEY=sk_test_placeholder"
    Add-Content -Path "backend/.env" -Value "DATABASE_URL=postgresql+asyncpg://user:password@localhost/talent_iq"
    Add-Content -Path "backend/.env" -Value "REDIS_URL=redis://localhost:6379/0"
    Add-Content -Path "backend/.env" -Value "OPENAI_API_KEY=sk-placeholder"
    Add-Content -Path "backend/.env" -Value "GOOGLE_API_KEY=placeholder"
    Add-Content -Path "backend/.env" -Value "STREAM_API_KEY=placeholder"
    Add-Content -Path "backend/.env" -Value "STREAM_API_SECRET=placeholder"
}

Write-Host "Initialization complete. Run 'docker-compose up --build' to start the project."
