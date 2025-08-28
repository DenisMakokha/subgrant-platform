@echo off
title Sub-Grant Management Platform Manual Setup

echo Sub-Grant Management Platform Manual Setup
echo ==========================================

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL is not installed. Please install PostgreSQL first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo PostgreSQL and Node.js are installed.

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

REM Database setup
echo Setting up database...
echo Please enter PostgreSQL superuser password when prompted (default: makokha300)

REM Create database and user
psql -U postgres -h localhost -c "CREATE DATABASE subgrant_platform;" 2>nul || echo Database already exists or creation failed
psql -U postgres -h localhost -c "CREATE USER subgrant_user WITH PASSWORD 'subgrant_password';" 2>nul || echo User already exists or creation failed
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE subgrant_platform TO subgrant_user;" 2>nul || echo Failed to grant privileges
psql -U postgres -h localhost -d subgrant_platform -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>nul || echo Failed to create UUID extension

REM Initialize database tables
echo Initializing database tables...
cd api
node scripts/init-db.js

REM Test database connection
echo Testing database connection...
npm run test-db
cd ..

REM Install dependencies
echo Installing dependencies...
cd api
npm install
cd ../web
npm install
cd ..

echo.
echo Manual setup completed!
echo ======================
echo To start the services:
echo 1. In one terminal, run: cd api && npm start
echo 2. In another terminal, run: cd web && npm start
echo.
echo After starting the services, you can test the API:
echo cd api && npm run test-api
echo.
echo The API will be available at http://localhost:3000
echo The web frontend will be available at http://localhost:3001
echo.
pause