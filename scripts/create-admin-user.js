const path = require('path');

// Load dependencies from api's node_modules
const { Pool } = require(path.join(__dirname, '../api/node_modules/pg'));
const bcrypt = require(path.join(__dirname, '../api/node_modules/bcryptjs'));
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

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    // Get credentials from command line or use defaults
    const email = process.argv[2] || 'admin@subgrant.com';
    const password = process.argv[3] || 'Admin@123';
    const firstName = process.argv[4] || 'System';
    const lastName = process.argv[5] || 'Administrator';

    console.log('🔧 Creating admin user...\n');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`🔑 Password: ${password}`);
    console.log('');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists!');
      console.log(`   Email: ${existingUser.rows[0].email}`);
      console.log(`   Current Role: ${existingUser.rows[0].role}`);
      
      // Update to admin if not already
      if (existingUser.rows[0].role !== 'admin') {
        await client.query(
          'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['admin', existingUser.rows[0].id]
        );
        console.log('\n✅ Updated existing user to admin role!');
      } else {
        console.log('\n✅ User is already an admin!');
      }
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, first_name, last_name, role`,
      [email, hashedPassword, firstName, lastName, 'admin']
    );

    const newUser = result.rows[0];

    const fullName = [newUser.first_name, newUser.last_name].filter(Boolean).join(' ');
    console.log('\n✅ Admin user created successfully!\n');
    console.log('═'.repeat(50));
    console.log(`📧 Email: ${newUser.email}`);
    console.log(`👤 Name: ${fullName}`);
    console.log(`🎭 Role: ${newUser.role}`);
    console.log(`🆔 User ID: ${newUser.id}`);
    console.log('═'.repeat(50));
    console.log('\n💡 You can now log in with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🚀 Create Admin User Script\n');
console.log('Usage: node scripts/create-admin-user.js [email] [password] [fullName]\n');

createAdminUser().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
