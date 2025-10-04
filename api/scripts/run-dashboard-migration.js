#!/usr/bin/env node
/**
 * Dashboard Preferences Migration Script
 * 
 * This script creates the dashboard_preferences, dashboard_widgets, and dashboard_templates tables
 * and populates them with default data.
 * 
 * Usage: node api/scripts/run-dashboard-migration.js
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_platform',
  user: process.env.DB_USER || 'subgrant_user',
  password: process.env.DB_PASSWORD || 'subgrant_password',
};

// Create database pool
const pool = new Pool(dbConfig);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    logger.info('🚀 Starting Dashboard Preferences Migration...\n');
    logger.info('📊 Database Configuration:');
    logger.info(`   Host: ${dbConfig.host}`);
    logger.info(`   Port: ${dbConfig.port}`);
    logger.info(`   Database: ${dbConfig.database}`);
    logger.info(`   User: ${dbConfig.user}\n`);

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'create-dashboard-preferences.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    logger.info('📝 Executing migration SQL...\n');

    // Execute the migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    logger.info('✅ Migration completed successfully!\n');

    // Verify the tables were created
    logger.info('🔍 Verifying tables...\n');

    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('dashboard_preferences', 'dashboard_widgets', 'dashboard_templates')
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    logger.info('📋 Created Tables:');
    tablesResult.rows.forEach(row => {
      logger.info(`   ✓ ${row.table_name}`);
    });

    // Count widgets
    const widgetsCountQuery = 'SELECT COUNT(*) as count FROM dashboard_widgets';
    const widgetsCount = await client.query(widgetsCountQuery);
    logger.info(`\n📊 Widgets: ${widgetsCount.rows[0].count} predefined widgets inserted`);

    // Count templates
    const templatesCountQuery = 'SELECT COUNT(*) as count FROM dashboard_templates';
    const templatesCount = await client.query(templatesCountQuery);
    logger.info(`📋 Templates: ${templatesCount.rows[0].count} dashboard templates inserted`);

    // Show templates
    const templatesQuery = 'SELECT id, name, target_role FROM dashboard_templates ORDER BY id';
    const templates = await client.query(templatesQuery);
    logger.info('\n📑 Dashboard Templates:');
    templates.rows.forEach(template => {
      logger.info(`   • ${template.id.padEnd(12)} - ${template.name} (${template.target_role})`);
    });

    logger.info('\n✨ Dashboard Preferences Migration Complete!\n');
    logger.info('Next Steps:');
    logger.info('   1. Restart your API server to load the new routes');
    logger.info('   2. Test the dashboard endpoints at /api/dashboard/*');
    logger.info('   3. Access the Universal Dashboard in the web app\n');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration failed:', error.message);
    logger.error('\nError Details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(error => {
  logger.error('❌ Unexpected error:', error);
  process.exit(1);
});
