#!/bin/bash

# Sub-Grant Management Platform Manual Setup Script
# This script helps set up the development environment without Docker

echo "Sub-Grant Management Platform Manual Setup"
echo "=========================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null
then
    echo "PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "PostgreSQL and Node.js are installed."

# Create .env files if they don't exist
if [ ! -f "api/.env" ]; then
    echo "Creating api/.env file..."
    cp api/.env.example api/.env
    echo "API .env file created. Please review and update as needed."
fi

if [ ! -f "web/.env" ]; then
    echo "Creating web/.env file..."
    cp web/.env.example web/.env 2>/dev/null || echo "REACT_APP_API_URL=http://localhost:3000/api" > web/.env
    echo "Web .env file created. Please review and update as needed."
fi

# Database setup
echo "Setting up database..."
echo "Please enter PostgreSQL superuser password when prompted (default: makokha300)"

# Create database and user
psql -U postgres -h localhost -c "CREATE DATABASE subgrant_platform;" 2>/dev/null || echo "Database already exists or creation failed"
psql -U postgres -h localhost -c "CREATE USER subgrant_user WITH PASSWORD 'subgrant_password';" 2>/dev/null || echo "User already exists or creation failed"
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE subgrant_platform TO subgrant_user;" 2>/dev/null || echo "Failed to grant privileges"
psql -U postgres -h localhost -d subgrant_platform -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || echo "Failed to create UUID extension"

# Initialize database tables
echo "Initializing database tables..."
cd api
node scripts/init-db.js

# Test database connection
echo "Testing database connection..."
npm run test-db
cd ..

# Install dependencies
echo "Installing dependencies..."
cd api
npm install
cd ../web
npm install
cd ..

echo ""
echo "Manual setup completed!"
echo "======================"
echo "To start the services:"
echo "1. In one terminal, run: cd api && npm start"
echo "2. In another terminal, run: cd web && npm start"
echo ""
echo "After starting the services, you can test the API:"
echo "cd api && npm run test-api"
echo ""
echo "The API will be available at http://localhost:3000"
echo "The web frontend will be available at http://localhost:3001"