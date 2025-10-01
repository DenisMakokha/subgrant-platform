# Admin Scripts

Utility scripts for managing the SubGrant Platform.

## Prerequisites

Make sure you have:
- Node.js installed
- Database configured in `api/.env`
- Required npm packages installed in the `api` directory:
  ```bash
  cd api
  npm install
  ```

**Note:** These scripts use dependencies from the `api/node_modules` directory, so make sure the API dependencies are installed first.

## Available Scripts

### 1. Grant Admin Access

Grant admin privileges to an existing user.

```bash
# Grant admin to specific user by email
node scripts/grant-admin-access.js user@example.com

# Grant admin to first user (default)
node scripts/grant-admin-access.js
```

**What it does:**
- Lists all users in the database
- Updates the specified user's role to 'admin'
- Shows confirmation with user details

---

### 2. Create Admin User

Create a new admin user from scratch.

```bash
# Create with custom credentials
node scripts/create-admin-user.js admin@example.com SecurePassword123 "Admin Name"

# Create with default credentials
node scripts/create-admin-user.js
```

**Default credentials:**
- Email: `admin@subgrant.com`
- Password: `Admin@123`
- Name: `System Administrator`

**What it does:**
- Checks if user already exists
- Creates new admin user with hashed password
- If user exists, updates their role to admin

---

### 3. List Users

View all users in the database.

```bash
node scripts/list-users.js
```

**What it does:**
- Displays all users with their details
- Shows organization information
- Provides summary by role

**Output includes:**
- User ID
- Email
- Full name
- Role
- Phone
- Organization name and status
- Creation date
- Summary statistics by role

---

## Common Use Cases

### First-Time Setup

Create your first admin user:
```bash
node scripts/create-admin-user.js admin@yourcompany.com YourPassword123 "Your Name"
```

### Promote Existing User

Grant admin access to an existing partner user:
```bash
node scripts/grant-admin-access.js partner@example.com
```

### Check User List

View all users and their roles:
```bash
node scripts/list-users.js
```

---

## Troubleshooting

### Database Connection Error

Make sure your `api/.env` file has correct database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subgrant_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### Module Not Found

Install dependencies in the api directory:
```bash
cd api
npm install
```

### Permission Denied

Make sure scripts are executable (Unix/Mac):
```bash
chmod +x scripts/*.js
```

---

## Security Notes

⚠️ **Important:**
- Never commit passwords to version control
- Use strong passwords for admin accounts
- Change default passwords immediately after first login
- Keep admin access limited to trusted users
- Regularly audit user roles and permissions

---

## Additional Scripts

### Setup Scripts

- `setup.sh` / `setup.bat` - Initial project setup
- `manual-setup.sh` / `manual-setup.bat` - Manual database setup

---

## Support

For issues or questions, contact the development team or check the main project README.
