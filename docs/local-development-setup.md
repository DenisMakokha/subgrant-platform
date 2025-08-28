# Local Development Setup

This guide will help you set up the Sub-Grant Management Platform for local development.

## Running Without Docker

If you prefer to run the application without Docker, you can either follow the manual steps below or use the provided setup scripts.

### Using Setup Scripts

#### For Linux/Mac:
```bash
./scripts/manual-setup.sh
```

#### For Windows:
```bash
scripts\manual-setup.bat
```

These scripts will:
1. Check if PostgreSQL and Node.js are installed
2. Create necessary .env files
3. Set up the database (create database, user, and enable UUID extension)
4. Initialize database tables
5. Test the database connection
6. Install dependencies for both API and web frontend

### Starting the Services

After running the setup script or completing the manual setup steps, you can start the services:

#### Start the API Server
```bash
cd api
npm start
```

#### Start the Web Frontend
In a separate terminal:
```bash
cd web
npm start
```

The API will be available at http://localhost:3000
The web frontend will be available at http://localhost:3001

### 1. Database Setup

Make sure PostgreSQL is running and create the database and user:

```sql
-- Connect to PostgreSQL as superuser (password: makokha300) and run:
CREATE DATABASE subgrant_platform;
CREATE USER subgrant_user WITH PASSWORD 'subgrant_password';
GRANT ALL PRIVILEGES ON DATABASE subgrant_platform TO subgrant_user;
\c subgrant_platform;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Environment Configuration

Update the `api/.env` file with your database credentials if needed:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subgrant_platform
DB_USER=subgrant_user
DB_PASSWORD=subgrant_password
```

### 3. Initialize Database Tables

Run the database initialization script:
```bash
cd api
node scripts/init-db.js
```

### 3.1 Test Database Connection

After setting up the database, you can test the connection:
```bash
cd api
npm run test-db
```

This will verify that:
- The database is accessible with the provided credentials
- The UUID extension is working
- The required tables have been created

### 3.2 Test API Connection

After starting the API server, you can test the connection:
```bash
cd api
npm run test-api
```

This will verify that:
- The API server is running and accessible
- The API is returning the expected response

### 4. Install Dependencies

Install dependencies for both API and web frontend:
```bash
# In api directory
cd api
npm install

# In web directory
cd ../web
npm install
```

### 5. Start the Services

Start both the API and web frontend:
```bash
# In api directory
cd api
npm start

# In another terminal, in web directory
cd web
npm start
```

The API will be available at http://localhost:3000
The web frontend will be available at http://localhost:3001

## Prerequisites

1. Node.js (version 14 or higher)
2. PostgreSQL (version 12 or higher)
3. Git

## Database Setup

### 1. Install PostgreSQL

If you haven't already installed PostgreSQL, download and install it from the official website:
https://www.postgresql.org/download/

### 2. Create Database and User

You can either manually create the database and user or use the provided setup script.

#### Option 1: Manual Setup

Connect to PostgreSQL as a superuser and run the following commands:

```sql
-- Create the database
CREATE DATABASE subgrant_platform;

-- Create the user
CREATE USER subgrant_user WITH PASSWORD 'subgrant_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE subgrant_platform TO subgrant_user;

-- Connect to the database
\c subgrant_platform;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Option 2: Automated Setup

Run the provided setup script:
```bash
cd api
node scripts/setup-db.js
```

### 3. Configure Environment Variables

Copy the example environment file and update the values as needed:

```bash
cd api
cp .env.example .env
```

Update the `.env` file with your database credentials if they differ from the defaults:

```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subgrant_platform
DB_USER=subgrant_user
DB_PASSWORD=subgrant_password
```

### 4. Initialize Database Tables

Run the database initialization script:

```bash
cd api
node scripts/init-db.js
```

## API Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Start the API Server

```bash
npm start
```

The API will be available at http://localhost:3000

## Web Frontend Setup

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Start the Development Server

```bash
npm start
```

The web frontend will be available at http://localhost:3001

## Default User

After running the initialization script, a default admin user will be created:

- Email: admin@example.com
- Password: password123

Note: For security reasons, you should change this password after your first login.

To change the default password, you can either:
1. Log in with the default credentials and change the password through the user profile page
2. Update the password hash directly in the database
3. Modify the init-db.js script to use a different default password

## Development Workflow

1. Make sure both the API and web frontend servers are running
2. Access the application at http://localhost:3001
3. Log in with the default admin user
4. Start developing!

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check that the database, user, and password match your configuration
3. Verify that the `uuid-ossp` extension is enabled

### API Issues

1. Check that all dependencies are installed
2. Verify environment variables are correctly set
3. Check the console for error messages

### Web Frontend Issues

1. Ensure the API server is running
2. Check that the API endpoint is correctly configured in the frontend