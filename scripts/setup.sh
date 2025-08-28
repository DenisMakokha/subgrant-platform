#!/bin/bash

# Sub-Grant Management Platform Setup Script
# This script helps set up the development environment

echo "Sub-Grant Management Platform Setup"
echo "==================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "Docker and Docker Compose are installed."

# Check if we're on Windows (Git Bash) or Linux/Mac
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "Running on Windows (Git Bash)"
    IS_WINDOWS=1
else
    echo "Running on Linux/Mac"
    IS_WINDOWS=0
fi

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

# Start Docker Compose
echo "Starting Docker Compose..."
docker-compose up -d

# Wait a moment for services to start
sleep 10

# Test database connection
echo "Testing database connection..."
cd api
npm run test-db
cd ..

echo ""
echo "Setup completed!"
echo "================"
echo "The services are now running in the background."
echo "API: http://localhost:3000"
echo "Web: http://localhost:3001"
echo ""
echo "To stop the services, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"