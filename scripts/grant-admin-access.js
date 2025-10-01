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

async function grantAdminAccess() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Searching for users...\n');

    // Get all users
    const usersResult = await client.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in the database.');
      return;
    }

    console.log('📋 Available users:\n');
    usersResult.rows.forEach((user, index) => {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A';
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${fullName}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Organization: ${user.organization_name || 'N/A'}`);
      console.log('');
    });

    // For automation, grant admin to first user or use email from command line
    const emailArg = process.argv[2];
    let targetUser;

    if (emailArg) {
      targetUser = usersResult.rows.find(u => u.email.toLowerCase() === emailArg.toLowerCase());
      if (!targetUser) {
        console.log(`❌ User with email "${emailArg}" not found.`);
        return;
      }
    } else {
      // Default to first user
      targetUser = usersResult.rows[0];
      console.log(`ℹ️  No email provided. Granting admin access to first user: ${targetUser.email}`);
    }

    console.log(`\n🔧 Granting admin access to: ${targetUser.email}\n`);

    // Update user role to admin
    await client.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['admin', targetUser.id]
    );

    const fullName = [targetUser.first_name, targetUser.last_name].filter(Boolean).join(' ') || 'N/A';
    console.log('✅ Successfully granted admin access!');
    console.log(`\n📧 User: ${targetUser.email}`);
    console.log(`👤 Name: ${fullName}`);
    console.log(`🎭 New Role: admin`);
    console.log(`\n💡 You can now log in with admin privileges.`);

  } catch (error) {
    console.error('❌ Error granting admin access:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
console.log('🚀 Admin Access Grant Script\n');
console.log('Usage: node scripts/grant-admin-access.js [email]\n');

grantAdminAccess().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
