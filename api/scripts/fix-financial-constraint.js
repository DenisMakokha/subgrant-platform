const db = require('../config/database');
const logger = require('../utils/logger');

async function fixFinancialAssessmentsConstraint() {
  try {
    logger.info('Starting financial_assessments constraint fix...');
    
    // First, remove any duplicate records (keep the most recent one)
    logger.info('Removing duplicate records...');
    await db.pool.query(`
      DELETE FROM financial_assessments 
      WHERE id NOT IN (
          SELECT DISTINCT ON (organization_id) id
          FROM financial_assessments 
          ORDER BY organization_id, updated_at DESC
      )
    `);
    
    // Add the unique constraint
    logger.info('Adding unique constraint...');
    await db.pool.query(`
      ALTER TABLE financial_assessments 
      ADD CONSTRAINT unique_financial_assessment_org_id UNIQUE (organization_id)
    `);
    
    // Verify the constraint was added
    logger.info('Verifying constraint...');
    const result = await db.pool.query(`
      SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'financial_assessments' 
          AND tc.constraint_type = 'UNIQUE'
    `);
    
    logger.info('Unique constraints found:', result.rows);
    logger.info('✅ Financial assessments constraint fix completed successfully!');
    
  } catch (error) {
    if (error.code === '23505' || error.message.includes('already exists')) {
      logger.info('✅ Constraint already exists, no action needed');
    } else {
      logger.error('❌ Error fixing financial assessments constraint:', error);
      throw error;
    }
  } finally {
    await db.pool.end();
  }
}

// Run the migration
fixFinancialAssessmentsConstraint()
  .then(() => {
    logger.info('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });
