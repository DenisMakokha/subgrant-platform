const db = require('../config/database');
const logger = require('../utils/logger');

async function fixOrgDocumentsSchema() {
  try {
    logger.info('Starting org_documents schema fix...');
    
    // Add missing columns to org_documents table
    logger.info('Adding missing columns to org_documents...');
    await db.pool.query(`
      ALTER TABLE org_documents 
      ADD COLUMN IF NOT EXISTS requirement_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS available VARCHAR(10) DEFAULT 'yes',
      ADD COLUMN IF NOT EXISTS na_explanation TEXT,
      ADD COLUMN IF NOT EXISTS note TEXT,
      ADD COLUMN IF NOT EXISTS files_json JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMP
    `);
    
    // Update existing rows to have proper values
    logger.info('Updating existing rows with default values...');
    await db.pool.query(`
      UPDATE org_documents 
      SET 
        requirement_code = COALESCE(requirement_code, 'DOC_' || requirement_id),
        available = COALESCE(available, 'yes'),
        na_explanation = COALESCE(na_explanation, ''),
        note = COALESCE(note, ''),
        files_json = COALESCE(files_json, '[]'::jsonb),
        last_submitted_at = COALESCE(last_submitted_at, uploaded_at)
      WHERE requirement_code IS NULL OR available IS NULL OR files_json IS NULL
    `);
    
    // Create index on requirement_code for better performance
    logger.info('Creating index on requirement_code...');
    await db.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_org_documents_requirement_code 
      ON org_documents(requirement_code)
    `);
    
    // Verify the schema
    logger.info('Verifying org_documents schema...');
    const schemaCheck = await db.pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'org_documents' 
      ORDER BY ordinal_position
    `);
    
    logger.info('Org_documents table schema:');
    schemaCheck.rows.forEach(row => {
      logger.info(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    const documentCount = await db.pool.query('SELECT COUNT(*) FROM org_documents');
    logger.info(`Total org documents: ${documentCount.rows[0].count}`);
    
    logger.info('✅ Org_documents schema fix completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error fixing org_documents schema:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

// Run the migration
fixOrgDocumentsSchema()
  .then(() => {
    logger.info('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });
