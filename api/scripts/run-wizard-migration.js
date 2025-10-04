/**
 * Run Role & Dashboard Wizard Schema Migration
 * Ensures all required tables and columns exist
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const logger = require('../utils/logger');

async function runMigration() {
  const client = await db.pool.connect();
  
  try {
    logger.info('🚀 Starting Role & Dashboard Wizard schema migration...\n');

    // Read SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'ensure-wizard-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute migration
    await client.query(sql);

    logger.info('✅ Migration completed successfully!\n');

    // Verify tables
    logger.info('📊 Verifying schema...\n');

    // Check roles table
    const rolesResult = await client.query(`
      SELECT 
        COUNT(*) as count,
        COUNT(CASE WHEN active = true THEN 1 END) as active_count
      FROM roles
    `);
    logger.info(`✓ Roles table: ${rolesResult.rows[0].count} total, ${rolesResult.rows[0].active_count} active`);

    // Check dashboards table
    const dashboardsResult = await client.query(`
      SELECT 
        COUNT(*) as count,
        COUNT(CASE WHEN active = true THEN 1 END) as active_count
      FROM dashboards
    `);
    logger.info(`✓ Dashboards table: ${dashboardsResult.rows[0].count} total, ${dashboardsResult.rows[0].active_count} active`);

    // Check dashboard_templates table
    const templatesResult = await client.query(`
      SELECT 
        COUNT(*) as count,
        COUNT(CASE WHEN is_system_template = true THEN 1 END) as system_count
      FROM dashboard_templates
    `);
    logger.info(`✓ Dashboard templates table: ${templatesResult.rows[0].count} total, ${templatesResult.rows[0].system_count} system templates`);

    // List all roles
    logger.info('\n📋 Available roles:');
    const rolesList = await client.query(`
      SELECT id, label, active, version,
        jsonb_array_length(caps) as capability_count,
        (SELECT COUNT(*) FROM users WHERE role = roles.id) as user_count
      FROM roles 
      ORDER BY id
    `);
    
    rolesList.rows.forEach(role => {
      const status = role.active ? '✓' : '✗';
      logger.info(`  ${status} ${role.id.padEnd(20)} - ${role.label.padEnd(30)} (v${role.version}, ${role.capability_count} caps, ${role.user_count} users)`);
    });

    // List all dashboards
    logger.info('\n🎨 Dashboard configurations:');
    const dashboardsList = await client.query(`
      SELECT 
        d.role_id,
        r.label as role_label,
        d.active,
        d.version,
        jsonb_array_length(d.menus_json) as menu_count,
        jsonb_array_length(d.pages_json) as page_count,
        jsonb_array_length(d.widgets) as widget_count
      FROM dashboards d
      JOIN roles r ON d.role_id = r.id
      ORDER BY d.role_id
    `);
    
    dashboardsList.rows.forEach(dashboard => {
      const status = dashboard.active ? '✓' : '✗';
      logger.info(`  ${status} ${dashboard.role_id.padEnd(20)} - ${dashboard.role_label.padEnd(30)} (${dashboard.menu_count} menus, ${dashboard.page_count} pages, ${dashboard.widget_count} widgets)`);
    });

    logger.info('\n✨ Role & Dashboard Wizard is ready to use!');
    logger.info('\n📍 Access the wizard at: /admin/wizard');
    logger.info('🔐 Requires admin role with wizard.admin capability\n');

  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
