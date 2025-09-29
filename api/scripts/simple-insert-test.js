const db = require('../config/database');

async function testInsert() {
  try {
    // Get a user
    const userResult = await db.pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('No users found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('Using user ID:', userId);
    
    // Try the insert with minimal data
    console.log('Testing insert...');
    const insertResult = await db.pool.query(`
      INSERT INTO notifications (user_id, channel, template_key)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, channel, template_key, created_at
    `, [userId, 'in_app', 'test']);
    
    console.log('Insert successful!', insertResult.rows[0]);

    // Clean up
    await db.pool.query('DELETE FROM notifications WHERE id = $1', [insertResult.rows[0].id]);
    console.log('Test notification cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Detail:', error.detail);
    console.error('Hint:', error.hint);
    process.exit(1);
  }
}

testInsert();
