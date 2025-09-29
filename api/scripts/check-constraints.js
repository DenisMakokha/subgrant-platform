const db = require('../config/database');

async function checkConstraints() {
  try {
    // Check table constraints
    const constraintsResult = await db.pool.query(`
      SELECT constraint_name, constraint_type, column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'notifications'
    `);
    
    console.log('Notifications table constraints:');
    constraintsResult.rows.forEach(row => {
      console.log(`- ${row.constraint_name}: ${row.constraint_type} (${row.column_name})`);
    });

    // Check column details
    const columnsResult = await db.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumn details:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Try a simple insert to see what fails
    console.log('\nTesting simple insert...');
    
    // First get a user
    const userResult = await db.pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('No users found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('Using user ID:', userId);
    
    // Try the insert
    const insertResult = await db.pool.query(`
      INSERT INTO notifications (user_id, channel, template_key, payload_json)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [userId, 'in_app', 'test', JSON.stringify({title: 'Test'})]);
    
    console.log('Insert successful! ID:', insertResult.rows[0].id);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkConstraints();
