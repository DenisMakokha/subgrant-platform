const db = require('../config/database');

async function checkSpecificMigrations() {
  const client = await db.pool.connect();
  
  try {
    console.log('Checking specific migrations...\n');
    
    // Check fund request tables
    const fundRequestTables = [
      'fund_requests',
      'approval_policies',
      'approvals',
      'approval_comments',
      'approval_docs'
    ];
    
    console.log('Checking fund request related tables...\n');
    
    for (const table of fundRequestTables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = $1
          ) as exists
        `, [table]);
        
        if (result.rows[0].exists) {
          console.log(`✅ ${table} table exists`);
        } else {
          console.log(`❌ ${table} table does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${table} table:`, error.message);
      }
    }
    
    // Check role and dashboard tables
    const roleDashboardTables = [
      'roles_registry',
      'dashboards_registry',
      'users_roles',
      'dashboards_active'  // This is a view
    ];
    
    console.log('\nChecking role and dashboard related tables/views...\n');
    
    for (const table of roleDashboardTables) {
      try {
        // For views, we need to check in a different way
        if (table === 'dashboards_active') {
          const result = await client.query(`
            SELECT EXISTS (
              SELECT 1 
              FROM pg_views 
              WHERE viewname = $1
            ) as exists
          `, [table]);
          
          if (result.rows[0].exists) {
            console.log(`✅ ${table} view exists`);
          } else {
            console.log(`❌ ${table} view does not exist`);
          }
        } else {
          const result = await client.query(`
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.tables 
              WHERE table_name = $1
            ) as exists
          `, [table]);
          
          if (result.rows[0].exists) {
            console.log(`✅ ${table} table exists`);
          } else {
            console.log(`❌ ${table} table does not exist`);
          }
        }
      } catch (error) {
        console.log(`❌ Error checking ${table}:`, error.message);
      }
    }
    
    // Check if the tables have data (which would indicate they've been properly seeded)
    console.log('\nChecking if tables have data...\n');
    
    const tablesWithData = [
      'fund_requests',
      'roles_registry',
      'dashboards_registry'
    ];
    
    for (const table of tablesWithData) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          console.log(`✅ ${table} table has ${count} rows of data`);
        } else {
          console.log(`⚠️  ${table} table exists but has no data`);
        }
      } catch (error) {
        console.log(`❌ Error checking data in ${table} table:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error checking specific migrations:', error.message);
  } finally {
    client.release();
  }
}

checkSpecificMigrations();