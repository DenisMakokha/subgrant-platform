const db = require('../config/database');
const logger = require('../utils/logger');

async function checkMigrationStatus() {
  const client = await db.pool.connect();
  
  try {
    // Check if the key tables from each migration exist
    const tablesToCheck = [
      // Q1 SSOT Cutover tables
      'project_template_sets',
      'project_template_items',
      'partner_budgets',
      'partner_budget_templates',
      'partner_budget_lines',
      'fund_requests',
      'review_threads',
      'review_comments',
      'recon_line_evidence',
      'audit_log',
      'notifications',
      'action_idempotency',
      'notif_inbox',
      'approval_policies',
      'approvals',
      'approval_comments',
      'approval_docs',
      'roles_registry',
      'dashboards_registry',
      'users_roles',
      
      // Q4 Budget SSOT tables
      'budget_templates',
      'budgets',
      'budget_line_categories',
      'budget_lines',
      'budget_review_threads',
      'budget_review_comments',
      'budget_workflow_transitions',
      
      // Q4 Contract SSOT tables
      'contract_templates',
      'contracts',
      'contract_amendments',
      'contract_workflow_transitions',
      'contract_milestones',
      'contract_deliverables',
      'contract_payments',
      'contract_reporting_requirements',
      'contract_reporting_submissions',
      
      // Q4 Email SSOT tables
      'email_templates',
      'email_senders',
      'email_providers',
      'email_outbox',
      'email_deliveries',
      'email_suppressions',
      'email_preferences',
      'email_digests'
    ];
    
    logger.info('Checking migration status...\n');
    
    for (const table of tablesToCheck) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = $1
          ) as exists
        `, [table]);
        
        if (result.rows[0].exists) {
          logger.info(`✅ ${table} table exists`);
        } else {
          logger.info(`❌ ${table} table does not exist`);
        }
      } catch (error) {
        logger.info(`❌ Error checking ${table} table:`, error.message);
      }
    }
    
    // Check if legacy tables exist (which would indicate Q1 migration was run)
    const legacyTablesToCheck = [
      'budgets_legacy',
      'budget_lines_legacy',
      'review_comments_legacy',
      'audit_logs_legacy',
      'notifications_legacy'
    ];
    
    logger.info('\nChecking legacy tables (indicates Q1 SSOT cutover was executed)...\n');
    
    for (const table of legacyTablesToCheck) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = $1
          ) as exists
        `, [table]);
        
        if (result.rows[0].exists) {
          logger.info(`✅ ${table} table exists (Q1 migration was executed)`);
        } else {
          logger.info(`❌ ${table} table does not exist (Q1 migration may not have been executed)`);
        }
      } catch (error) {
        logger.info(`❌ Error checking ${table} table:`, error.message);
      }
    }
    
    // Check if the notif_event_catalog table exists (indicates notifications migration was run)
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_name = 'notif_event_catalog'
        ) as exists
      `);
      
      if (result.rows[0].exists) {
        logger.info('\n✅ notif_event_catalog table exists (Notifications migration was executed)');
      } else {
        logger.info('\n❌ notif_event_catalog table does not exist (Notifications migration may not have been executed)');
      }
    } catch (error) {
      logger.info('\n❌ Error checking notif_event_catalog table:', error.message);
    }
    
  } catch (error) {
    logger.error('Error checking migration status:', error.message);
  } finally {
    client.release();
  }
}

checkMigrationStatus();