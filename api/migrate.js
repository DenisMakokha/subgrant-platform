const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'subgrant_user',
  host: 'localhost',
  database: 'subgrant_platform', 
  password: 'subgrant_password',
  port: 5432,
});

(async () => {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Testing connection...');
    await client.query('SELECT 1');
    console.log('Database connected successfully');
    
    console.log('Reading SQL file...');
    const sqlPath = 'scripts/create_forum_tables.sql';
    console.log('SQL path:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`SQL file loaded (${sql.length} characters)`);
    
    console.log('Executing migration...');
    await client.query(sql);
    
    console.log('✅ Forum migration completed successfully!');
    console.log('Created:');
    console.log('- 6 Forum categories');
    console.log('- 16 Forum tags');
    console.log('- All Forum database tables');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('PostgreSQL server is not running');
    } else if (error.code === '28P01') {
      console.error('Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      console.error('Database does not exist');
    }
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
})();
