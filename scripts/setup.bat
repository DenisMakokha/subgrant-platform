@echo off
title Sub-Grant Management Platform Setup

echo Sub-Grant Management Platform Setup
echo ===================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo Docker and Docker Compose are installed.

REM Create .env files if they don't exist
if not exist "api\.env" (
    echo Creating api/.env file...
    copy "api\.env.example" "api\.env"
    echo API .env file created. Please review and update as needed.
)

if not exist "web\.env" (
    echo Creating web/.env file...
    if exist "web\.env.example" (
        copy "web\.env.example" "web\.env"
    ) else (
        echo REACT_APP_API_URL=http://localhost:3000/api > "web\.env"
    )
    echo Web .env file created. Please review and update as needed.
)

REM Start Docker Compose
echo Starting Docker Compose...
docker-compose up -d

REM Wait a moment for services to start
timeout /t 10 /nobreak >nul

REM Test database connection
echo Testing database connection...
cd api
npm run test-db
cd ..

echo.
echo Setup completed!
echo ================
echo The services are now running in the background.
echo API: http://localhost:3000
echo Web: http://localhost:3001
echo.
echo To stop the services, run: docker-compose down
echo To view logs, run: docker-compose logs -f
echo.
pause