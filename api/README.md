# Sub-Grant Management Platform API

This is the backend API for the Sub-Grant Management Platform, built with Node.js, Express, and PostgreSQL.

## Features

- User authentication with JWT tokens
- Role-based access control (RBAC)
- Organization and user management
- Notification system with email delivery
- Secure password handling with bcrypt
- Multi-Factor Authentication (MFA) support

## Prerequisites

- Node.js (v12 or higher)
- PostgreSQL (v10 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd subgrant-platform/api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration values.

4. Start the PostgreSQL database and create the database specified in your `.env` file.

5. Run database initialization script:
   ```
   node scripts/init-db.js
   ```

6. Start the server:
   ```
   npm start
   ```

   For development:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify MFA token

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization by ID
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications` - Create notification (admin only)

## Development

### Scripts
- `npm start` - Start the server
- `npm run dev` - Start the server with nodemon for development
- `npm test` - Run tests

### Database

The database schema is defined in `scripts/init-db.js`. To initialize the database:

```
node scripts/init-db.js
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

This project is licensed under the MIT License.