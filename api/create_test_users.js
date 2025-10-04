const bcrypt = require('bcryptjs');
const db = require('./config/database');
const logger = require('utils/logger');

async function createTestUsers() {
  try {
    // Generate password hash
    const passwordHash = await bcrypt.hash('password', 10);
    logger.info('Generated hash:', passwordHash);
    logger.info('Hash length:', passwordHash.length);

    // Clear existing users and create test users
    await db.pool.query('DELETE FROM users');
    
    const users = [
      { first_name: 'System', last_name: 'Admin', email: 'admin@subgrant.com', role: 'admin' },
      { first_name: 'Partner', last_name: 'User', email: 'partner@subgrant.com', role: 'partner_user' },
      { first_name: 'Grants', last_name: 'Manager', email: 'gm@subgrant.com', role: 'grants_manager' },
      { first_name: 'Chief', last_name: 'Operations Officer', email: 'coo@subgrant.com', role: 'chief_operations_officer' },
      { first_name: 'Donor', last_name: 'Representative', email: 'donor@subgrant.com', role: 'donor' }
    ];

    for (const user of users) {
      const result = await db.pool.query(
        'INSERT INTO users (first_name, last_name, email, role, password_hash, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user.first_name, user.last_name, user.email, user.role, passwordHash, 'active']
      );
      logger.info(`Created user: ${result.rows[0].email} (${result.rows[0].role})`);
      logger.info(`Stored hash length: ${result.rows[0].password_hash.length}`);
    }

    // Test password validation
    const testUser = await db.pool.query('SELECT * FROM users WHERE email = $1', ['admin@subgrant.com']);
    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      const isValid = await bcrypt.compare('password', user.password_hash);
      logger.info('Password validation test:', isValid);
    }

    logger.info('Test users created successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
