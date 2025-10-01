const path = require('path');

// Load pg and dotenv from api's node_modules
const { Pool } = require(path.join(__dirname, '../node_modules/pg'));
const dotenv = require(path.join(__dirname, '../node_modules/dotenv'));

// Load environment variables from api/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkUserRole() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking user role...\n');

    // Check the specific user
    const result = await client.query(`
      SELECT id, email, first_name, last_name, role, is_active
      FROM users
      WHERE id = '2a6b3919-0146-4add-ab29-0e4fb6c018a5'
    `);

    if (result.rows.length > 0) {
      console.log('📋 User details:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ User not found');
    }

    // List all users with their roles
    console.log('\n📊 All users:');
    const allUsers = await client.query(`
      SELECT id, email, first_name, last_name, role, is_active
      FROM users
      ORDER BY email
    `);
    
    allUsers.rows.forEach(user => {
      console.log(`${user.email.padEnd(30)} | ${user.role.padEnd(30)} | ${user.is_active ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserRole();
