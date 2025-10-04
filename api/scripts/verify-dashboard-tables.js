const logger = require('../utils/logger');

#!/usr/bin/env node
/**
 * Verify Dashboard Tables Script
 * 
 * This script verifies that the dashboard tables were created successfully
 * and displays their contents.
 */

const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_platform',
  user: process.env.DB_USER || 'subgrant_user',
  password: process.env.DB_PASSWORD || 'subgrant_password',
};

const pool = new Pool(dbConfig);

async function verifyTables() {
  const client = await pool.connect();
  
  try {
    logger.info('🔍 Verifying Dashboard Tables\n');

    // Check table existence
    const tablesQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN ('dashboard_preferences', 'dashboard_widgets', 'dashboard_templates')
      ORDER BY table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    
    logger.info('📋 Tables Status:');
    if (tables.rows.length === 0) {
      logger.info('   ❌ No dashboard tables found. Please run the migration first.\n');
      return;
    }
    
    tables.rows.forEach(row => {
      logger.info(`   ✓ ${row.table_name} (${row.column_count} columns)`);
    });

    // Check widgets
    logger.info('\n📊 Dashboard Widgets:');
    const widgetsQuery = `
      SELECT 
        id, 
        name, 
        widget_type, 
        category, 
        required_capability,
        available_for_roles
      FROM dashboard_widgets 
      ORDER BY category, id
      LIMIT 10;
    `;
    const widgets = await client.query(widgetsQuery);
    const totalWidgets = await client.query('SELECT COUNT(*) as count FROM dashboard_widgets');
    
    logger.info(`   Total: ${totalWidgets.rows[0].count} widgets\n`);
    logger.info('   Sample Widgets:');
    widgets.rows.forEach(w => {
      logger.info(`   • ${w.id}`);
      logger.info(`     Type: ${w.widget_type} | Category: ${w.category}`);
      logger.info(`     Capability: ${w.required_capability || 'none'}`);
      logger.info(`     Roles: ${w.available_for_roles?.join(', ') || 'all'}\n`);
    });

    // Check templates
    logger.info('📑 Dashboard Templates:');
    const templatesQuery = `
      SELECT 
        id, 
        name, 
        target_role, 
        default_layout_columns,
        jsonb_array_length(default_widgets) as widget_count
      FROM dashboard_templates 
      ORDER BY id;
    `;
    const templates = await client.query(templatesQuery);
    
    templates.rows.forEach(t => {
      logger.info(`   • ${t.id.padEnd(12)} - ${t.name}`);
      logger.info(`     Role: ${t.target_role} | Columns: ${t.default_layout_columns} | Widgets: ${t.widget_count}\n`);
    });

    // Check indexes
    logger.info('🔑 Indexes:');
    const indexesQuery = `
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('dashboard_preferences', 'dashboard_widgets', 'dashboard_templates')
      ORDER BY tablename, indexname;
    `;
    const indexes = await client.query(indexesQuery);
    
    const indexesByTable = {};
    indexes.rows.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, idxList]) => {
      logger.info(`   ${table}:`);
      idxList.forEach(idx => logger.info(`     - ${idx}`));
    });

    logger.info('\n✅ Verification Complete!\n');

  } catch (error) {
    logger.error('❌ Verification failed:', error.message);
    logger.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTables().catch(error => {
  logger.error('❌ Unexpected error:', error);
  process.exit(1);
});
