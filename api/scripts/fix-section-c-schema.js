const db = require('../config/database');
const logger = require('../utils/logger');

async function fixSectionCSchema() {
  try {
    logger.info('Starting Section C schema fix...');
    
    // Add missing columns to document_requirements table
    logger.info('Adding missing columns to document_requirements...');
    await db.pool.query(`
      ALTER TABLE document_requirements 
      ADD COLUMN IF NOT EXISTS code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    
    // Update existing rows to have proper values
    logger.info('Updating existing rows with default values...');
    await db.pool.query(`
      UPDATE document_requirements 
      SET 
        code = COALESCE(code, 'DOC_' || id),
        title = COALESCE(title, name),
        is_optional = COALESCE(is_optional, NOT is_required),
        is_active = COALESCE(is_active, true)
      WHERE code IS NULL OR title IS NULL OR is_optional IS NULL OR is_active IS NULL
    `);
    
    // Insert some default document requirements if none exist
    const existingCount = await db.pool.query('SELECT COUNT(*) FROM document_requirements');
    if (parseInt(existingCount.rows[0].count) === 0) {
      logger.info('Inserting default document requirements...');
      await db.pool.query(`
        INSERT INTO document_requirements (code, name, title, description, category, is_required, is_optional, is_active, sort_order) VALUES
        ('CERT_INCORP', 'Certificate of Incorporation', 'Certificate of Incorporation', 'Legal document establishing the organization', 'legal', true, false, true, 1),
        ('TAX_EXEMPT', 'Tax Exemption Certificate', 'Tax Exemption Certificate', 'Document proving tax-exempt status', 'legal', true, false, true, 2),
        ('BYLAWS', 'Organizational Bylaws', 'Organizational Bylaws', 'Internal governance rules and procedures', 'governance', true, false, true, 3),
        ('BOARD_RES', 'Board Resolution', 'Board Resolution', 'Resolution authorizing grant application', 'governance', true, false, true, 4),
        ('AUDIT_REPORT', 'Latest Audit Report', 'Latest Audit Report', 'Most recent financial audit', 'financial', true, false, true, 5),
        ('BANK_LETTER', 'Bank Reference Letter', 'Bank Reference Letter', 'Letter from primary banking institution', 'financial', false, true, true, 6),
        ('ORG_CHART', 'Organizational Chart', 'Organizational Chart', 'Current organizational structure', 'operational', false, true, true, 7),
        ('INSURANCE', 'Insurance Certificate', 'Insurance Certificate', 'Proof of organizational insurance coverage', 'compliance', true, false, true, 8)
      `);
    }
    
    // Verify the schema
    logger.info('Verifying schema...');
    const schemaCheck = await db.pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'document_requirements' 
      ORDER BY ordinal_position
    `);
    
    logger.info('Document requirements table schema:');
    schemaCheck.rows.forEach(row => {
      logger.info(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    const requirementCount = await db.pool.query('SELECT COUNT(*) FROM document_requirements');
    logger.info(`Total document requirements: ${requirementCount.rows[0].count}`);
    
    logger.info('✅ Section C schema fix completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error fixing Section C schema:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

// Run the migration
fixSectionCSchema()
  .then(() => {
    logger.info('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });
