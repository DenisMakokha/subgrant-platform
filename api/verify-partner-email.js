const logger = require('utils/logger');

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_platform',
  user: process.env.DB_USER || 'subgrant_user',
  password: process.env.DB_PASSWORD || 'subgrant_password',
});

async function verifyPartnerEmail() {
  try {
    // Verify email for partner@test.com
    const updateResult = await pool.query(
      `UPDATE users SET email_verified_at = NOW() 
       WHERE email = $1
       RETURNING id, email, role, email_verified_at, status`,
      ['partner@test.com']
    );
    
    if (updateResult.rows.length > 0) {
      logger.info('Partner email verified successfully:', updateResult.rows[0]);
    } else {
      logger.info('Partner user not found with email: partner@test.com');
    }
  } catch (error) {
    logger.error('Error verifying partner email:', error);
  } finally {
    await pool.end();
  }
}

verifyPartnerEmail();
