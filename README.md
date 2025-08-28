# Sub-Grant Management Platform

A comprehensive cloud platform that digitizes the entire sub-grant lifecycle end-to-end.

## Overview

This platform manages the complete sub-grant lifecycle including:
- Partner onboarding and profile management
- Grant/project setup and management
- Budgeting with multi-tier approvals
- Digital contracting with DocuSign integration
- Disbursements with Xero accounting integration
- Monitoring & Evaluation (M&E)
- Financial retirement and reconciliation
- Reporting and analytics
- Document management with versioning and audit trails

## System Components

1. **Core Web Application** - Main user interface for all roles
2. **API Services** - RESTful API services for backend functionality
3. **Workflow Engine** - Manages state transitions and business processes
4. **Integration Layer** - Connects with DocuSign and Xero
5. **Notification System** - Handles all system alerts and reminders
6. **Reporting Engine** - Generates operational and financial reports
7. **Security Framework** - Implements RBAC and audit logging
8. **Document Management** - Central cloud storage with version control

## Project Structure

```
subgrant-platform/
├── api/                 # RESTful API services
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   ├── scripts/         # Database scripts
│   ├── tests/           # Unit and integration tests
│   ├── Dockerfile       # API Docker configuration
│   └── package.json     # API dependencies
├── web/                 # Web frontend application
│   ├── public/          # Static assets
│   ├── src/             # Source code
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React context providers
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   ├── utils/       # Utility functions
│   │   ├── App.tsx      # Main application component
│   │   └── index.tsx    # Entry point
│   ├── Dockerfile       # Web Docker configuration
│   └── package.json     # Web dependencies
├── docs/                # Documentation
├── docker-compose.yml   # Docker Compose configuration
└── README.md            # This file
```

## Technology Stack

### Backend (API)
- Node.js with Express
- PostgreSQL database
- Redis for caching and sessions
- JWT for authentication
- Docker for containerization

### Frontend (Web)
- React.js with TypeScript
- React Router for navigation
- CSS Modules for styling
- Docker for containerization

## Local Development Setup

The platform can be fully developed and tested on a local machine before deployment. Follow these steps to set up your local development environment:

### Prerequisites
- Docker and Docker Compose
- Git
- Code editor (VS Code recommended)

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd subgrant-platform

# Option 1: Use the Docker setup script (Linux/Mac)
./scripts/setup.sh

# Option 2: Use the Docker setup script (Windows)
scripts\setup.bat

# Option 3: Use the manual setup script (Linux/Mac)
./scripts/manual-setup.sh

# Option 4: Use the manual setup script (Windows)
scripts\manual-setup.bat

# Option 5: Manual setup with Docker Compose
docker-compose up -d

# The services will be available at:
# API: http://localhost:3000
# Web: http://localhost:3001
```

### Manual Setup (without Docker)
If you prefer to run services manually without Docker:

#### Prerequisites
- PostgreSQL (superuser password: makokha300)
- Node.js (version 14 or higher)

#### Database Setup
1. Create the database and user:
   ```sql
   -- Connect to PostgreSQL as superuser and run:
   CREATE DATABASE subgrant_platform;
   CREATE USER subgrant_user WITH PASSWORD 'subgrant_password';
   GRANT ALL PRIVILEGES ON DATABASE subgrant_platform TO subgrant_user;
   \c subgrant_platform;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. Initialize database tables:
   ```bash
   cd api
   node scripts/init-db.js
   ```

#### API Setup
```bash
cd api
npm install
npm start
```

#### Web Setup
```bash
cd web
npm install
npm start
```

The API will be available at http://localhost:3000
The web frontend will be available at http://localhost:3001

## Documentation

All technical documentation is available in the [docs](docs/) directory:

1. [Architecture Summary](docs/architecture-summary.md)
2. [Technical Specification](docs/technical-specification.md)
3. [System Architecture](docs/system-architecture.md)
4. [Data Model](docs/data-model.md)
5. [Authentication and Authorization](docs/auth-authorization.md)
6. [Third-Party Integrations](docs/integrations.md)
7. [Module Specifications](docs/module-specifications.md)
8. [Workflow Engine](docs/workflow-engine.md)
9. [Reporting and Analytics](docs/reporting-analytics.md)
10. [Security and Compliance](docs/security-compliance.md)
11. [Implementation Roadmap](docs/implementation-roadmap.md)
12. [Local Development Setup](docs/local-development-setup.md)

## Deployment

The platform can be deployed to cloud environments (AWS, Azure, GCP) using the Docker Compose configuration or by deploying individual services.

For local development, all services can run on a developer's machine using Docker.

## Contributing

This project is designed to be developed by a team of developers following the implementation roadmap. For any questions or suggestions, please contact the system architect.

## License

This is proprietary software designed for a specific organization. All rights reserved.