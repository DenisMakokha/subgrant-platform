const db = require('../config/database');

async function simpleTest() {
  try {
    // First, let's check if we have any users
    const usersResult = await db.pool.query('SELECT id, role FROM users LIMIT 5');
    console.log('Available users:', usersResult.rows);

    if (usersResult.rows.length === 0) {
      console.log('No users found. Creating a test user...');
      
      // Create a test partner user
      const createUserResult = await db.pool.query(`
        INSERT INTO users (first_name, last_name, email, role, password_hash)
        VALUES ('Test', 'Partner', 'test@partner.com', 'partner_user', 'dummy_hash')
        RETURNING id, email, role
      `);
      
      console.log('Created test user:', createUserResult.rows[0]);
    }

    // Get a partner user
    const partnerResult = await db.pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['partner_user']);
    
    if (partnerResult.rows.length === 0) {
      console.log('No partner users found');
      return;
    }

    const userId = partnerResult.rows[0].id;
    console.log('Using partner user ID:', userId);

    // Create a simple notification directly with SQL
    const insertResult = await db.pool.query(`
      INSERT INTO notifications (user_id, title, message, type, category, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      userId,
      'Test Notification',
      'This is a test notification from the database',
      'info',
      'system',
      'medium'
    ]);

    console.log('Created notification:', insertResult.rows[0]);

    // Fetch notifications for this user
    const fetchResult = await db.pool.query(`
      SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);

    console.log('User notifications:', fetchResult.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

simpleTest();
