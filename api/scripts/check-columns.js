const db = require('../config/database');

async function checkColumns() {
  try {
    const result = await db.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('Notifications table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Also check if we have any users
    const usersResult = await db.pool.query('SELECT id, email, role FROM users LIMIT 3');
    console.log('\nAvailable users:');
    usersResult.rows.forEach(user => {
      console.log(`- ${user.id}: ${user.email} (${user.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
