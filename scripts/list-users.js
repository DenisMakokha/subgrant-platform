const path = require('path');

// Load pg and dotenv from api's node_modules
const { Pool } = require(path.join(__dirname, '../api/node_modules/pg'));
const dotenv = require(path.join(__dirname, '../api/node_modules/dotenv'));

// Load environment variables from api/.env
dotenv.config({ path: path.join(__dirname, '../api/.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function listUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Fetching all users...\n');

    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.phone,
        u.created_at,
        o.name as organization_name,
        o.status as organization_status
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('❌ No users found in the database.');
      return;
    }

    console.log(`📋 Total Users: ${result.rows.length}\n`);
    console.log('═'.repeat(80));

    result.rows.forEach((user, index) => {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A';
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${fullName}`);
      console.log(`   Role: ${user.role || 'partner'}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Organization: ${user.organization_name || 'N/A'}`);
      console.log(`   Org Status: ${user.organization_status || 'N/A'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    });

    console.log('\n' + '═'.repeat(80));

    // Summary by role
    const roleCount = {};
    result.rows.forEach(user => {
      const role = user.role || 'partner';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    console.log('\n📊 Users by Role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('👥 User List Script\n');
listUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
